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
}

const ChatInterface: FC<ChatInterfaceProps> = ({ conversationId, onConversationCreated }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-[900px] mx-auto">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-6 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4">
              <div className="glass-card p-8 max-w-md">
                <h2 className="text-xl font-semibold mb-2 text-foreground">Welcome to Module AI</h2>
                <p className="text-muted-foreground mb-4">
                  Start a conversation by typing a message below or choosing a quick prompt.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'chat-message-user text-primary-foreground'
                      : 'chat-message-assistant'
                  } p-4 rounded-2xl`}
                >
                  {message.role === 'user' ? (
                    <p className="text-[15px] leading-[1.7] whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {message.isOptimistic && !message.content ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">{children}</h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-semibold mt-5 mb-3 text-foreground">{children}</h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>
                            ),
                            p: ({ children }) => (
                              <p className="text-[15px] leading-[1.7] mb-4 text-foreground">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-4 space-y-2 text-[15px] text-foreground">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-4 space-y-2 text-[15px] text-foreground">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
                            code: ({ inline, className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              const codeId = `${message.id}-${match?.[1] || 'code'}`;

                              return !inline && match ? (
                                <div className="my-4 rounded-xl overflow-hidden border border-border/50 bg-muted/30">
                                  {/* Code block header */}
                                  <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">
                                      {match[1]}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs hover:bg-background/50"
                                      onClick={() => handleCopyCode(codeString, codeId)}
                                    >
                                      {copiedCode === codeId ? (
                                        <>
                                          <Check className="w-3 h-3 mr-1" />
                                          Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 mr-1" />
                                          Copy
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  {/* Code content */}
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      padding: '16px',
                                      background: 'transparent',
                                      fontSize: '13px',
                                      lineHeight: '1.6',
                                    }}
                                    {...props}
                                  >
                                    {codeString}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code
                                  className="px-1.5 py-0.5 rounded bg-muted/50 text-[13px] font-mono text-primary"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                      
                      {/* Retry button for assistant messages (if not optimistic) */}
                      {!message.isOptimistic && message.role === 'assistant' && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border/30">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs hover:bg-muted"
                            onClick={() => handleRetry(index)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1.5" />
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  {message.created_at && (
                    <div className="text-xs text-muted-foreground mt-2 opacity-70">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area - Fixed at bottom */}
      <div className="glass-card p-3 sm:p-4 space-y-3 border-t border-border/50">
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