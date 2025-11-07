import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CodeFile } from "@/pages/ModuleStudio";
import { FilePlan } from "@/components/GenerationProgress";

// Force reload timestamp: 2025-11-07 14:37:00

interface GenerateCodeParams {
  prompt: string;
  codeType: string;
  model: string;
  conversationId?: string;
}

type GenerationPhase = 'idle' | 'planning' | 'generating' | 'complete' | 'error';

interface QualityCheck {
  valid: boolean;
  suggestions: string[];
}

interface TokenValidation {
  valid: boolean;
  issues: string[];
}

export const useCodeGeneration = () => {
  // VERSION CHECK - Should see this in console
  useEffect(() => {
    console.log('🔧 CODE GENERATION HOOK v2.0 LOADED - Enhanced Debugging Active');
    console.log('📅 Build timestamp: 2025-11-07 14:37:00');
    return () => {
      console.log('🔧 Code generation hook unmounting');
    };
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<CodeFile[]>([]);
  const [filePlan, setFilePlan] = useState<FilePlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);
  const [tokenValidation, setTokenValidation] = useState<TokenValidation | null>(null);

  const parseSSEStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let buffer = '';
    let currentFilePath = '';
    let currentFileContent = '';
    let accumulatedFiles: CodeFile[] = [];

    console.log('🚀 Starting SSE stream parsing...');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream reading complete');
          // Final flush - save any remaining file
          if (currentFilePath && currentFileContent.trim()) {
            console.log('📁 Final flush - saving remaining file:', currentFilePath, 'Size:', currentFileContent.length);
            accumulatedFiles.push({ path: currentFilePath, content: currentFileContent.trim() });
          }
          
          // Update state with all accumulated files at once
          if (accumulatedFiles.length > 0) {
            console.log('💾 Setting all files:', accumulatedFiles.length, 'files');
            setGeneratedFiles(accumulatedFiles);
          } else {
            console.error('⚠️ No files were accumulated during parsing!');
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            let data = line.slice(6);
            console.log('📨 Received SSE line:', data.substring(0, 100));
            
            // First, try to extract content from JSON wrapper
            let isJSON = false;
            try {
              const parsed = JSON.parse(data);
              isJSON = true;
              
              if (parsed.content) {
                data = parsed.content; // Extract the actual content
                console.log('📦 Extracted content:', data.substring(0, 50));
              } else if (parsed.done === true) {
                console.log('✅ Received completion signal');
                // Handle completion with metadata
                if (currentFilePath && currentFileContent.trim()) {
                  console.log('📁 Saving final file on completion:', currentFilePath);
                  accumulatedFiles.push({ path: currentFilePath, content: currentFileContent.trim() });
                }
                
                // Handle quality check if present
                if (parsed.quality_check) {
                  setQualityCheck(parsed.quality_check);
                  console.log('✨ Quality check received:', parsed.quality_check);
                }
                
                // Handle token validation if present
                if (parsed.token_validation) {
                  setTokenValidation(parsed.token_validation);
                  console.log('🔍 Token validation received:', parsed.token_validation);
                }
                
                // Set all accumulated files
                if (accumulatedFiles.length > 0) {
                  console.log('💾 Setting files from completion:', accumulatedFiles.length);
                  setGeneratedFiles(accumulatedFiles);
                }
                
                setGenerationPhase('complete');
                setCurrentFile(null);
                continue;
              }
            } catch (e) {
              // Not JSON or parsing failed, use data as-is
              if (!isJSON) {
                console.log('📝 Raw data (not JSON):', data.substring(0, 50));
              } else {
                console.error('❌ JSON parsing error:', e);
              }
            }
            
            // Check for [DONE] marker (legacy support)
            if (data === '[DONE]') {
              console.log('📍 [DONE] marker received');
              if (currentFilePath && currentFileContent.trim()) {
                console.log('📁 Saving file on [DONE]:', currentFilePath);
                accumulatedFiles.push({ path: currentFilePath, content: currentFileContent.trim() });
              }
              if (accumulatedFiles.length > 0) {
                setGeneratedFiles(accumulatedFiles);
              }
              setGenerationPhase('complete');
              setCurrentFile(null);
              continue;
            }

            // Parse [PLAN] marker
            if (data.startsWith('[PLAN]')) {
              console.log('📋 [PLAN] marker found');
              setGenerationPhase('planning');
              const planContent = data.substring('[PLAN]'.length).trim();
              try {
                const plan = JSON.parse(planContent);
                setFilePlan(plan.files || []);
                console.log('📋 Plan set:', plan.files?.length, 'files');
              } catch (e) {
                console.error("❌ Failed to parse plan:", e);
              }
              continue;
            }

            // Parse [FILE:filename] marker
            if (data.startsWith('[FILE:')) {
              console.log('📄 [FILE:] marker found');
              // Save previous file if exists
              if (currentFilePath && currentFileContent.trim()) {
                console.log('💾 Saving completed file:', currentFilePath, 'Size:', currentFileContent.length);
                accumulatedFiles.push({ path: currentFilePath, content: currentFileContent.trim() });
                console.log('📊 Files accumulated so far:', accumulatedFiles.length);
              }
              
              // Start new file
              setGenerationPhase('generating');
              const match = data.match(/\[FILE:(.*?)\]/);
              if (match) {
                currentFilePath = match[1].trim();
                currentFileContent = '';
                setCurrentFile(currentFilePath);
                console.log('✨ Starting new file:', currentFilePath);
              } else {
                console.error('❌ Failed to extract filename from:', data);
              }
              continue;
            }

            // Parse [/FILE] marker
            if (data.startsWith('[/FILE]')) {
              console.log('📍 [/FILE] marker found');
              if (currentFilePath && currentFileContent.trim()) {
                console.log('💾 File ended:', currentFilePath, 'Size:', currentFileContent.length);
                accumulatedFiles.push({ path: currentFilePath, content: currentFileContent.trim() });
                console.log('📊 Files accumulated:', accumulatedFiles.length);
                currentFilePath = '';
                currentFileContent = '';
              }
              continue;
            }

            // Parse [COMPLETE] marker
            if (data.startsWith('[COMPLETE]')) {
              console.log('✅ [COMPLETE] marker received');
              // Save any remaining file
              if (currentFilePath && currentFileContent.trim()) {
                console.log('💾 Saving final file:', currentFilePath);
                accumulatedFiles.push({ path: currentFilePath, content: currentFileContent.trim() });
              }
              if (accumulatedFiles.length > 0) {
                console.log('💾 Setting all files from COMPLETE:', accumulatedFiles.length);
                setGeneratedFiles(accumulatedFiles);
              }
              console.log('✅ Generation complete marker received');
              setGenerationPhase('complete');
              setCurrentFile(null);
              continue;
            }

            // Parse [ERROR] marker
            if (data.startsWith('[ERROR]')) {
              const errorMsg = data.substring('[ERROR]'.length).trim();
              console.error('❌ Generation error:', errorMsg);
              setGenerationPhase('error');
              setError(errorMsg);
              continue;
            }

            // Regular content - append to current file
            if (currentFilePath) {
              currentFileContent += data;
              // Only log periodically to avoid spam
              if (currentFileContent.length % 500 === 0) {
                console.log('📝 Accumulating content for', currentFilePath, 'size:', currentFileContent.length);
              }
            } else {
              console.warn('⚠️ Received content without active file:', data.substring(0, 50));
            }
          }
        }
      }
    } catch (error) {
      console.error('SSE stream parsing error:', error);
      setGenerationPhase('error');
      setError(error instanceof Error ? error.message : 'Stream parsing failed');
    }
  };

  const generateCode = async (params: GenerateCodeParams) => {
    console.log('🎬 Starting code generation:', params);
    setIsGenerating(true);
    setGenerationPhase('planning');
    setError(null);
    setGeneratedFiles([]);
    setFilePlan([]);
    setCurrentFile(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Auth session:', session ? 'Valid' : 'Invalid');
      
      const requestBody = {
        prompt: params.prompt,
        codeType: params.codeType,
        model: params.model,
        conversationId: params.conversationId
      };
      
      console.log('📤 Sending request:', {
        url: 'https://ryhhskssaplqakovldlp.supabase.co/functions/v1/generate-code',
        body: requestBody,
        hasAuth: !!session?.access_token
      });
      
      const response = await fetch(
        'https://ryhhskssaplqakovldlp.supabase.co/functions/v1/generate-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log('📥 Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        console.error('❌ No response body');
        throw new Error("No response body");
      }

      console.log('📖 Starting to read response stream...');
      const reader = response.body.getReader();
      await parseSSEStream(reader);
      
      console.log('✅ Stream parsing completed');

    } catch (err: any) {
      console.error("❌ Code generation error:", err);
      console.error("Error stack:", err.stack);
      setError(err.message || "Failed to generate code");
      setGenerationPhase('error');
    } finally {
      console.log('🏁 Generation process finished');
      setIsGenerating(false);
    }
  };

  const resetGeneration = () => {
    setIsGenerating(false);
    setGenerationPhase('idle');
    setCurrentFile(null);
    setGeneratedFiles([]);
    setFilePlan([]);
    setError(null);
    setQualityCheck(null);
    setTokenValidation(null);
  };

  return {
    isGenerating,
    generationPhase,
    currentFile,
    generatedFiles,
    filePlan,
    error,
    qualityCheck,
    tokenValidation,
    generateCode,
    resetGeneration
  };
};
