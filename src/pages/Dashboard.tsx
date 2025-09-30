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
          
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover India's most personalised vibe coding assistant—turn ideas into real websites, projects, and MVPs.
          </p>
        </div>

        {/* Chat Window - Main Focus (Centered & Smaller) */}
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Main Chat Area - Smaller */}
          <div className="h-[400px] animate-fade-in-scale">
            <ChatInterface />
          </div>

          {/* How Module Can Help You - Glass Section */}
          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              How <span className="bg-gradient-primary bg-clip-text text-transparent">Module</span> Can Help You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Quick Prototyping</h3>
                <p className="text-sm text-muted-foreground">Turn ideas into working MVPs in minutes, not days</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Learn by Building</h3>
                <p className="text-sm text-muted-foreground">Understand code patterns as you create real projects</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Ship Faster</h3>
                <p className="text-sm text-muted-foreground">Deploy production-ready apps with confidence</p>
              </div>
            </div>
          </div>

          {/* History Section - Below */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
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
