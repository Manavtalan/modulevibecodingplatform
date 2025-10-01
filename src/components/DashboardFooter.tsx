import { FC } from 'react';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardFooter: FC = () => {
  return (
    <div className="mt-12 space-y-8 pb-8">
      {/* How Module Works */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
          How <span className="bg-gradient-primary bg-clip-text text-transparent">Module</span> Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              1
            </div>
            <h3 className="font-semibold text-foreground">Describe Your Idea</h3>
            <p className="text-sm text-muted-foreground">
              Tell Module what you want to build in plain English
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              2
            </div>
            <h3 className="font-semibold text-foreground">AI Generates Code</h3>
            <p className="text-sm text-muted-foreground">
              Watch as Module creates production-ready code instantly
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              3
            </div>
            <h3 className="font-semibold text-foreground">Deploy & Ship</h3>
            <p className="text-sm text-muted-foreground">
              Deploy your app to production with one click
            </p>
          </div>
        </div>
      </div>

      {/* Recent Projects/History */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Projects</h3>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center py-4">
            Your recent projects will appear here
          </p>
        </div>
      </div>

      {/* Global Footer */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>© 2025 Module. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </Link>
            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFooter;
