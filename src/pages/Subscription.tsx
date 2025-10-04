import { Sparkles, Gift, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar/Sidebar';

const Subscription = () => {
  const handleJoinTesting = () => {
    // Navigate to main dashboard/chat
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      
      <main className="flex-1 ml-[72px] p-6 md:p-8 lg:p-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 pt-8">
            <Badge className="bg-gradient-primary text-primary-foreground px-6 py-2 text-base font-semibold">
              <Sparkles className="w-4 h-4 mr-2" />
              Testing Phase
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Free Access for Everyone
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the full power of Module without any charges
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="glass-card border-border shadow-elegant">
            <CardContent className="p-8 md:p-12 space-y-8">
              {/* Main Message */}
              <div className="text-center space-y-6">
                <div className="inline-block p-4 rounded-full bg-primary/10">
                  <Rocket className="w-12 h-12 text-primary" />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">
                    Module is Currently in Testing Mode
                  </h2>
                  
                  <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                    We're excited to have you explore and experience our <span className="font-semibold text-primary">AI-powered web application platform</span> completely free during this testing phase. All features are available without any charges as we refine and perfect the Module experience.
                  </p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 pt-6">
                <div className="text-center space-y-3 p-6 rounded-lg glass hover:bg-muted/50 transition-all">
                  <div className="inline-block p-3 rounded-full bg-primary/10">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Full Access</h3>
                  <p className="text-sm text-muted-foreground">
                    All features unlocked and ready for you to explore
                  </p>
                </div>

                <div className="text-center space-y-3 p-6 rounded-lg glass hover:bg-muted/50 transition-all">
                  <div className="inline-block p-3 rounded-full bg-primary/10">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Exclusive Discounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Early users receive special pricing when we launch
                  </p>
                </div>

                <div className="text-center space-y-3 p-6 rounded-lg glass hover:bg-muted/50 transition-all">
                  <div className="inline-block p-3 rounded-full bg-primary/10">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Affordable Pricing</h3>
                  <p className="text-sm text-muted-foreground">
                    Accessible plans designed for all users coming soon
                  </p>
                </div>
              </div>

              {/* Upcoming Launch Message */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-3">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                  Coming Soon: Affordable Pricing System
                </h3>
                <p className="text-foreground/80 text-center leading-relaxed">
                  Very soon, we will launch an <span className="font-semibold text-primary">affordable pricing system</span> tailored for all users, ensuring everyone can access the full power of Module. Early users like you will receive <span className="font-semibold text-primary">exclusive discounts</span> when pricing goes live.
                </p>
              </div>

              {/* Feedback Section */}
              <div className="text-center space-y-4 pt-4">
                <p className="text-muted-foreground">
                  Your feedback during this testing phase is invaluable and will help us build the best experience possible. Thank you for being part of the Module journey!
                </p>
                
                <Button 
                  variant="default" 
                  size="xl"
                  onClick={handleJoinTesting}
                  className="mt-4"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Building for Free
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trust Badge */}
          <div className="text-center pb-8">
            <p className="text-sm text-muted-foreground">
              🔒 Your data is secure. Module is built with enterprise-grade security standards.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
