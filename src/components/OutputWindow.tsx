import { FC, useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  created_at?: string;
}

interface OutputWindowProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
}

const OutputWindow: FC<OutputWindowProps> = ({ messages, isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Get the latest assistant message
  const latestAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0];

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markdownComponents: Components = {
    p: ({ children }) => (
      <p className="text-sm text-foreground leading-relaxed mb-4">{children}</p>
    ),
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const codeId = `code-${Math.random()}`;
      const inline = !className;

      return !inline && match ? (
        <div className="relative group my-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopyCode(codeString, codeId)}
            className="absolute top-2 right-2 h-8 px-2 bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            {copiedCode === codeId ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                <span className="text-xs">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </Button>
          <SyntaxHighlighter
            style={oneDark as any}
            language={match[1]}
            PreTag="div"
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <h1 className="text-xl font-bold text-foreground mb-3 mt-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-lg font-bold text-foreground mb-2 mt-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-semibold text-foreground mb-2 mt-3">{children}</h3>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-sm text-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 text-sm text-foreground">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-sm text-foreground">{children}</li>
    ),
  };

  if (!isOpen || !latestAssistantMessage) {
    return null;
  }

  return (
    <>
      {/* Mobile: Full-screen drawer from bottom */}
      <div 
        className={`
          fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-2xl
          lg:hidden
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ height: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
          <h2 className="text-base font-bold text-foreground">Output</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100%-52px)]">
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {latestAssistantMessage.content}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </div>

      {/* Desktop: Side panel (35% width) */}
      <div 
        className={`
          hidden lg:block
          fixed top-0 right-0 h-screen bg-background border-l shadow-xl z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: '35%' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur">
          <h2 className="text-base font-bold text-foreground">Output</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="p-6 prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {latestAssistantMessage.content}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </div>

      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default OutputWindow;
