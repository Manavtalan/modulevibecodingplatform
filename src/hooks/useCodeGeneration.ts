import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CodeFile } from "@/pages/ModuleStudio";
import { FilePlan } from "@/components/GenerationProgress";

// Force reload timestamp: 2025-11-07 22:00:00 - BULLETPROOF VERSION v5.0

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

export interface DiagnosticInfo {
  rawContent: string;
  extractionMethod: string;
  fileMarkersFound: number;
  codeBlocksFound: number;
  parsingErrors: string[];
}

export const useCodeGeneration = () => {
  // VERSION CHECK - Should see this in console
  useEffect(() => {
    console.log('%c🛡️ CODE GENERATION HOOK v5.0 - BULLETPROOF 🛡️', 'background: #00ff00; color: #000000; font-size: 24px; padding: 15px; font-weight: bold;');
    console.log('%c📅 Build timestamp: 2025-11-07 22:00:00', 'background: #0000ff; color: #ffffff; font-size: 16px; padding: 5px;');
    console.log('%c✅ MULTI-STRATEGY PARSING + DIAGNOSTICS ACTIVE', 'background: #ff6600; color: #ffffff; font-size: 16px; padding: 5px;');
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
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [rawOutputAvailable, setRawOutputAvailable] = useState(false);

  // BULLETPROOF: Multi-strategy file extraction with diagnostics
  const extractFilesFromContent = (content: string): { files: CodeFile[], diagnostic: DiagnosticInfo } => {
    console.log('%c🔍 BULLETPROOF FILE EXTRACTION STARTING', 'background: #0066ff; color: #ffffff; font-size: 14px; padding: 5px;');
    console.log(`   Total content length: ${content.length} bytes`);
    
    const diagnostic: DiagnosticInfo = {
      rawContent: content,
      extractionMethod: 'none',
      fileMarkersFound: 0,
      codeBlocksFound: 0,
      parsingErrors: []
    };
    
    let files: CodeFile[] = [];
    
    // STRATEGY 1: Standard [FILE:path]...[/FILE] markers
    console.log('📋 Strategy 1: Looking for [FILE:path] markers...');
    const fileRegex = /\[FILE:(.*?)\]([\s\S]*?)\[\/FILE\]/g;
    let match;
    let markersFound = 0;
    
    while ((match = fileRegex.exec(content)) !== null) {
      markersFound++;
      const path = match[1].trim();
      const fileContent = match[2].trim();
      
      console.log(`   ✅ Marker #${markersFound}: ${path} (${fileContent.length} bytes)`);
      
      files.push({ path, content: fileContent });
    }
    
    diagnostic.fileMarkersFound = markersFound;
    
    if (files.length > 0) {
      diagnostic.extractionMethod = 'file-markers';
      console.log(`✅ Strategy 1 SUCCESS: ${files.length} files extracted via markers`);
      return { files, diagnostic };
    }
    
    console.warn('⚠️ Strategy 1 FAILED: No file markers found');
    diagnostic.parsingErrors.push('No [FILE:path] markers detected');
    
    // STRATEGY 2: Detect code blocks with file paths
    console.log('📋 Strategy 2: Looking for markdown code blocks with file paths...');
    const codeBlockRegex = /```(\w+)\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]*?)```/g;
    let blockMatch;
    let blocksFound = 0;
    
    while ((blockMatch = codeBlockRegex.exec(content)) !== null) {
      blocksFound++;
      const language = blockMatch[1];
      const possiblePath = blockMatch[2];
      const code = blockMatch[3].trim();
      
      // Try to infer file path
      let path = possiblePath || `file${blocksFound}.${language}`;
      
      console.log(`   📝 Code block #${blocksFound}: ${path} (${code.length} bytes, lang: ${language})`);
      
      files.push({ path, content: code });
    }
    
    diagnostic.codeBlocksFound = blocksFound;
    
    if (files.length > 0) {
      diagnostic.extractionMethod = 'code-blocks';
      console.log(`✅ Strategy 2 SUCCESS: ${files.length} files extracted from code blocks`);
      return { files, diagnostic };
    }
    
    console.warn('⚠️ Strategy 2 FAILED: No code blocks found');
    diagnostic.parsingErrors.push('No markdown code blocks detected');
    
    // STRATEGY 3: Heuristic detection - look for common file patterns
    console.log('📋 Strategy 3: Heuristic file detection...');
    
    // Try to detect HTML
    if (/<html|<!DOCTYPE/i.test(content)) {
      console.log('   🔍 Detected HTML content');
      files.push({ path: 'index.html', content: content });
      diagnostic.extractionMethod = 'heuristic-html';
    }
    
    // Try to detect CSS
    if (/^[\s\S]*{[\s\S]*:[\s\S]*;[\s\S]*}/.test(content) && !/<html/i.test(content)) {
      console.log('   🔍 Detected CSS content');
      files.push({ path: 'styles.css', content: content });
      diagnostic.extractionMethod = 'heuristic-css';
    }
    
    // Try to detect JavaScript
    if (/(function|const|let|var|=>|import|export)/i.test(content) && !/<html/i.test(content)) {
      console.log('   🔍 Detected JavaScript content');
      files.push({ path: 'script.js', content: content });
      diagnostic.extractionMethod = 'heuristic-js';
    }
    
    if (files.length > 0) {
      console.log(`✅ Strategy 3 SUCCESS: ${files.length} files detected heuristically`);
      return { files, diagnostic };
    }
    
    console.error('❌ ALL STRATEGIES FAILED!');
    diagnostic.parsingErrors.push('All extraction strategies failed');
    diagnostic.parsingErrors.push(`Content preview: ${content.substring(0, 200)}...`);
    
    // LAST RESORT: Provide raw content as single file
    console.warn('🚨 LAST RESORT: Creating single file with raw content');
    files.push({ 
      path: 'output.txt', 
      content: content || 'No content generated' 
    });
    diagnostic.extractionMethod = 'fallback-raw';
    diagnostic.parsingErrors.push('Using fallback: raw content as single file');
    
    return { files, diagnostic };
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
      const { files: extractedFiles, diagnostic } = extractFilesFromContent(accumulatedContent);
      
      console.log(`✅ File extraction complete: ${extractedFiles.length} files`);
      console.log('📊 Diagnostic Info:', diagnostic);
      
      setGeneratedFiles(extractedFiles);
      setDiagnosticInfo(diagnostic);
      setRawOutputAvailable(true);
      
      if (extractedFiles.length > 0 && diagnostic.extractionMethod === 'file-markers') {
        console.log(`\n✅ SUCCESS: Extracted ${extractedFiles.length} files via standard markers`);
        extractedFiles.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.path} (${file.content.length} characters)`);
        });
        setGenerationPhase('complete');
        setCurrentFile(null);
      } else if (extractedFiles.length > 0) {
        console.warn(`\n⚠️ PARTIAL SUCCESS: Extracted ${extractedFiles.length} files using fallback method: ${diagnostic.extractionMethod}`);
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
    console.log('🔄 Resetting generation state');
    setIsGenerating(false);
    setGenerationPhase('idle');
    setCurrentFile(null);
    setGeneratedFiles([]);
    setFilePlan([]);
    setError(null);
    setQualityCheck(null);
    setTokenValidation(null);
    setDiagnosticInfo(null);
    setRawOutputAvailable(false);
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
    diagnosticInfo,
    rawOutputAvailable,
    generateCode,
    resetGeneration
  };
};
