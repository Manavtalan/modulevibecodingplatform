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
    
  };

  // Parse JSON response from generate-code edge function
  const parseJSONResponse = async (response: Response): Promise<CodeFile[]> => {
    console.log('%c📦 PARSING JSON RESPONSE', 'background: #0066ff; color: #ffffff; font-size: 14px; padding: 5px;');
    
    try {
      const data = await response.json();
      console.log('📥 Received data:', data);
      
      // Validate response structure
      if (!data.files || typeof data.files !== 'object') {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response: missing files object');
      }
      
      // Convert files object to CodeFile array
      const files: CodeFile[] = [];
      for (const [path, content] of Object.entries(data.files)) {
        if (typeof content !== 'string') {
          console.error(`❌ Invalid content type for ${path}:`, typeof content);
          throw new Error(`Invalid file content type for ${path}`);
        }
        
        if (content.trim().length === 0) {
          console.error(`❌ Empty file content for ${path}`);
          throw new Error(`Empty file: ${path}`);
        }
        
        console.log(`✅ Parsed file: ${path} (${content.length} bytes)`);
        files.push({ path, content });
      }
      
      // Validate that src/App.tsx exists
      const hasAppTsx = files.some(f => f.path === 'src/App.tsx' || f.path === '/src/App.tsx');
      if (!hasAppTsx) {
        console.error('❌ Missing required file: src/App.tsx');
        console.error('Available files:', files.map(f => f.path));
        throw new Error('Missing required file: src/App.tsx');
      }
      
      console.log(`✅ Successfully parsed ${files.length} files`);
      return files;
      
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      throw error;
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

      console.log('📖 Parsing JSON response...');
      const files = await parseJSONResponse(response);
      
      console.log('✅ Files parsed successfully:', files.length);
      setGeneratedFiles(files);
      setGenerationPhase('complete');

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
