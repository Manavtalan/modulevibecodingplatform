// FIXED MODULE CODE GENERATION HOOK WITH QUALITY VALIDATION
import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface FilePlan {
  path: string;
  description: string;
}

export interface DiagnosticInfo {
  extractionMethod: string;
  fileMarkersFound: number;
  codeBlocksFound: number;
  parsingErrors: string[];
  rawContent: string;
}

export interface GenerateCodeParams {
  prompt: string;
  codeType: string;
  model?: string;
  conversationId?: string;
}

type GenerationPhase = 'planning' | 'generating' | 'complete' | 'error';

export const useCodeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<CodeFile[]>([]);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('planning');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [filePlan, setFilePlan] = useState<FilePlan[]>([]);
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quality validation function
  const validateModernStandards = (files: CodeFile[]): { passed: boolean; score: number; issues: string[] } => {
    const content = files.map(f => f.content).join(' ').toLowerCase();
    const issues: string[] = [];
    let score = 100;
    
    // Check for modern patterns
    const modernPatterns = {
      tailwindCSS: content.includes('tailwind') || content.includes('bg-') || content.includes('text-'),
      gradients: content.includes('gradient-to-') || content.includes('linear-gradient'),
      glassmorphism: content.includes('backdrop-blur') && content.includes('bg-white/'),
      animations: content.includes('transition') || content.includes('animate-') || content.includes('hover:'),
      responsiveDesign: content.includes('md:') || content.includes('lg:') || content.includes('@media'),
      modernTypography: content.includes('font-') && content.includes('text-') && content.includes('leading-'),
    };

    // Score deductions for missing patterns
    if (!modernPatterns.tailwindCSS) {
      score -= 25;
      issues.push('Missing Tailwind CSS for modern styling');
    }
    if (!modernPatterns.gradients) {
      score -= 20;
      issues.push('Missing gradient backgrounds for visual depth');
    }
    if (!modernPatterns.glassmorphism) {
      score -= 15;
      issues.push('Missing glassmorphism effects (backdrop-blur, transparency)');
    }
    if (!modernPatterns.animations) {
      score -= 20;
      issues.push('Missing smooth hover animations and transitions');
    }
    if (!modernPatterns.responsiveDesign) {
      score -= 15;
      issues.push('Missing responsive design patterns');
    }
    if (!modernPatterns.modernTypography) {
      score -= 5;
      issues.push('Missing modern typography with proper spacing');
    }

    // File structure requirements
    const hasProperStructure = files.length >= 3;
    if (!hasProperStructure) {
      score -= 20;
      issues.push('Insufficient file structure (needs minimum 3 files)');
    }

    console.log('Quality validation:', {
      score,
      patterns: modernPatterns,
      fileCount: files.length,
      issues
    });
    
    return {
      passed: score >= 80 && modernPatterns.tailwindCSS,
      score,
      issues
    };
  };

  // Helper function to get language from file path
  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx': return 'typescript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'js': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  // Enhanced file parsing with better error handling
  const parseStreamedContent = (content: string): { files: CodeFile[]; diagnostics: DiagnosticInfo } => {
    const diagnostics: DiagnosticInfo = {
      extractionMethod: 'unknown',
      fileMarkersFound: 0,
      codeBlocksFound: 0,
      parsingErrors: [],
      rawContent: content
    };

    let files: CodeFile[] = [];

    try {
      // Method 1: Try file markers [FILE:...] format
      const fileMarkerRegex = /\[FILE:([^\]]+)\](.*?)\[\/FILE\]/gs;
      const fileMatches = Array.from(content.matchAll(fileMarkerRegex));
      
      if (fileMatches.length > 0) {
        diagnostics.extractionMethod = 'file-markers';
        diagnostics.fileMarkersFound = fileMatches.length;
        
        files = fileMatches.map(match => {
          const path = match[1].trim();
          const content = match[2].trim();
          return {
            path,
            content,
            language: getLanguageFromPath(path)
          };
        });
      } 
      // Method 2: Try code blocks format
      else {
        const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\n)?(.*?)```/gs;
        const codeMatches = Array.from(content.matchAll(codeBlockRegex));
        
        if (codeMatches.length > 0) {
          diagnostics.extractionMethod = 'code-blocks';
          diagnostics.codeBlocksFound = codeMatches.length;
          
          files = codeMatches.map((match, index) => {
            const language = match[1] || 'text';
            const comment = match[2]?.trim();
            const codeContent = match[3].trim();
            
            // Try to infer filename from comment or use index
            let filename = `file${index + 1}`;
            if (comment) {
              if (comment.includes('.')) {
                filename = comment;
              } else {
                const ext = language === 'html' ? '.html' : 
                           language === 'css' ? '.css' : 
                           language === 'javascript' ? '.js' : '.txt';
                filename = `${comment.replace(/\s+/g, '-').toLowerCase()}${ext}`;
              }
            } else {
              const ext = language === 'html' ? '.html' : 
                         language === 'css' ? '.css' : 
                         language === 'javascript' ? '.js' : '.txt';
              filename = `${filename}${ext}`;
            }
            
            return {
              path: filename,
              content: codeContent,
              language: language
            };
          });
        } 
        // Method 3: Fallback - create single file from content
        else {
          diagnostics.extractionMethod = 'fallback-single-file';
          diagnostics.parsingErrors.push('No file markers or code blocks found');
          
          // Try to detect if it's HTML and create basic structure
          if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
            files = [
              {
                path: 'index.html',
                content: content,
                language: 'html'
              }
            ];
          }
        }
      }

      // Validation and cleanup
      files = files.filter(file => {
        if (!file.content.trim()) {
          diagnostics.parsingErrors.push(`Empty content for file: ${file.path}`);
          return false;
        }
        return true;
      });

    } catch (error: any) {
      diagnostics.parsingErrors.push(`Parsing error: ${error.message}`);
    }

    return { files, diagnostics };
  };

  // Enhanced generation with quality retry
  const generateWithQualityRetry = async (params: GenerateCodeParams, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2;
    
    try {
      await generateCode(params);
    } catch (error: any) {
      if (error.message.includes('quality validation') && retryCount < MAX_RETRIES) {
        console.log(`Quality retry ${retryCount + 1}/${MAX_RETRIES}`);
        
        // Enhanced prompt with specific requirements
        const enhancedPrompt = `${params.prompt}

🚨 CRITICAL: Previous generation failed quality standards.
MANDATORY REQUIREMENTS:
- Use Tailwind CSS for ALL styling (bg-, text-, hover:, etc.)
- Include gradient backgrounds: bg-gradient-to-br from-indigo-900 to-pink-700
- Add glassmorphism: backdrop-blur-md, bg-white/10
- Include smooth animations: transition-all duration-300, hover:scale-105
- Add visual depth: shadow-2xl, rounded-2xl
- Generate minimum 3 separate files (HTML, CSS, JS)
- Use modern component patterns

REFERENCE: Make it look like Stripe's website - professional, animated, beautiful.`;

        await generateWithQualityRetry({
          ...params,
          prompt: enhancedPrompt
        }, retryCount + 1);
      } else {
        throw error;
      }
    }
  };

  // Main generation function
  const generateCode = async (params: GenerateCodeParams): Promise<void> => {
    setIsGenerating(true);
    setGenerationPhase('planning');
    setError(null);
    setGeneratedFiles([]);
    setFilePlan([]);
    setCurrentFile(null);
    setDiagnosticInfo(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const requestBody = {
        prompt: params.prompt,
        codeType: params.codeType,
        model: params.model,
        conversationId: params.conversationId
      };
      
      console.log('📤 Sending request to generate-code edge function');
      
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      let fullContent = '';
      let currentFileContent = '';
      let currentFileName = '';
      let isInFile = false;
      let accumulatedFiles: CodeFile[] = [];

      console.log('Starting enhanced stream parsing...');

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Stream ended. Processing final content...');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr || jsonStr === '[DONE]') continue;
              
              const data = JSON.parse(jsonStr);
              const content = data.content || '';
              
              fullContent += content;

              // Enhanced file parsing logic
              if (content.includes('[PLAN]')) {
                setGenerationPhase('planning');
                try {
                  const planMatch = fullContent.match(/\[PLAN\](.*?)\[\/PLAN\]/s);
                  if (planMatch) {
                    const planJson = JSON.parse(planMatch[1].trim());
                    if (planJson.files) {
                      setFilePlan(planJson.files);
                    }
                  }
                } catch (e) {
                  console.warn('Could not parse plan JSON:', e);
                }
              }
              
              if (content.includes('[FILE:')) {
                const fileMatch = content.match(/\[FILE:([^\]]+)\]/);
                if (fileMatch) {
                  // Save previous file
                  if (isInFile && currentFileName && currentFileContent.trim()) {
                    accumulatedFiles.push({
                      path: currentFileName,
                      content: currentFileContent.trim(),
                      language: getLanguageFromPath(currentFileName)
                    });
                  }
                  
                  // Start new file
                  currentFileName = fileMatch[1].trim();
                  currentFileContent = '';
                  isInFile = true;
                  setCurrentFile(currentFileName);
                  setGenerationPhase('generating');
                }
              }
              
              if (content.includes('[/FILE]')) {
                if (isInFile && currentFileName) {
                  accumulatedFiles.push({
                    path: currentFileName,
                    content: currentFileContent.trim(),
                    language: getLanguageFromPath(currentFileName)
                  });
                  isInFile = false;
                  currentFileName = '';
                  currentFileContent = '';
                  setCurrentFile(null);
                }
              }
              
              if (isInFile) {
                currentFileContent += content.replace(/\[FILE:[^\]]+\]/, '').replace(/\[\/FILE\]/, '');
              }
              
              if (content.includes('[COMPLETE]')) {
                setGenerationPhase('complete');
                break;
              }

            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Final parsing attempt if streaming markers failed
      if (accumulatedFiles.length === 0) {
        console.log('No files from streaming, attempting full content parsing...');
        const { files, diagnostics } = parseStreamedContent(fullContent);
        accumulatedFiles = files;
        setDiagnosticInfo(diagnostics);
      }

      // Quality validation
      if (accumulatedFiles.length > 0) {
        const validation = validateModernStandards(accumulatedFiles);
        
        if (!validation.passed) {
          console.warn('Quality validation failed:', validation);
          toast({
            title: "Quality Enhancement Needed",
            description: `Generated code scored ${validation.score}/100. ${validation.issues.join('. ')}`,
            variant: "destructive"
          });
          
          // Still set files but with quality warning
          setGeneratedFiles(accumulatedFiles);
        } else {
          console.log('Quality validation passed!');
          setGeneratedFiles(accumulatedFiles);
          toast({
            title: "High-Quality Code Generated!",
            description: `Professional application created with modern design patterns.`
          });
        }
      } else {
        throw new Error('No files were generated. The AI response may not have contained the expected file markers.');
      }

    } catch (err: any) {
      console.error("Code generation error:", err);
      setError(err.message || "Failed to generate code");
      setGenerationPhase('error');
      toast({
        title: "Generation Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetGeneration = () => {
    setIsGenerating(false);
    setGenerationPhase('planning');
    setCurrentFile(null);
    setGeneratedFiles([]);
    setFilePlan([]);
    setError(null);
    setDiagnosticInfo(null);
  };

  const regenerateWithEnhancement = useCallback(() => {
    console.log('Regenerating with enhanced quality requirements...');
  }, []);

  return {
    generateCode: generateWithQualityRetry,
    isGenerating,
    generatedFiles,
    generationPhase,
    currentFile,
    filePlan,
    diagnosticInfo,
    error,
    resetGeneration,
    regenerateWithEnhancement
  };
};
