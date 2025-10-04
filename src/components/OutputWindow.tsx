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
  isOptimistic?: boolean;
}

interface OutputWindowProps {
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
}

const OutputWindow: FC<OutputWindowProps> = ({ messages, isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Get all assistant messages (reverse chronological order)
  const assistantMessages = messages
    .filter(m => m.role === 'assistant' && !m.isOptimistic)
    .reverse();

  const toggleMessageExpanded = (id: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Auto-expand latest message
  useEffect(() => {
    if (assistantMessages.length > 0) {
      setExpandedMessages(new Set([assistantMessages[0].id]));
    }
  }, [assistantMessages.length]);

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markdownComponents: Components = {
    p: ({ children }) => (
      <p className="text-[15px] text-foreground/90 leading-[1.7] mb-5 tracking-wide">{children}</p>
    ),
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      const codeId = `code-${Math.random()}`;
      const inline = !className;

      return !inline && match ? (
        <div className="relative group my-5 rounded-xl overflow-hidden border border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {match[1]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyCode(codeString, codeId)}
              className="h-7 px-2 hover:bg-muted/50 transition-all"
            >
              {copiedCode === codeId ? (
                <>
                  <Check className="h-3 w-3 mr-1.5 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1.5" />
                  <span className="text-xs">Copy code</span>
                </>
              )}
            </Button>
          </div>
          <div className="[&>pre]:!m-0 [&>pre]:!rounded-none [&>pre]:!border-0 [&>pre]:text-[13px] [&>pre]:leading-[1.6]">
            <SyntaxHighlighter
              style={oneDark as any}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        </div>
      ) : (
        <code className="bg-muted/60 px-1.5 py-0.5 rounded text-[13px] font-mono text-foreground/90 border border-border/30" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 tracking-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-foreground mb-3 mt-4 tracking-tight">{children}</h3>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-outside ml-5 space-y-2 mb-5 text-[15px] text-foreground/90 [&>li]:pl-1.5">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-outside ml-5 space-y-2 mb-5 text-[15px] text-foreground/90 [&>li]:pl-1.5">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="text-[15px] text-foreground/90 leading-[1.7]">{children}</li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/30 rounded-r text-foreground/80 italic">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-foreground/90">{children}</em>
    ),
  };

  if (!isOpen || assistantMessages.length === 0) {
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-background/98 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Output</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-muted/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content - History of all outputs */}
        <ScrollArea className="h-[calc(100%-52px)]">
          <div className="p-5 space-y-3">
            {assistantMessages.map((message, index) => {
              const isExpanded = expandedMessages.has(message.id);
              const isLatest = index === 0;
              
              return (
                <div key={message.id} className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                  {/* Collapsible Header */}
                  <button
                    onClick={() => toggleMessageExpanded(message.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {isLatest ? '✨ Latest Output' : `📄 Output ${assistantMessages.length - index}`}
                      </span>
                      {message.created_at && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isLatest && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
                          New
                        </span>
                      )}
                      <span className="text-muted-foreground text-lg font-light group-hover:text-foreground transition-colors">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </div>
                  </button>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 bg-card/30">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop: Fixed-width side panel (420px) */}
      <div 
        className={`
          hidden lg:block
          fixed top-0 right-0 h-screen bg-background border-l shadow-xl z-40
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: '420px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/98 backdrop-blur-xl sticky top-0 z-10 shadow-sm">
          <h2 className="text-base font-semibold text-foreground tracking-tight">Output</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-lg hover:bg-muted/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content - History of all outputs */}
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="p-6 space-y-4">
            {assistantMessages.map((message, index) => {
              const isExpanded = expandedMessages.has(message.id);
              const isLatest = index === 0;
              
              return (
                <div key={message.id} className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                  {/* Collapsible Header */}
                  <button
                    onClick={() => toggleMessageExpanded(message.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {isLatest ? '✨ Latest Output' : `📄 Output ${assistantMessages.length - index}`}
                      </span>
                      {message.created_at && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isLatest && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium uppercase tracking-wider">
                          New
                        </span>
                      )}
                      <span className="text-muted-foreground text-lg font-light group-hover:text-foreground transition-colors">
                        {isExpanded ? '−' : '+'}
                      </span>
                    </div>
                  </button>

                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-card/30">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Backdrop overlay for mobile only */}
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
