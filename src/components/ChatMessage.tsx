import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
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
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
