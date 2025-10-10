import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { TokenUsageDisplay } from "@/components/TokenUsageDisplay";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Real API integration with Supabase edge function
async function sendMessageToModuleAPI(
  message: string, 
  supabaseClient: any, 
  conversationId?: string,
  uploadedFiles?: Array<{name: string; url: string}>
): Promise<{ response: string; conversationId: string }> {
  const { data, error } = await supabaseClient.functions.invoke('ask', {
    body: {
      user_message: message,
      conversation_id: conversationId,
      template_id: 'module_standalone_html', // Use standalone HTML for demo preview
      attachments: uploadedFiles
    }
  });

  if (error) {
    console.error('Error calling Module AI:', error);
    throw new Error(error.message || 'Failed to get response from Module AI');
  }

  return {
    response: data.assistant_message,
    conversationId: data.conversation_id
  };
}

const Demo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to Module AI! I'm your vibe coding assistant. I can generate complete web applications, portfolios, landing pages, and more. Just describe what you want to build, and I'll provide you with production-ready code. What would you like to create today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation from history if conversation ID is provided
  useEffect(() => {
    const loadConversation = async () => {
      const locationState = location.state as { conversationId?: string };
      const convId = locationState?.conversationId;
      
      if (convId && user) {
        setConversationId(convId);
        setIsLoading(true);
        
        try {
          // Fetch messages for this conversation
          const { data: messagesData, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

          if (error) throw error;

          if (messagesData && messagesData.length > 0) {
            // Convert database messages to UI messages
            const loadedMessages: Message[] = messagesData.map((msg) => ({
              id: msg.id,
              text: msg.content,
              isUser: msg.role === 'user',
              timestamp: new Date(msg.created_at),
            }));
            
            setMessages(loadedMessages);
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          toast.error('Failed to load conversation');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConversation();
  }, [location.state, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string, attachmentFiles?: File[]) => {
    // Check authentication
    if (!user) {
      toast.error("Please sign in to use Module AI");
      navigate("/auth");
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Upload files if present
      let uploadedFiles: Array<{name: string; url: string}> = [];
      if (attachmentFiles && attachmentFiles.length > 0) {
        for (const file of attachmentFiles) {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from('chat-uploads')
            .upload(filePath, file);
          
          if (error) throw error;
          
          const { data: urlData } = supabase.storage
            .from('chat-uploads')
            .getPublicUrl(filePath);
          
          uploadedFiles.push({ name: file.name, url: urlData.publicUrl });
        }
      }

      // Call real API
      const { response, conversationId: newConvId } = await sendMessageToModuleAPI(
        messageText,
        supabase,
        conversationId,
        uploadedFiles
      );

      // Update conversation ID if it's a new conversation
      if (!conversationId) {
        setConversationId(newConvId);
      }

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      // Handle specific error codes
      if (error?.message?.includes('TOKEN_LIMIT_EXCEEDED')) {
        toast.error('🚫 Token limit reached. Upgrade your plan to continue building.');
      } else if (error?.message?.includes('RATE_LIMIT')) {
        toast.error('⚠️ You\'ve reached your usage limit. Please try again later.');
      } else {
        const errorMessage = error?.message || "Failed to get response from Module AI";
        toast.error(errorMessage);
      }
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0A0A0A 0%, #1C1C1C 100%)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Token Usage Display */}
      {user && <TokenUsageDisplay />}
      
      {/* Header */}
      <header
        className="flex items-center gap-4 p-4 border-b"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.05)',
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5 text-white/70" />
        </Button>
        <h1 
          className="text-xl font-semibold bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(90deg, #FF7A18, #FFB347)'
          }}
        >
          Module AI
        </h1>
      </header>

      {/* Messages Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-6 animate-fade-in">
              <div 
                className="pl-4 py-3 border-l-2"
                style={{
                  borderColor: '#FF7A18',
                  background: 'transparent'
                }}
              >
                <div className="flex gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: '#FF7A18' }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: '#FF7A18',
                      animationDelay: '0.2s'
                    }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: '#FF7A18',
                      animationDelay: '0.4s'
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default Demo;
