import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CodeFile } from "@/pages/ModuleStudio";
import { FilePlan } from "@/components/GenerationProgress";

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

    console.log('Starting SSE stream parsing...');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream reading complete');
          // Final flush - save any remaining file
          if (currentFilePath && currentFileContent.trim()) {
            console.log('Final flush - saving remaining file:', currentFilePath);
            setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent.trim() }]);
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
            
            // First, try to extract content from JSON wrapper
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                data = parsed.content; // Extract the actual content
              } else if (parsed.done === true) {
                // Handle completion with metadata
                if (currentFilePath && currentFileContent.trim()) {
                  setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent.trim() }]);
                }
                
                // Handle quality check if present
                if (parsed.quality_check) {
                  setQualityCheck(parsed.quality_check);
                  console.log('Quality check:', parsed.quality_check);
                }
                
                // Handle token validation if present
                if (parsed.token_validation) {
                  setTokenValidation(parsed.token_validation);
                  console.log('Token validation:', parsed.token_validation);
                }
                
                setGenerationPhase('complete');
                setCurrentFile(null);
                continue;
              }
            } catch {
              // Not JSON or doesn't have content field, use data as-is
            }
            
            if (data === '[DONE]') {
              if (currentFilePath && currentFileContent.trim()) {
                console.log('Saving file on [DONE]:', currentFilePath);
                setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent.trim() }]);
              }
              setGenerationPhase('complete');
              setCurrentFile(null);
              continue;
            }

            // Parse [PLAN] marker
            if (data.startsWith('[PLAN]')) {
              setGenerationPhase('planning');
              const planContent = data.substring('[PLAN]'.length).trim();
              try {
                const plan = JSON.parse(planContent);
                setFilePlan(plan.files || []);
              } catch (e) {
                console.error("Failed to parse plan:", e);
              }
              continue;
            }

            // Parse [FILE:filename] marker
            if (data.startsWith('[FILE:')) {
              // Save previous file if exists
              if (currentFilePath && currentFileContent.trim()) {
                console.log('Saving completed file:', currentFilePath, 'Length:', currentFileContent.length);
                setGeneratedFiles(prev => {
                  const newFile = { path: currentFilePath, content: currentFileContent.trim() };
                  console.log('Adding file to array:', prev.length, '->', prev.length + 1);
                  return [...prev, newFile];
                });
              }
              
              // Start new file
              setGenerationPhase('generating');
              const match = data.match(/\[FILE:(.*?)\]/);
              if (match) {
                currentFilePath = match[1].trim();
                currentFileContent = '';
                setCurrentFile(currentFilePath);
                console.log('Starting new file:', currentFilePath);
              }
              continue;
            }

            // Parse [/FILE] marker
            if (data.startsWith('[/FILE]')) {
              if (currentFilePath && currentFileContent.trim()) {
                console.log('File marker ended:', currentFilePath, 'Length:', currentFileContent.length);
                setGeneratedFiles(prev => {
                  const newFile = { path: currentFilePath, content: currentFileContent.trim() };
                  console.log('Adding file to array (from /FILE):', prev.length, '->', prev.length + 1);
                  return [...prev, newFile];
                });
                currentFilePath = '';
                currentFileContent = '';
              }
              continue;
            }

            // Parse [COMPLETE] marker
            if (data.startsWith('[COMPLETE]')) {
              // Save any remaining file
              if (currentFilePath && currentFileContent.trim()) {
                console.log('Saving final file:', currentFilePath);
                setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent.trim() }]);
              }
              console.log('Generation complete marker received');
              setGenerationPhase('complete');
              setCurrentFile(null);
              continue;
            }

            // Parse [ERROR] marker
            if (data.startsWith('[ERROR]')) {
              const errorMsg = data.substring('[ERROR]'.length).trim();
              console.error('Generation error:', errorMsg);
              setGenerationPhase('error');
              setError(errorMsg);
              continue;
            }

            // Regular content - append to current file ONLY (don't update state yet)
            if (currentFilePath) {
              currentFileContent += data + '\n';
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
    setIsGenerating(true);
    setGenerationPhase('planning');
    setError(null);
    setGeneratedFiles([]);
    setFilePlan([]);
    setCurrentFile(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://ryhhskssaplqakovldlp.supabase.co/functions/v1/generate-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          },
          body: JSON.stringify({
            prompt: params.prompt,
            codeType: params.codeType,
            model: params.model,
            conversationId: params.conversationId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      await parseSSEStream(reader);

    } catch (err: any) {
      console.error("Code generation error:", err);
      setError(err.message || "Failed to generate code");
      setGenerationPhase('error');
    } finally {
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
