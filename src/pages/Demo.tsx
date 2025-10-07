import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Placeholder API integration
async function sendMessageToModuleAPI(message: string): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Mock response
  return `I received your message: "${message}". This is a placeholder response from Module AI. In production, this would connect to the actual AI backend.`;
}

const Demo = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to Module AI! I'm here to help you with vibe coding. What would you like to build today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText: string) => {
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
      // Call API
      const response = await sendMessageToModuleAPI(messageText);

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Failed to get response from Module AI. Please try again.");
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
