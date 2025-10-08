import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  // Extract code blocks from message
  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(?:html|jsx|javascript|tsx|css)?\n([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    return matches.map(match => match[1].trim());
  };

  // Check if message contains HTML code that can be previewed
  const hasPreviewableHTML = (text: string) => {
    const htmlBlockRegex = /```html\n([\s\S]*?)```/g;
    const match = htmlBlockRegex.exec(text);
    if (!match) return false;
    const code = match[1];
    // Check if it's a complete HTML document
    return code.includes('<!DOCTYPE') || code.includes('<html') || code.includes('<body');
  };

  const hasCodeBlocks = !isUser && /```(?:html|jsx|javascript|tsx|css)/.test(message);
  const codeBlocks = hasCodeBlocks ? extractCodeBlocks(message) : [];
  const canPreview = !isUser && hasPreviewableHTML(message);

  const previewGeneratedCode = (code: string) => {
    setPreviewCode(code);
  };

  const openInNewTab = (code: string) => {
    const blob = new Blob([code], { type: 'text/html' });
    const previewUrl = URL.createObjectURL(blob);
    window.open(previewUrl, '_blank');
  };

  return (
    <div
      className={`flex mb-6 animate-fade-in ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? "rounded-2xl rounded-tr-sm px-5 py-3.5"
            : "border-l-2 pl-4 py-3"
        }`}
        style={
          isUser
            ? {
                backgroundColor: "#2A2A2A",
                color: "#FFFFFF",
              }
            : {
                borderColor: "#FF7A18",
                background: "transparent",
                boxShadow: "0 0 20px rgba(255, 122, 24, 0.1)",
              }
        }
      >
        {isUser ? (
          <p 
            className="text-sm leading-relaxed text-white"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {message}
          </p>
        ) : (
          <>
            <div 
              className="text-sm leading-relaxed text-white/90 prose prose-invert max-w-none"
              style={{
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return !isInline ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: '1em 0',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                        } as any}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code 
                        className="bg-white/10 px-1.5 py-0.5 rounded text-orange-400"
                      >
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message}
              </ReactMarkdown>
            </div>

            {/* Preview Buttons - Only show for complete HTML */}
            {canPreview && codeBlocks.length > 0 && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => previewGeneratedCode(codeBlocks[0])}
                  className="text-white font-medium"
                  style={{
                    background: 'linear-gradient(90deg, #FF7A18, #FFAE00)',
                    borderRadius: '8px',
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Web App
                </Button>
                <Button
                  onClick={() => openInNewTab(codeBlocks[0])}
                  variant="outline"
                  className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            )}

            {/* Preview iframe */}
            {previewCode && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-orange-400">Live Preview</h3>
                  <Button
                    onClick={() => setPreviewCode(null)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                  >
                    Close Preview
                  </Button>
                </div>
                <iframe
                  sandbox="allow-scripts allow-same-origin"
                  srcDoc={previewCode}
                  className="w-full h-[60vh] border border-orange-500/20 rounded-lg bg-white"
                  style={{
                    borderRadius: '12px',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
