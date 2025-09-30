import { FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ChatInterface from '@/components/ChatInterface';
import ConversationHistory from '@/components/ConversationHistory';
import { Sparkles } from 'lucide-react';

const Dashboard: FC = () => {
  const location = useLocation();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    // Check if user selected a template from Prompts page
    if (location.state?.selectedTemplate) {
      setSelectedTemplate(location.state.selectedTemplate);
    }
  }, [location]);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  return (
    <div className="min-h-screen relative pb-8">
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content - Chat Centered */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section - Minimal */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
            Build. Learn. Create.{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Love Your Code.
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            Discover India's most personalised vibe coding assistant—turn ideas into real websites, projects, and MVPs.
          </p>
        </div>

        {/* Chat Window - Main Focus (Centered) */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Chat Area */}
          <div className="h-[500px] animate-fade-in-scale">
            <ChatInterface />
          </div>

          {/* History Section - Below Chat */}
          <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <ConversationHistory 
              onSelectConversation={handleSelectConversation}
              currentConversationId={currentConversationId}
            />
          </div>
        </div>

        {/* Optional: Tagline variations for inspiration */}
        {/* 
        Alternative taglines:
        - "Code smarter, ship faster, learn together."
        - "Your vision. Our AI. Pure coding magic."
        - "Transform conversations into complete applications."
        */}
      </div>
    </div>
  );
};

export default Dashboard;
