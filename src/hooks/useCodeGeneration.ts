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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            if (currentFilePath && currentFileContent) {
              setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent }]);
            }
            setGenerationPhase('complete');
            setCurrentFile(null);
            continue;
          }

          // Try to parse as JSON for completion with metadata
          try {
            const parsed = JSON.parse(data);
            if (parsed.done === true) {
              if (currentFilePath && currentFileContent) {
                setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent }]);
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
            // Not JSON, continue processing as content
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
            if (currentFilePath && currentFileContent) {
              setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent }]);
            }
            
            setGenerationPhase('generating');
            const match = data.match(/\[FILE:(.*?)\]/);
            if (match) {
              currentFilePath = match[1].trim();
              currentFileContent = '';
              setCurrentFile(currentFilePath);
            }
            continue;
          }

          // Parse [/FILE] marker
          if (data.startsWith('[/FILE]')) {
            if (currentFilePath && currentFileContent) {
              setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent }]);
              currentFilePath = '';
              currentFileContent = '';
            }
            continue;
          }

          // Parse [COMPLETE] marker
          if (data.startsWith('[COMPLETE]')) {
            if (currentFilePath && currentFileContent) {
              setGeneratedFiles(prev => [...prev, { path: currentFilePath, content: currentFileContent }]);
            }
            setGenerationPhase('complete');
            setCurrentFile(null);
            continue;
          }

          // Parse [ERROR] marker
          if (data.startsWith('[ERROR]')) {
            setGenerationPhase('error');
            const errorMsg = data.substring('[ERROR]'.length).trim();
            setError(errorMsg);
            continue;
          }

          // Regular content - append to current file
          if (currentFilePath) {
            currentFileContent += data + '\n';
            setGeneratedFiles(prev => {
              const existing = prev.findIndex(f => f.path === currentFilePath);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = { path: currentFilePath, content: currentFileContent };
                return updated;
              }
              return [...prev, { path: currentFilePath, content: currentFileContent }];
            });
          }
        }
      }
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
