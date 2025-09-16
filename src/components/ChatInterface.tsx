import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface: FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your coding assistant. How can I help you build, create, and learn today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputValue,
        isUser: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');
      
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
    if (e.key === 'Enter') {
      handleSendMessage();
    }
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

      {/* Chat Input */}
      <div className="flex gap-3">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Module to Generate code, Fix bugs..."
          className="chat-input flex-1 border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
        />
        <Button 
          onClick={handleSendMessage} 
          variant="glass"
          size="icon"
          className="shrink-0 hover:glow-primary"
          disabled={!inputValue.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;