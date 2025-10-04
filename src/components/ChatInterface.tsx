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

      // Handle edge function errors
      if (error) {
        console.error('API Error:', error);
        
        // Check if it's a rate limit error (429 status)
        if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          toast({
            title: "Daily limit reached",
            description: "You've used all 10 free requests today. Upgrade to premium for unlimited access.",
            variant: "destructive",
          });
          setMessages(prev => prev.filter(m => !m.isOptimistic));
          return;
        }
        
        throw error;
      }

      // Handle response error codes
      if (data?.code === 'UNAUTHORIZED') {
        toast({
          title: "Unauthorized",
          description: "Your session has expired. Please sign in again.",
          variant: "destructive",
        });
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        return;
      }

      if (data?.code === 'RATE_LIMIT') {
        toast({
          title: "Daily limit reached",
          description: data.message || "You've used all 10 free requests today. Upgrade to premium for unlimited access.",
          variant: "destructive",
        });
        setMessages(prev => prev.filter(m => !m.isOptimistic));
        return;
      }

      if (data?.code) {
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
    <div className="glass-card flex flex-col h-[calc(100vh-200px)] max-w-[900px] mx-auto">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs sm:text-sm">Project Chat</Badge>
          {currentConversationId && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Active conversation
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentConversationId(undefined);
            setMessages([]);
            onConversationCreated?.(undefined as any);
          }}
          className="text-xs sm:text-sm"
        >
          New Chat
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-2 sm:px-4" ref={scrollAreaRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ask Module anything about your project, get code help, or discuss ideas.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted/50 text-foreground'
                }`}
              >
                {message.role === 'assistant' && !message.content && message.isOptimistic ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Module is thinking...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeId = `code-${message.id}-${index}`;
                          
                          return !inline && match ? (
                            <div className="relative group my-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={() => handleCopyCode(String(children).replace(/\n$/, ''), codeId)}
                              >
                                {copiedCode === codeId ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg !bg-gray-900 !mt-0"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={`${className} bg-muted px-1.5 py-0.5 rounded text-xs`} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {message.role === 'assistant' && message.content && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRetry(index)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                    {message.model_used && (
                      <Badge variant="outline" className="text-[10px] h-6">
                        {message.model_used}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 border-t border-border/20">
        {/* Input field with action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          {/* Input field */}
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="What do you have in your mind to build today..."
            className="chat-input flex-1 min-h-[52px] sm:min-h-[56px] max-h-[100px] sm:max-h-[120px] resize-none rounded-xl border-0 text-xs sm:text-sm md:text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 px-3 py-2"
            rows={2}
          />

          {/* Action buttons row (mobile) / column (desktop) */}
          <div className="flex gap-1.5 sm:gap-2 justify-between sm:flex-col sm:justify-end">
            {/* Left side action buttons */}
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-muted shrink-0"
                onClick={() => toast({ title: "Coming soon", description: "File attachment feature will be available soon." })}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-muted shrink-0"
                onClick={() => toast({ title: "Coming soon", description: "GitHub integration will be available soon." })}
              >
                <Github className="w-4 h-4" />
              </Button>
            </div>

            {/* Send button */}
            <Button 
              onClick={handleSendMessage} 
              variant="default"
              size="icon"
              className="shrink-0 h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full"
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
        <div className="flex flex-nowrap gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] sm:text-xs md:text-sm h-6 sm:h-7 md:h-8 rounded-full border-border/50 hover:bg-muted transition-colors whitespace-nowrap px-2 sm:px-3 md:px-4 flex-shrink-0"
            onClick={() => handleQuickPrompt("Please help me fix the following error: ")}
          >
            Fix error
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] sm:text-xs md:text-sm h-6 sm:h-7 md:h-8 rounded-full border-border/50 hover:bg-muted transition-colors whitespace-nowrap px-2 sm:px-3 md:px-4 flex-shrink-0"
            onClick={() => handleQuickPrompt("Can you explain this concept: ")}
          >
            Explain
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] sm:text-xs md:text-sm h-6 sm:h-7 md:h-8 rounded-full border-border/50 hover:bg-muted transition-colors whitespace-nowrap px-2 sm:px-3 md:px-4 flex-shrink-0"
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