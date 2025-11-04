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

export const useCodeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('idle');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<CodeFile[]>([]);
  const [filePlan, setFilePlan] = useState<FilePlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseStreamChunk = (chunk: string) => {
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('[PLAN]')) {
        setGenerationPhase('planning');
        const planContent = line.substring('[PLAN]'.length).trim();
        try {
          const plan = JSON.parse(planContent);
          setFilePlan(plan.files || []);
        } catch (e) {
          console.error("Failed to parse plan:", e);
        }
      } else if (line.startsWith('[FILE:')) {
        setGenerationPhase('generating');
        const match = line.match(/\[FILE:(.*?)\]([\s\S]*)/);
        if (match) {
          const filepath = match[1].trim();
          const content = match[2].trim();
          
          setCurrentFile(filepath);
          setGeneratedFiles(prev => {
            const existing = prev.findIndex(f => f.path === filepath);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing].content = content;
              return updated;
            }
            return [...prev, { path: filepath, content }];
          });
        }
      } else if (line.startsWith('[COMPLETE]')) {
        setGenerationPhase('complete');
        setCurrentFile(null);
      } else if (line.startsWith('[ERROR]')) {
        setGenerationPhase('error');
        const errorMsg = line.substring('[ERROR]'.length).trim();
        setError(errorMsg);
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
      const { data, error: invokeError } = await supabase.functions.invoke('generate-code', {
        body: {
          prompt: params.prompt,
          codeType: params.codeType,
          model: params.model,
          conversationId: params.conversationId
        }
      });

      if (invokeError) throw invokeError;

      // Parse the response
      if (data?.files) {
        setGeneratedFiles(data.files);
        setGenerationPhase('complete');
      } else if (data?.stream) {
        // Handle streaming response
        parseStreamChunk(data.stream);
      } else {
        throw new Error("Invalid response format from generate-code function");
      }
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
  };

  return {
    isGenerating,
    generationPhase,
    currentFile,
    generatedFiles,
    filePlan,
    error,
    generateCode,
    resetGeneration
  };
};
