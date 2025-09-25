import { FC, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, Code2, Database, Palette, Zap, Bot, Terminal, Sparkles, Send } from 'lucide-react';

const Dashboard: FC = () => {
  const [inputValue, setInputValue] = useState('');

  const frameworks = [
    { icon: Code2, name: 'React', color: 'text-blue-400' },
    { icon: Database, name: 'Database', color: 'text-green-400' },
    { icon: Palette, name: 'Design', color: 'text-pink-400' },
    { icon: Terminal, name: 'Backend', color: 'text-yellow-400' },
    { icon: Zap, name: 'API', color: 'text-purple-400' },
    { icon: Bot, name: 'AI', color: 'text-cyan-400' },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Navigation */}
      <Navigation />
      
      {/* Notification Banner */}
      <div className="flex justify-center mb-8">
        <div className="glass-card px-6 py-3 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Rocket className="w-4 h-4 text-primary" />
            MODULE POWERED BY AI CODING ASSISTANT
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Think It. Type It.{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Build It.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Build production-ready{' '}
            <span className="text-primary font-semibold">web applications</span>{' '}
            with AI-powered code generation and assistance.
          </p>
        </div>

        {/* Main Input */}
        <div className="mb-12">
          <div className="glass-card p-2 max-w-3xl mx-auto backdrop-blur-xl border-2 border-glass-border/50 hover:border-primary/30 transition-all duration-300">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-3">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="What can I build for you today?"
                className="border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
              />
              <Button 
                variant="hero" 
                size="lg"
                className="shrink-0"
                disabled={!inputValue.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Framework Icons */}
        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <span className="text-sm text-muted-foreground font-medium">Frameworks</span>
            <span className="text-sm text-muted-foreground font-medium">Integrations</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
            {frameworks.map((framework, index) => (
              <div
                key={framework.name}
                className="glass-card p-4 hover:scale-110 transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <framework.icon className={`w-8 h-8 ${framework.color} group-hover:animate-pulse`} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in">
          <div className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Code2 className="w-10 h-10 text-primary mb-4 group-hover:animate-pulse" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Generate Code</h3>
            <p className="text-muted-foreground">Create components, functions, and full features with AI assistance.</p>
          </div>
          
          <div className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Database className="w-10 h-10 text-accent mb-4 group-hover:animate-pulse" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Build Backend</h3>
            <p className="text-muted-foreground">Set up databases, APIs, and authentication with Supabase integration.</p>
          </div>
          
          <div className="glass-card p-6 text-left hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Palette className="w-10 h-10 text-warm mb-4 group-hover:animate-pulse" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Design UI</h3>
            <p className="text-muted-foreground">Create beautiful, responsive interfaces with modern design patterns.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;