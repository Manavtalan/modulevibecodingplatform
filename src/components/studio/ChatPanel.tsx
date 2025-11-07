import { useState, RefObject } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Message } from "@/pages/ModuleStudio";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ValidationResults from "@/components/ValidationResults";
import { ValidationResult } from "@/utils/codeQualityValidator";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string, files?: File[]) => void;
  isGenerating: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  validationResult?: ValidationResult | null;
  isValidating?: boolean;
}

export const ChatPanel = ({ 
  messages, 
  onSendMessage, 
  isGenerating, 
  messagesEndRef,
  validationResult,
  isValidating 
}: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleSend = () => {
    if (!inputValue.trim() && attachedFiles.length === 0) return;
    onSendMessage(inputValue, attachedFiles);
    setInputValue("");
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const getMessageClassName = (msg: Message) => {
    if (msg.type === 'status') {
      return "glass-card border-primary/30 text-sm p-3 my-2";
    }
    if (msg.type === 'error') {
      return "bg-destructive/10 border border-destructive/30 text-sm p-3 my-2 rounded-lg";
    }
    if (msg.isUser) {
      return "bg-primary text-primary-foreground ml-auto rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]";
    }
    return "glass-card mr-auto rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]";
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <h3 className="text-lg font-semibold mb-2">Welcome to Module Studio</h3>
              <p className="text-sm">Ask me to generate a website, app, or any web project!</p>
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium">Quick examples:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Create a modern portfolio website",
                    "Build a landing page for a SaaS product",
                    "Make a responsive blog layout"
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setInputValue(example)}
                      className="text-xs glass-card px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === 'status' || msg.type === 'error' ? 'justify-center' : msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={getMessageClassName(msg)}>
                {msg.statusIcon && (
                  <span className="inline-block mr-2">{msg.statusIcon}</span>
                )}
                {msg.isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
                <span className="text-xs opacity-60 mt-1 block">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </Card>
            </div>
          ))}

          {isGenerating && (
            <div className="flex justify-start">
              <Card className="glass-card mr-auto rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animation-delay-400"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">Module is thinking...</span>
                </div>
              </Card>
            </div>
          )}

          {/* Quality Validation Results */}
          {(validationResult || isValidating) && (
            <div className="mt-4">
              <ValidationResults 
                validationResult={validationResult || null}
                isValidating={isValidating || false}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background">
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <span key={idx} className="text-xs glass-card px-2 py-1 rounded">
                📎 {file.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <label htmlFor="file-upload" className="cursor-pointer">
            <Button type="button" variant="ghost" size="icon" asChild>
              <span>
                <Paperclip className="h-5 w-5" />
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Module to generate code or chat about your project..."
            className="flex-1 min-h-[60px] max-h-[200px] resize-none"
            disabled={isGenerating}
          />

          <Button
            onClick={handleSend}
            disabled={(!inputValue.trim() && attachedFiles.length === 0) || isGenerating}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
