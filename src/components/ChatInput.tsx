import { useState } from "react";
import { Send, Paperclip, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileAttachment = () => {
    toast.info("File attachment feature coming soon!");
  };

  const handleGithubConnect = () => {
    toast.info("GitHub integration coming soon!");
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 border-t"
      style={{
        background: 'rgba(10, 10, 10, 0.95)',
        backdropFilter: 'blur(10px)',
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
        <div className="flex gap-3 items-end">
          {/* Left Action Buttons */}
          <div className="flex gap-2 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFileAttachment}
              className="h-10 w-10 hover:bg-white/5"
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5 text-white/60 hover:text-white/90" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleGithubConnect}
              className="h-10 w-10 hover:bg-white/5"
              disabled={disabled}
            >
              <Github className="h-5 w-5 text-white/60 hover:text-white/90" />
            </Button>
          </div>

          {/* Text Input */}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Module something..."
            disabled={disabled}
            className="min-h-[56px] max-h-[200px] resize-none border text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-offset-0"
            style={{
              backgroundColor: '#1A1A1A',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
            rows={1}
          />

          {/* Send Button */}
          <Button
            type="submit"
            disabled={disabled || !input.trim()}
            className="h-[56px] px-6 rounded-full text-white font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundImage: 'linear-gradient(90deg, #FF7A18, #FFB347)',
              boxShadow: '0 0 20px rgba(255, 122, 24, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 122, 24, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 122, 24, 0.3)';
            }}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
