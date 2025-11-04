import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TokenUsageDisplay } from '@/components/TokenUsageDisplay';
import { TemplateGallery } from '@/components/sections/TemplateGallery';
import { CodeOutputTabs } from '@/components/CodeOutputTabs';
import { ModelSelector } from '@/components/ModelSelector';
import { GenerationProgress, FilePlan } from '@/components/GenerationProgress';
import { Loader2, Sparkles, Code2, Layout } from 'lucide-react';
import { toast } from 'sonner';

interface CodeFile {
  path: string;
  content: string;
}

interface GeneratedCode {
  files: CodeFile[];
  timestamp: Date;
}

interface GenerationState {
  phase: 'planning' | 'generating' | 'complete' | 'error';
  currentFile: string | null;
  filesComplete: string[];
  filesFailed: string[];
  filesTotal: number;
  filesPlan: FilePlan[];
  errorMessage?: string;
}

export default function CodeGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [codeType, setCodeType] = useState<'html' | 'react' | 'vue' | 'javascript' | 'typescript' | 'css'>('html');
  const [framework, setFramework] = useState('');
  const [model, setModel] = useState<'claude-sonnet-4-5' | 'gpt-5-mini' | 'gemini-flash'>('gemini-flash');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const [generationState, setGenerationState] = useState<GenerationState | null>(null);
  const [currentFiles, setCurrentFiles] = useState<CodeFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [generatedCodes, generationState]);

  const parseProgressiveStream = (content: string) => {
    // Parse [PLAN] section
    const planMatch = content.match(/\[PLAN\](.*?)\[\/PLAN\]/s);
    if (planMatch) {
      try {
        const planData = JSON.parse(planMatch[1].trim());
        if (planData.files && Array.isArray(planData.files)) {
          setGenerationState(prev => ({
            phase: 'generating',
            currentFile: null,
            filesComplete: prev?.filesComplete || [],
            filesFailed: prev?.filesFailed || [],
            filesTotal: planData.files.length,
            filesPlan: planData.files,
          }));
        }
      } catch (e) {
        console.error('Failed to parse plan:', e);
      }
    }

    // Parse [FILE:path] sections
    const fileMatches = content.matchAll(/\[FILE:(.*?)\](.*?)(?:\[\/FILE\]|$)/gs);
    const parsedFiles: CodeFile[] = [];
    const completedPaths: string[] = [];

    for (const match of fileMatches) {
      const path = match[1].trim();
      const fileContent = match[2].trim();
      
      if (fileContent) {
        parsedFiles.push({ path, content: fileContent });
        
        // Check if file is complete (has closing tag)
        if (content.includes(`[/FILE]`) && content.indexOf(`[FILE:${path}]`) < content.indexOf(`[/FILE]`)) {
          completedPaths.push(path);
        }
      }
    }

    // Update current files for live preview
    if (parsedFiles.length > 0) {
      setCurrentFiles(parsedFiles);
      
      // Update which file is currently being generated
      const lastFile = parsedFiles[parsedFiles.length - 1];
      if (lastFile && !completedPaths.includes(lastFile.path)) {
        setGenerationState(prev => prev ? {
          ...prev,
          currentFile: lastFile.path,
          filesComplete: completedPaths,
        } : null);
      } else if (completedPaths.length > 0) {
        setGenerationState(prev => prev ? {
          ...prev,
          currentFile: null,
          filesComplete: completedPaths,
        } : null);
      }
    }

    // Check for completion
    if (content.includes('[COMPLETE]')) {
      if (parsedFiles.length > 0) {
        setGenerationState(prev => prev ? {
          ...prev,
          phase: 'complete',
          currentFile: null,
          filesComplete: parsedFiles.map(f => f.path),
        } : null);
        return parsedFiles;
      }
    }

    return null;
  };

  const handleTemplateSelect = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setShowTemplates(false);
    toast.success('Template selected! Customize the prompt and generate.');
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to generate code');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setShowTemplates(false);
    setCurrentFiles([]);
    setGenerationState({
      phase: 'planning',
      currentFile: null,
      filesComplete: [],
      filesFailed: [],
      filesTotal: 0,
      filesPlan: [],
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        return;
      }

      const response = await fetch(
        `https://ryhhskssaplqakovldlp.supabase.co/functions/v1/generate-code`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            codeType,
            framework: framework || undefined,
            model,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate code');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                fullContent += parsed.content;
                const files = parseProgressiveStream(fullContent);
                if (files) {
                  setGeneratedCodes(prev => [...prev, {
                    files,
                    timestamp: new Date()
                  }]);
                  setCurrentFiles([]);
                  toast.success(`Generated ${files.length} file(s) successfully!`);
                }
              }
              
              if (parsed.done) {
                // Final check
                const files = parseProgressiveStream(fullContent);
                if (files && files.length > 0) {
                  setGeneratedCodes(prev => {
                    const exists = prev.some(p => p.files.length === files.length);
                    return exists ? prev : [...prev, { files, timestamp: new Date() }];
                  });
                  toast.success(`Generated ${files.length} file(s) successfully!`);
                }
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate code';
      toast.error(errorMsg);
      setGenerationState(prev => prev ? {
        ...prev,
        phase: 'error',
        errorMessage: errorMsg,
      } : null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Code Generator</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Generate production-ready code with AI assistance
          </p>
        </div>

        {user && <TokenUsageDisplay />}

        {/* Template Gallery */}
        {showTemplates && (
          <div className="mb-8">
            <TemplateGallery onSelectTemplate={handleTemplateSelect} />
            
            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground glass-card">
                  <Layout className="inline w-4 h-4 mr-2" />
                  Or create from scratch
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Input Section */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codeType">Code Type</Label>
                <Select value={codeType} onValueChange={(v: any) => setCodeType(v)} disabled={isGenerating}>
                  <SelectTrigger id="codeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework">Framework (Optional)</Label>
                <Select value={framework} onValueChange={setFramework} disabled={isGenerating}>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="tailwind">Tailwind CSS</SelectItem>
                    <SelectItem value="bootstrap">Bootstrap</SelectItem>
                    <SelectItem value="material-ui">Material UI</SelectItem>
                    <SelectItem value="chakra-ui">Chakra UI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ModelSelector
                value={model}
                onChange={(v: any) => setModel(v)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">What do you want to build?</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Create a responsive landing page with a hero section, features grid, and contact form..."
                className="min-h-[120px] resize-none"
                disabled={isGenerating}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Code
                  </>
                )}
              </Button>
              
              {!showTemplates && (
                <Button
                  onClick={() => setShowTemplates(true)}
                  variant="outline"
                  size="lg"
                  type="button"
                >
                  <Layout className="mr-2 h-5 w-5" />
                  Templates
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Generation Progress */}
        {generationState && generationState.phase !== 'complete' && (
          <div className="mb-8 animate-in fade-in-50">
            <GenerationProgress {...generationState} />
          </div>
        )}

        {/* Live Preview During Generation */}
        {currentFiles.length > 0 && (
          <div className="mb-8 animate-in fade-in-50">
            <div className="mb-3">
              <span className="text-sm text-muted-foreground">
                Live preview • {currentFiles.length} file(s) in progress
              </span>
            </div>
            <CodeOutputTabs files={currentFiles} />
          </div>
        )}

        {/* Generated Code Section */}
        <div className="space-y-6">
          {generatedCodes.map((item, index) => (
            <div key={index} className="animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Generated at {item.timestamp.toLocaleTimeString()} • {item.files.length} file(s)
                </span>
              </div>
              <CodeOutputTabs files={item.files} />
            </div>
          ))}
        </div>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
