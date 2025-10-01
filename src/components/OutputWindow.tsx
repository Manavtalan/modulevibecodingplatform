import { FC, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface OutputWindowProps {
  code?: string;
  language?: string;
}

const OutputWindow: FC<OutputWindowProps> = ({ code = '', language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="border-b border-border/50 px-4 py-2 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Output</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="code" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-4">
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="flex-1 overflow-auto m-0 p-0">
          {code ? (
            <SyntaxHighlighter
              language={language}
              style={oneDark as any}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                height: '100%',
              }}
            >
              {code}
            </SyntaxHighlighter>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No code to display yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-auto m-0 p-4">
          {code ? (
            <iframe
              srcDoc={code}
              title="Code Preview"
              className="w-full h-full border border-border rounded-lg bg-background"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No preview available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OutputWindow;
