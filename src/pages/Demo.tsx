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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold bg-gradient-orange bg-clip-text text-transparent">
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
            <div className="flex justify-start mb-4 animate-fade-in">
              <div className="bg-transparent border-l-2 border-[hsl(var(--accent))] pl-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-pulse delay-100" />
                  <div className="w-2 h-2 bg-[hsl(var(--accent))] rounded-full animate-pulse delay-200" />
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
