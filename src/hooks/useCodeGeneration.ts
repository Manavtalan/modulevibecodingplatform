import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CodeFile } from "@/pages/ModuleStudio";
import { FilePlan } from "@/components/GenerationProgress";

// Force reload timestamp: 2025-11-07 20:41:00 - COMPLETE REWRITE

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
    console.log('🔧 CODE GENERATION HOOK v3.0 LOADED - COMPLETE ACCUMULATION FIX');
    console.log('📅 Build timestamp: 2025-11-07 20:41:00');
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

  // Helper function to extract files from accumulated content
  const extractFilesFromContent = (content: string): CodeFile[] => {
    console.log('\n🔍 EXTRACTING FILES FROM ACCUMULATED CONTENT');
    console.log(`📊 Total content length: ${content.length} characters`);
    console.log(`📝 Content preview (first 500 chars):\n${content.substring(0, 500)}`);
    
    const files: CodeFile[] = [];
    
    // Find all [FILE:path]...[/FILE] blocks using regex
    const fileRegex = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
    let match;
    let matchCount = 0;
    
    while ((match = fileRegex.exec(content)) !== null) {
      matchCount++;
      const path = match[1].trim();
      const fileContent = match[2].trim();
      
      console.log(`\n📄 FILE #${matchCount} EXTRACTED:`);
      console.log(`   Path: ${path}`);
      console.log(`   Size: ${fileContent.length} characters`);
      console.log(`   Preview: ${fileContent.substring(0, 100)}...`);
      
      files.push({
        path: path,
        content: fileContent
      });
    }
    
    console.log(`\n✨ EXTRACTION COMPLETE: Found ${files.length} files`);
    
    // If no file markers found, log diagnostic info
    if (files.length === 0) {
      console.error('\n⚠️ NO [FILE:...] MARKERS FOUND!');
      console.log('🔍 Checking for partial markers...');
      console.log(`   Contains "[FILE:": ${content.includes('[FILE:')}`);
      console.log(`   Contains "[/FILE]": ${content.includes('[/FILE]')}`);
      console.log(`   Contains "[PLAN]": ${content.includes('[PLAN]')}`);
      console.log(`   Contains "[COMPLETE]": ${content.includes('[COMPLETE]')}`);
      
      // Show more content for debugging
      console.log(`\n📝 Full content (first 1000 chars):\n${content.substring(0, 1000)}`);
      if (content.length > 1000) {
        console.log(`\n📝 Full content (last 500 chars):\n${content.substring(content.length - 500)}`);
      }
    }
    
    return files;
  };

  const parseSSEStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedContent = ''; // NEW: Accumulate ALL content here
    let messageCount = 0;
    let planContent = '';

    console.log('\n🚀 === STARTING SSE STREAM PARSING (v3.0) ===');
    console.log('Strategy: Accumulate all content first, then parse for files at the end\n');

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('\n🏁 Stream reading complete');
          console.log(`📊 Total messages received: ${messageCount}`);
          console.log(`📊 Total accumulated content: ${accumulatedContent.length} characters`);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            messageCount++;
            
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(data);
              
              // Accumulate content from JSON-wrapped messages
              if (parsed.content) {
                accumulatedContent += parsed.content;
                
                // Log every 10 messages to track progress
                if (messageCount % 10 === 0) {
                  console.log(`📦 Message #${messageCount}: Accumulated ${accumulatedContent.length} chars total`);
                }
                
                // Update UI state for planning/generating phases
                if (accumulatedContent.includes('[PLAN]') && !planContent) {
                  setGenerationPhase('planning');
                  console.log('📋 Detected [PLAN] marker - entering planning phase');
                }
                if (accumulatedContent.includes('[FILE:')) {
                  setGenerationPhase('generating');
                  // Extract current file name for UI feedback
                  const fileMatch = accumulatedContent.match(/\[FILE:([^\]]+)\][^\[]*$/);
                  if (fileMatch) {
                    setCurrentFile(fileMatch[1].trim());
                  }
                }
              }
              
              // Handle completion signal
              if (parsed.done === true) {
                console.log('\n✅ Received completion signal (done: true)');
                
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
                
                break;
              }
            } catch (e) {
              // Not JSON - accumulate raw content
              accumulatedContent += data;
              
              if (messageCount % 10 === 0) {
                console.log(`📝 Message #${messageCount}: Raw data accumulated (${data.length} chars)`);
              }
              
              // Check for legacy markers
              if (data === '[DONE]' || data === '[COMPLETE]') {
                console.log(`\n✅ Received completion marker: ${data}`);
                break;
              }
            }
          }
        }
      }

      console.log('\n📊 === STREAM ACCUMULATION SUMMARY ===');
      console.log(`Messages processed: ${messageCount}`);
      console.log(`Total content accumulated: ${accumulatedContent.length} characters`);
      console.log(`Content starts with: ${accumulatedContent.substring(0, 100)}`);
      console.log(`Content ends with: ${accumulatedContent.substring(Math.max(0, accumulatedContent.length - 100))}`);

      // NOW parse the complete accumulated content for files
      console.log('\n🔍 Starting file extraction from accumulated content...');
      const extractedFiles = extractFilesFromContent(accumulatedContent);
      
      if (extractedFiles.length > 0) {
        console.log(`\n✅ SUCCESS: Extracted ${extractedFiles.length} files`);
        extractedFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.path} (${file.content.length} characters)`);
        });
        
        // Update state with all extracted files at once
        setGeneratedFiles(extractedFiles);
        setGenerationPhase('complete');
        setCurrentFile(null);
      } else {
        console.error('\n❌ FAILURE: No files were extracted');
        setGenerationPhase('error');
        setError('No files were generated. The AI response may not have contained the expected file markers.');
      }

    } catch (error) {
      console.error('\n❌ SSE STREAM PARSING ERROR:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      setGenerationPhase('error');
      setError(error instanceof Error ? error.message : 'Stream parsing failed');
    }
    
    console.log('\n🏁 === PARSING COMPLETE ===\n');
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
