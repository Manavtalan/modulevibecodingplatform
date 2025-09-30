import { FC, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket, Code2, Database, Palette, Zap, Bot, Terminal, Sparkles, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard: FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const { toast } = useToast();

  const testOpenAI = async () => {
    setIsTestingOpenAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-openai');
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "✅ OpenAI API Working!",
          description: data.message,
        });
      } else {
        toast({
          title: "❌ OpenAI API Error",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OpenAI test error:', error);
      toast({
        title: "❌ Test Failed",
        description: error instanceof Error ? error.message : "Failed to test OpenAI API",
        variant: "destructive",
      });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

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
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="glass-card px-6 py-3 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Rocket className="w-4 h-4 text-primary" />
            MODULE POWERED BY AI CODING ASSISTANT
          </div>
        </div>
        
        {/* OpenAI Test Button */}
        <Button 
          onClick={testOpenAI} 
          disabled={isTestingOpenAI}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <Bot className="w-4 h-4" />
          {isTestingOpenAI ? 'Testing OpenAI...' : 'Test OpenAI API'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Build, Create, Learn.{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Love Your Code.
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-fade-in mb-24">
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

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How Module Does It
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              One prompt in, complete application out. Our AI understands your vision and builds it from scratch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center animate-fade-in">
              <div className="glass-card p-8 mb-4 hover:scale-105 transition-all duration-300">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">1</div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Describe Your Idea</h3>
              <p className="text-muted-foreground text-sm">Tell us what you want to build in natural language</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="glass-card p-8 mb-4 hover:scale-105 transition-all duration-300">
                <Bot className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">2</div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Analyzes</h3>
              <p className="text-muted-foreground text-sm">Our AI breaks down your requirements and plans the architecture</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="glass-card p-8 mb-4 hover:scale-105 transition-all duration-300">
                <Code2 className="w-12 h-12 text-warm mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">3</div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Code Generation</h3>
              <p className="text-muted-foreground text-sm">Clean, production-ready code is generated automatically</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="glass-card p-8 mb-4 hover:scale-105 transition-all duration-300">
                <Rocket className="w-12 h-12 text-purple mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">4</div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Deploy & Launch</h3>
              <p className="text-muted-foreground text-sm">Your app is ready to deploy and share with the world</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Trusted by Developers Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of developers who are building faster and better with AI assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="glass-card p-3 shrink-0">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Lightning Fast Development</h3>
                  <p className="text-muted-foreground">Build complete applications in minutes, not days. Our AI handles the heavy lifting.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="glass-card p-3 shrink-0">
                  <Database className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Full-Stack Ready</h3>
                  <p className="text-muted-foreground">Frontend, backend, database, and authentication - everything you need in one place.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="glass-card p-3 shrink-0">
                  <Terminal className="w-6 h-6 text-warm" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Production Ready</h3>
                  <p className="text-muted-foreground">Clean, maintainable code that follows best practices and industry standards.</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="text-6xl font-bold text-primary mb-4">100K+</div>
              <div className="text-xl font-semibold text-foreground mb-2">Apps Created</div>
              <div className="text-muted-foreground">Developers trust Module for their projects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;