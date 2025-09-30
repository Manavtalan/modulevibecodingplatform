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
        {/* Hero Section - Compact */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              AI-POWERED CODING PLATFORM FOR INDIAN DEVELOPERS
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Build, Create, Learn.{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Love Your Code.
            </span>
          </h1>
          
          <div className="space-y-2 max-w-3xl mx-auto">
            <p className="text-lg md:text-xl text-muted-foreground">
              Build fully functional apps and websites through simple conversations.
            </p>
            <p className="text-base text-muted-foreground/80 hidden md:block">
              From MVPs to landing pages—your ideas, our AI, limitless possibilities.
            </p>
          </div>
        </div>

        {/* Chat Window - Main Focus */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="h-[600px] animate-fade-in-scale">
              <ChatInterface />
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '150ms' }}>
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
