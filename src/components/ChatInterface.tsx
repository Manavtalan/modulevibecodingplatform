import { FC, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface: FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your coding assistant. How can I help you build, create, and learn today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleSendMessage = () => {
    if (inputValue.trim() || attachedFiles.length > 0) {
      let messageText = inputValue;
      if (attachedFiles.length > 0) {
        messageText += `\n\n📎 Attached ${attachedFiles.length} file(s): ${attachedFiles.map(f => f.name).join(', ')}`;
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      setAttachedFiles([]);
      
      // Simulate assistant response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'I understand you want help with that. Let me assist you with your coding needs!',
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
      if (validFiles.length < files.length) {
        toast({
          title: "File size limit",
          description: "Some files were too large (max 10MB per file)",
          variant: "destructive",
        });
      }
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin scrollbar-thumb-glass-border scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.isUser 
                  ? 'chat-message-user text-primary-foreground'
                  : 'chat-message-assistant text-foreground'
              } animate-fade-in-scale`}
            >
              {!message.isUser && (
                <div className="flex items-center gap-2 mb-2 opacity-75">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-medium">Assistant</span>
                </div>
              )}
              <p className="text-sm leading-relaxed">{message.text}</p>
              <div className="text-xs opacity-60 mt-2">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* File Attachments Preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 bg-glass/80 px-3 py-2 rounded-lg border border-glass-border"
            >
              <Paperclip className="w-3 h-3 text-primary" />
              <span className="text-xs text-foreground truncate max-w-[150px]">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat Input */}
      <div className="flex gap-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask Module to Generate code, Fix bugs..."
          className="chat-input flex-1 border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
        />
        <Button 
          onClick={handleSendMessage} 
          variant="glass"
          size="icon"
          className="shrink-0 hover:glow-primary"
          disabled={!inputValue.trim() && attachedFiles.length === 0}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;