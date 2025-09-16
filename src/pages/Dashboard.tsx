import { FC } from 'react';
import Navigation from '@/components/Navigation';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Code, Bug, Lightbulb } from 'lucide-react';

const Dashboard: FC = () => {
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        
        {/* Hero Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Build, Create, Learn.{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Love Your Code.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your AI-powered coding companion that helps you write better code, 
            fix bugs, and learn new technologies with ease.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button variant="glass" className="p-6 h-auto flex-col gap-3">
            <Plus className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium">New Chat</span>
          </Button>
          
          <Button variant="glass" className="p-6 h-auto flex-col gap-3">
            <Code className="w-6 h-6 text-accent" />
            <span className="text-sm font-medium">Generate Code</span>
          </Button>
          
          <Button variant="glass" className="p-6 h-auto flex-col gap-3">
            <Bug className="w-6 h-6 text-warm" />
            <span className="text-sm font-medium">Fix Errors</span>
          </Button>
          
          <Button variant="glass" className="p-6 h-auto flex-col gap-3">
            <Lightbulb className="w-6 h-6 text-purple" />
            <span className="text-sm font-medium">Learn</span>
          </Button>
        </div>

        {/* Main Chat Interface */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Chats
              </h3>
              <div className="space-y-3">
                <div className="glass-card p-3 hover:bg-glass/20 cursor-pointer transition-all duration-200">
                  <p className="text-sm font-medium text-foreground">React Components</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
                <div className="glass-card p-3 hover:bg-glass/20 cursor-pointer transition-all duration-200">
                  <p className="text-sm font-medium text-foreground">API Integration</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
                <div className="glass-card p-3 hover:bg-glass/20 cursor-pointer transition-all duration-200">
                  <p className="text-sm font-medium text-foreground">Database Schema</p>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="h-[600px]">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;