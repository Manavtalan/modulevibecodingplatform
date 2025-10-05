import { FC } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Footer from '@/components/Footer';
import Logo from '@/components/Logo';
import { Rocket, Code2, Zap, Users } from 'lucide-react';

const Dashboard: FC = () => {
  const handleTryDemo = () => {
    // TODO: Update this URL to your actual Chat Interface demo project
    window.location.href = '/chat-demo';
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col w-full" style={{ background: 'linear-gradient(180deg, #0A0A0A 0%, #1C1C1C 100%)' }}>
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar initialCollapsed={true} />
        
        {/* Main Content Area */}
        <div 
          className="flex-1 min-h-screen pb-20 sm:pb-4 transition-[margin-left] duration-[260ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ml-0 sm:ml-[72px]"
        >
          {/* Background Graphics */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            
            {/* Floating Gradient Orbs with Orange */}
            <div className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(255,122,24,0.08) 0%, transparent 70%)' }}></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(255,179,71,0.1) 0%, transparent 70%)', animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ background: 'radial-gradient(circle, rgba(255,122,24,0.06) 0%, transparent 70%)', animationDelay: '2s' }}></div>
            
            {/* Code Snippets Decoration */}
            <div className="absolute top-32 right-20 font-mono text-xs animate-fade-in hidden lg:block" style={{ color: 'rgba(255,122,24,0.15)' }}>
              <pre>{`const build = () => {
  return <Module />;
}`}</pre>
            </div>
            
            <div className="absolute bottom-40 left-20 font-mono text-xs animate-fade-in hidden lg:block" style={{ color: 'rgba(255,179,71,0.15)', animationDelay: '1s' }}>
              <pre>{`function deploy() {
  ship('production');
}`}</pre>
            </div>
          </div>

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-gray-400">
              <button className="hover:text-white transition-colors p-2">
                <Users className="w-5 h-5" />
              </button>
              <button className="hover:text-white transition-colors p-2">
                <Code2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hero Section - Centered */}
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 md:px-8">
            
            {/* Launching Soon Badge */}
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8 animate-fade-in"
              style={{ 
                background: 'linear-gradient(90deg, rgba(255,122,24,0.1) 0%, rgba(255,179,71,0.1) 100%)',
                border: '1px solid rgba(255,122,24,0.3)',
                boxShadow: '0 0 20px rgba(255,122,24,0.3)'
              }}
            >
              <Rocket className="w-4 h-4" style={{ color: '#FF7A18' }} />
              <span className="text-sm font-semibold" style={{ color: '#FFB347' }}>
                Launching Soon
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-4 sm:mb-6 leading-tight animate-fade-in max-w-5xl" style={{ animationDelay: '100ms', fontFamily: 'Inter, system-ui, sans-serif' }}>
              The Next Generation{' '}
              <span 
                className="inline-block bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)'
                }}
              >
                AI Coding Assistant
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl text-center mb-8 sm:mb-12 max-w-3xl animate-fade-in leading-relaxed" style={{ color: '#a1a1a1', animationDelay: '200ms' }}>
              Module AI is launching soon — your all-in-one developer companion to chat, code, debug, and build smarter.
            </p>

            {/* CTA Button */}
            <button 
              onClick={handleTryDemo}
              className="group px-8 py-4 rounded-full text-white font-semibold text-lg transition-all duration-300 hover:scale-105 animate-fade-in flex items-center gap-2"
              style={{ 
                backgroundImage: 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)',
                boxShadow: '0 0 30px rgba(255,122,24,0.4)',
                animationDelay: '300ms'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 40px rgba(255,122,24,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(255,122,24,0.4)';
              }}
            >
              <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Try Demo
            </button>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base mt-8 sm:mt-12 text-center max-w-2xl animate-fade-in" style={{ color: '#737373', animationDelay: '400ms' }}>
              Experience the future of coding — powered by AI. Talk to Module. Debug. Build. Repeat.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#d1d1d1', border: '1px solid rgba(255,255,255,0.1)' }}>
                🚀 AI-Powered
              </div>
              <div className="px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#d1d1d1', border: '1px solid rgba(255,255,255,0.1)' }}>
                ⚡ Lightning Fast
              </div>
              <div className="px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#d1d1d1', border: '1px solid rgba(255,255,255,0.1)' }}>
                🎯 Production Ready
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-sm" style={{ color: '#737373' }}>
        © 2025 Module AI. All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;