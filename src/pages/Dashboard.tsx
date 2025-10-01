import { FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ChatInterface from '@/components/ChatInterface';
import OutputWindow from '@/components/OutputWindow';
import ProjectSidebar from '@/components/ProjectSidebar';
import DashboardFooter from '@/components/DashboardFooter';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Dashboard: FC = () => {
  const location = useLocation();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user selected a template from Prompts page
    if (location.state?.selectedTemplate) {
      setSelectedTemplate(location.state.selectedTemplate);
    }
  }, [location]);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setSidebarOpen(false); // Close sidebar on mobile after selecting
  };

  const handleNewConversation = () => {
    setCurrentConversationId(undefined);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleConversationCreated = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Graphics */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Floating Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <Navigation />
      
      {/* Main Layout */}
      <div className="max-w-[1800px] mx-auto px-4 pb-8">
        <div className="flex gap-4 h-[calc(100vh-120px)]">
          {/* Left Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProjectSidebar
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              currentConversationId={currentConversationId}
              refreshKey={refreshKey}
            />
          </aside>

          {/* Mobile Hamburger for Sidebar */}
          <div className="lg:hidden fixed bottom-4 left-4 z-50">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="default" size="icon" className="h-12 w-12 rounded-full shadow-lg">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="h-full">
                  <ProjectSidebar
                    onNewConversation={handleNewConversation}
                    onSelectConversation={handleSelectConversation}
                    currentConversationId={currentConversationId}
                    refreshKey={refreshKey}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Center - Chat Interface */}
          <main className="flex-1 min-w-0 flex flex-col">
            <div className="mb-6 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Build. Learn. Create.{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Love Your Code.
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Turn ideas into real websites and MVPs
              </p>
            </div>

            <div className="flex-1">
              <ChatInterface 
                conversationId={currentConversationId}
                onConversationCreated={handleConversationCreated}
              />
            </div>
          </main>

          {/* Right - Output Window - Desktop Only */}
          <aside className="hidden xl:block w-96 flex-shrink-0">
            <OutputWindow />
          </aside>
        </div>

        {/* Footer Sections */}
        <DashboardFooter />
      </div>
    </div>
  );
};

export default Dashboard;