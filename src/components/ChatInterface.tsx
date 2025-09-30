import { FC, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
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
}

const ChatInterface: FC<ChatInterfaceProps> = ({ conversationId, onConversationCreated }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const { session, user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    if (!session?.access_token || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the chat.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const messageText = inputValue;
    setInputValue('');

    // Optimistic UI: Add user message immediately
    const optimisticUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: messageText,
      isOptimistic: true,
      created_at: new Date().toISOString(),
    };

    // Add loading indicator for assistant
    const optimisticAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      isOptimistic: true,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticUserMessage, optimisticAssistantMessage]);

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
        // Remove optimistic messages
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        return;
      }

      if (data.code === 'RATE_LIMIT') {
        toast({
          title: "Rate limit exceeded",
          description: data.message || "Daily free credits exhausted.",
          variant: "destructive",
        });
        // Remove optimistic messages
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
      // Remove optimistic messages
      setMessages(prev => prev.filter(m => !m.isOptimistic));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="glass-card flex flex-col h-[600px]">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm">Send a message to begin</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'assistant' && message.isOptimistic && !message.content ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                ) : (
                  <>
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code(props) {
                              const { children, className, ...rest } = props;
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match;
                              
                              return !isInline ? (
                                <SyntaxHighlighter
                                  style={oneDark as any}
                                  language={match[1]}
                                  PreTag="div"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...rest}>
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {message.role === 'assistant' && message.model_used && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {message.model_used}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-3">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="chat-input flex-1 min-h-[60px] max-h-[120px] resize-none border-0 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
            rows={2}
          />
          <Button 
            onClick={handleSendMessage} 
            variant="default"
            size="icon"
            className="shrink-0 h-[60px] w-[60px]"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;