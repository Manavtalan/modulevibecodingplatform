import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Maximize2, 
  Minimize2,
  Monitor,
  Smartphone,
  Tablet,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface CodePreviewProps {
  code: string;
  language: string;
  filename?: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

export const CodePreview = ({ code, language, filename }: CodePreviewProps) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportSize, setViewportSize] = useState<ViewportSize>('desktop');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const isPreviewable = language === 'html' || language === 'htm';
  const hasCompleteHTML = code.includes('<!DOCTYPE') || code.includes('<html');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const getViewportWidth = () => {
    switch (viewportSize) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
    }
  };

  const renderPreview = () => {
    if (!isPreviewable || !hasCompleteHTML) {
      return (
        <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground">
          <div className="text-center space-y-2">
            <p>Preview not available for this code type</p>
            <p className="text-sm">
              {language === 'html' 
                ? 'Complete HTML with DOCTYPE required for preview' 
                : 'Only HTML files can be previewed'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full min-h-[400px] bg-background">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setViewportSize('mobile')}
            className={viewportSize === 'mobile' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setViewportSize('tablet')}
            className={viewportSize === 'tablet' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setViewportSize('desktop')}
            className={viewportSize === 'desktop' ? 'bg-primary text-primary-foreground' : ''}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex items-center justify-center w-full h-full p-4">
          <div 
            className="transition-all duration-300 shadow-lg"
            style={{ 
              width: isFullscreen ? '100%' : getViewportWidth(),
              height: isFullscreen ? '100%' : 'auto',
              minHeight: '400px'
            }}
          >
            <iframe
              srcDoc={code}
              title="Code Preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              className="w-full h-full border-2 border-border rounded-lg bg-white"
              style={{ minHeight: isFullscreen ? '100%' : '400px' }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{filename || `code.${language}`}</span>
          <span className="text-xs text-muted-foreground uppercase">{language}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          {isPreviewable && hasCompleteHTML && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </Button>
          )}
        </div>
      </div>

      {isPreviewable && hasCompleteHTML ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'code' | 'preview')} className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="code" className="flex-1">Code</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="code" className="m-0">
            <div className="max-h-[600px] overflow-auto">
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '0.875rem',
                }}
                showLineNumbers
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="m-0">
            {renderPreview()}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="max-h-[600px] overflow-auto">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.875rem',
            }}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}

      {language === 'jsx' || language === 'tsx' || language === 'react' ? (
        <div className="p-4 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Integration tip:</strong> Copy this React component and paste it into your project. 
            Make sure you have the required dependencies installed.
          </p>
        </div>
      ) : null}
    </Card>
  );
};
