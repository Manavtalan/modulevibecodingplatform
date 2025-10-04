import { FC, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import ConversationHistory from '@/components/ConversationHistory';
import Footer from '@/components/Footer';
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
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
    if (location.state?.selectedPrompt) {
      // Set the prompt text in input when coming from Prompts page
      setSelectedTemplate(location.state.selectedPrompt);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
    }
    if (location.state?.conversationId) {
      // Load specific conversation when coming from Chat History
      setCurrentConversationId(location.state.conversationId);
      // Clear the state after using it
      window.history.replaceState({}, document.title);
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
    <div className="min-h-screen relative overflow-hidden flex flex-col w-full">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar initialCollapsed={true} />
        
        {/* Main Content Area */}
        <div 
          className="flex-1 min-h-screen pb-20 sm:pb-8 transition-[margin-left] duration-[260ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ml-0 sm:ml-[72px]"
        >
        {/* Background Graphics */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          
          {/* Floating Gradient Orbs */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Code Snippets Decoration */}
          <div className="absolute top-32 right-20 text-primary/10 font-mono text-xs animate-fade-in hidden lg:block">
            <pre>{`const build = () => {
  return <App />;
}`}</pre>
          </div>
          
          <div className="absolute bottom-40 left-20 text-primary/10 font-mono text-xs animate-fade-in hidden lg:block" style={{ animationDelay: '1s' }}>
            <pre>{`function deploy() {
  ship('production');
}`}</pre>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 relative z-[1]">

          {/* Hero Section - Minimal */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in pt-4 sm:pt-6 md:pt-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 leading-tight px-2">
              Build. Learn. Create.{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Love Your Code.
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Turn ideas into real websites and MVPs.
            </p>
          </div>

          {/* Chat Window - Main Focus (Centered & Smaller) */}
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            {/* Main Chat Area - Even Smaller like Lovable */}
            <div className="animate-fade-in-scale">
              <ChatInterface 
                conversationId={currentConversationId}
                onConversationCreated={handleConversationCreated}
                initialPrompt={selectedTemplate}
              />
            </div>

            {/* Tech Stack Icons */}
            <div className="flex justify-center items-center gap-4 sm:gap-6 md:gap-8 py-4 sm:py-6 animate-fade-in overflow-x-auto" style={{ animationDelay: '50ms' }}>
              <div className="text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z"/>
                </svg>
              </div>
              <div className="text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z"/>
                </svg>
              </div>
              <div className="text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
                </svg>
              </div>
              <div className="text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z"/>
                </svg>
              </div>
            </div>

            {/* How Module Can Help You - Glass Section */}
            <div className="glass-card p-4 sm:p-6 md:p-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 text-center">
                How <span className="bg-gradient-primary bg-clip-text text-transparent">Module</span> Can Help You
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-primary flex items-center justify-center mb-2 sm:mb-3 shadow-lg hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Quick Prototyping</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Turn ideas into working MVPs in minutes, not days</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-primary flex items-center justify-center mb-2 sm:mb-3 shadow-lg hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Learn by Building</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Understand code patterns as you create real projects</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl bg-gradient-primary flex items-center justify-center mb-2 sm:mb-3 shadow-lg hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Ship Faster</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Deploy production-ready apps with confidence</p>
                </div>
              </div>
            </div>

            {/* History Section - Below (Hidden on mobile, shown on desktop) */}
            <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '200ms' }}>
              <ConversationHistory 
                key={refreshKey}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                currentConversationId={currentConversationId}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Dashboard;