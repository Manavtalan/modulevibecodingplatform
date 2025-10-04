import { FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import ConversationHistory from '@/components/ConversationHistory';
import { Sparkles } from 'lucide-react';

const Dashboard: FC = () => {
  const location = useLocation();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    // Check if user selected a template from Prompts page
    if (location.state?.selectedTemplate) {
      setSelectedTemplate(location.state.selectedTemplate);
    }
  }, [location]);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
  };

  const handleConversationCreated = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex w-full">
      {/* Sidebar */}
      <Sidebar initialCollapsed={true} />
      
      {/* Main Content Area - Full Screen Chat */}
      <div 
        className="flex-1 min-h-screen transition-[margin-left] duration-[260ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ml-0 sm:ml-[72px]"
      >
        {/* Background Graphics */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          {/* Subtle Gradient Orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Full Screen Chat Interface */}
        <div className="h-screen flex flex-col">
          <ChatInterface 
            conversationId={currentConversationId}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;