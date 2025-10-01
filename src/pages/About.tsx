import { FC } from 'react';
import Navigation from '@/components/Navigation';
import { Sparkles } from 'lucide-react';

const About: FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="glass-card p-8 md:p-12">
          <div className="text-center mb-8">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              About <span className="bg-gradient-primary bg-clip-text text-transparent">Module</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Empowering developers to build faster and better
            </p>
          </div>

          <div className="space-y-6 text-foreground">
            <p className="text-lg">
              Module is an AI-powered web development platform that helps you turn ideas into production-ready applications in minutes.
            </p>
            
            <p>
              Whether you're a seasoned developer looking to prototype quickly or a beginner learning to code, Module provides the tools and guidance you need to succeed.
            </p>

            <div className="pt-8">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p>
                To democratize web development by making it accessible, efficient, and enjoyable for everyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
