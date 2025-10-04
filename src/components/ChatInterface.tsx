import { FC, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Copy, Check, RotateCcw, Paperclip, Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
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

interface ChatInterfaceProps {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
  initialPrompt?: string;
}

const ChatInterface: FC<ChatInterfaceProps> = ({ conversationId, onConversationCreated, initialPrompt }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { session, user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Set initial prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      setInputValue(initialPrompt);
    }
  }, [initialPrompt]);

  // Fetch conversation messages on mount or when conversationId changes
  useEffect(() => {
    if (currentConversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [currentConversationId]);

  // Update current conversation when prop changes
  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!currentConversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (data) {
        setMessages(data as Message[]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: "Error",
        description: "Failed to load message history.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRetry = async (messageIndex: number) => {
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;
    
    // Remove the assistant message we're retrying
    setMessages(prev => prev.slice(0, messageIndex));
    
    // Re-send the user message
    await sendMessage(userMessage.content);
  };

  const sendMessage = async (messageText: string) => {
    if (!session?.access_token || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the chat.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Optimistic UI: Add user message immediately (only if it's not already there)
    const existingMessage = messages.find(m => m.content === messageText && m.role === 'user');
    if (!existingMessage) {
      const optimisticUserMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: messageText,
        isOptimistic: true,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticUserMessage]);
    }

    // Add loading indicator for assistant
    const optimisticAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      isOptimistic: true,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticAssistantMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('ask', {
        body: { 
          user_message: messageText,
          conversation_id: currentConversationId,
          user_id: user.id,
        },
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
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        return;
      }

      if (data.code === 'RATE_LIMIT') {
        toast({
          title: "Too many requests",
          description: "Please wait a moment and try again.",
          variant: "destructive",
        });
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        return;
      }

      if (data.code) {
        toast({
          title: "Error",
          description: data.message || "Something went wrong. Please retry.",
          variant: "destructive",
        });
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        return;
      }

      // Success - update with real messages from backend
      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id);
        onConversationCreated?.(data.conversation_id);
      }

      // Fetch updated messages from database
      await fetchMessages();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prev => prev.filter(m => !m.isOptimistic));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const messageText = inputValue;
    setInputValue('');
    await sendMessage(messageText);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="glass-card flex flex-col max-w-[900px] mx-auto">
      {/* Input Area */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Input field with action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end">
          {/* Input field */}
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="What do you have in your mind to build today..."
            className="chat-input flex-1 min-h-[56px] max-h-[120px] resize-none rounded-xl border-0 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
            rows={2}
          />

          {/* Action buttons row (mobile) / column (desktop) */}
          <div className="flex gap-2 justify-between sm:flex-col sm:justify-end">
            {/* Left side action buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-10 sm:w-10 rounded-full hover:bg-muted"
                onClick={() => toast({ title: "Coming soon", description: "File attachment feature will be available soon." })}
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-10 sm:w-10 rounded-full hover:bg-muted"
                onClick={() => toast({ title: "Coming soon", description: "GitHub integration will be available soon." })}
              >
                <Github className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Send button */}
            <Button 
              onClick={handleSendMessage} 
              variant="default"
              size="icon"
              className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick prompt chips - BELOW input */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm h-7 sm:h-8 rounded-full border-border/50 hover:bg-muted transition-colors whitespace-nowrap px-3 sm:px-4"
            onClick={() => handleQuickPrompt("Please help me fix the following error: ")}
          >
            Fix error
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm h-7 sm:h-8 rounded-full border-border/50 hover:bg-muted transition-colors whitespace-nowrap px-3 sm:px-4"
            onClick={() => handleQuickPrompt("Can you explain this concept: ")}
          >
            Explain
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm h-7 sm:h-8 rounded-full border-border/50 hover:bg-muted transition-colors whitespace-nowrap px-3 sm:px-4"
            onClick={() => handleQuickPrompt("Suggest a project idea related to: ")}
          >
            Project idea
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;