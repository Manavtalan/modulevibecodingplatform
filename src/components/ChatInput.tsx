import { useState, useRef } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled = false }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !disabled) {
      onSendMessage(input.trim(), attachments);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    if (attachments.length + validFiles.length > 5) {
      toast.error("Maximum 5 files allowed");
      return;
    }
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'rgba(255, 122, 24, 0.1)', border: '1px solid rgba(255, 122, 24, 0.3)' }}
              >
                <span className="text-white/80 text-xs">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-3 items-end">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Left Action Buttons */}
          <div className="flex gap-2 pb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 hover:bg-white/5"
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5 text-white/60 hover:text-white/90" />
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
            disabled={disabled || (!input.trim() && attachments.length === 0)}
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
