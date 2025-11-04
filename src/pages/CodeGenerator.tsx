import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CodePreview } from '@/components/CodePreview';
import { TokenUsageDisplay } from '@/components/TokenUsageDisplay';
import { TemplateGallery } from '@/components/sections/TemplateGallery';
import { Loader2, Sparkles, Code2, Layout } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface CodeFile {
  path: string;
  content: string;
}

interface GeneratedCode {
  files: CodeFile[];
  timestamp: Date;
}

export default function CodeGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [codeType, setCodeType] = useState<'html' | 'react' | 'vue' | 'javascript' | 'typescript' | 'css'>('html');
  const [framework, setFramework] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [generatedCodes, streamingContent]);

  const parseFilesFromResponse = (content: string): CodeFile[] | null => {
    try {
      // Try to parse as JSON first
      const cleanContent = content.trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*"files"[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.files && Array.isArray(parsed.files)) {
          return parsed.files;
        }
      }
    } catch (error) {
      console.error('Failed to parse files JSON:', error);
    }
    
    // Fallback: treat as single file
    return [{
      path: `generated.${codeType}`,
      content: content.trim()
    }];
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
    setStreamingContent('');
    setShowTemplates(false);

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
                setStreamingContent(fullContent);
              }
              
              if (parsed.done) {
                const files = parseFilesFromResponse(fullContent);
                if (files) {
                  setGeneratedCodes(prev => [...prev, {
                    files,
                    timestamp: new Date()
                  }]);
                  setStreamingContent('');
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
      toast.error(error instanceof Error ? error.message : 'Failed to generate code');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codeType">Code Type</Label>
                <Select value={codeType} onValueChange={(v: any) => setCodeType(v)}>
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
                <Select value={framework} onValueChange={setFramework}>
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

        {/* Generated Code Section */}
        <div className="space-y-6">
          {generatedCodes.map((item, index) => (
            <div key={index} className="animate-in fade-in-50 slide-in-from-bottom-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Generated at {item.timestamp.toLocaleTimeString()} • {item.files.length} file(s)
                </span>
              </div>
              <div className="space-y-4">
                {item.files.map((file, fileIndex) => {
                  const extension = file.path.split('.').pop() || codeType;
                  return (
                    <CodePreview
                      key={fileIndex}
                      code={file.content}
                      language={extension}
                      filename={file.path}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Streaming Content */}
          {streamingContent && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Generating...</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
