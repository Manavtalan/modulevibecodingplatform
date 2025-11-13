import { useState, RefObject } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Message } from "@/pages/ModuleStudio";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
// DISABLED: ValidationResults removed for raw output analysis
// import ValidationResults from "@/components/ValidationResults";
// import { ValidationResult } from "@/utils/codeQualityValidator";
import Logo from "@/components/Logo";
import { TokenUsageDisplay } from "@/components/TokenUsageDisplay";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string, files?: File[]) => void;
  isGenerating: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export const ChatPanel = ({ 
  messages, 
  onSendMessage, 
  isGenerating, 
  messagesEndRef
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
    <div className="flex flex-col h-full bg-muted/30 relative">
      {/* Token Usage Display */}
      <TokenUsageDisplay />
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <h3 className="text-lg font-semibold mb-2">Welcome to Module Studio</h3>
              <p className="text-sm">Ask me to generate code or answer your questions!</p>
              <div className="mt-6 space-y-2">
                <p className="text-xs font-medium">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Create a modern portfolio website",
                    "What is React hooks?",
                    "Build a landing page for a SaaS product",
                    "How do I fix CORS errors?",
                    "Generate a responsive blog layout"
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
                ) : msg.isMarkdown ? (
                  <MarkdownRenderer content={msg.text} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
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

          {/* DISABLED: Quality Validation Results removed for raw output analysis */}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-border bg-background">
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <span key={idx} className="text-xs glass-card px-2 py-1 rounded">
                📎 {file.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 items-center">
          {/* Animated Logo when generating */}
          {isGenerating && (
            <div className="flex-shrink-0">
              <Logo size="sm" animated={true} />
            </div>
          )}
          
          {!isGenerating && (
            <label htmlFor="file-upload" className="cursor-pointer flex-shrink-0">
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
          )}

          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGenerating ? "Module is working..." : "Ask Module to generate code or chat about your project..."}
            className="flex-1 min-h-[56px] max-h-[200px] resize-none"
            disabled={isGenerating}
          />

          <Button
            onClick={handleSend}
            disabled={(!inputValue.trim() && attachedFiles.length === 0) || isGenerating}
            size="icon"
            className="h-[56px] w-[56px] flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
