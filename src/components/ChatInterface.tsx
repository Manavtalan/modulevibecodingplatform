import { FC, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ChatInterface: FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the chat.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const message = inputValue;
    setInputValue('');

    try {
      const { data, error } = await supabase.functions.invoke('ask', {
        body: { user_message: message },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('API Error:', error);
        throw error;
      }

      if (data.code === 'UNAUTHORIZED') {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        });
        return;
      }

      if (data.code === 'RATE_LIMIT') {
        toast({
          title: "Rate limit exceeded",
          description: data.message || "Daily free credits exhausted.",
          variant: "destructive",
        });
        return;
      }

      // Success - you can add message display logic here
      toast({
        title: "Message sent",
        description: "Response received successfully.",
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex gap-3">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Generate web apps, MVPs and much more..."
          className="chat-input flex-1 border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
        />
        <Button 
          onClick={handleSendMessage} 
          variant="default"
          size="icon"
          className="shrink-0"
          disabled={!inputValue.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;