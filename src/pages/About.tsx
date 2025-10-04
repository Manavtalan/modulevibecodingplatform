import { FC } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Sparkles, Zap, Shield, Users, Code2, Rocket } from 'lucide-react';
import heroImage from '@/assets/about-hero.jpg';

const About: FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex w-full">
      {/* Sidebar */}
      <Sidebar initialCollapsed={true} />
      
      {/* Main Content Area */}
      <div className="flex-1 min-h-screen transition-[margin-left] duration-[260ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ml-0 sm:ml-[72px]">
        {/* Background Graphics */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 relative z-[1]">
          
          {/* Hero Section */}
          <section className="text-center mb-12 sm:mb-16 animate-fade-in">
            <div className="mb-8 rounded-2xl overflow-hidden glass-card p-1">
              <img 
                src={heroImage}
                alt="AI Development Platform"
                className="w-full h-48 sm:h-64 md:h-80 object-cover rounded-xl"
              />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              About{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Module
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-light">
              Build Smarter with Module
            </p>
          </section>

          {/* Main Content Section */}
          <section className="glass-card p-6 sm:p-8 md:p-10 mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="prose prose-lg max-w-none">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                Module is a cutting-edge AI development platform designed to simplify the way developers, startups, and businesses build intelligent applications. With Module, users can access powerful AI tools, APIs, and integrations without dealing with complex infrastructure or steep learning curves. Our platform combines advanced AI models, real-time code assistance, and project management features, enabling teams to accelerate development cycles while maintaining high-quality outputs.
              </p>
              
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6">
                At its core, Module focuses on ease of use, flexibility, and scalability. Developers can leverage pre-built AI modules, customize workflows, and deploy solutions quickly, whether it's for code generation, debugging, natural language processing, or automating business processes. Module's intuitive interface ensures that even users with minimal AI expertise can harness the power of AI efficiently.
              </p>
              
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Security and collaboration are integral to Module's design. Our platform provides secure workspaces, role-based access, and seamless team collaboration tools. Additionally, Module constantly updates its AI capabilities, ensuring users stay at the forefront of technology. With Module, building AI-powered solutions is no longer limited to experts—any developer or organization can innovate, create, and scale smarter solutions with confidence and speed.
              </p>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mb-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
              Why Choose{' '}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Module?
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">AI-Powered Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Access cutting-edge AI models and tools to accelerate your development workflow.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Rapid Deployment</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy production-ready applications quickly with pre-built modules and templates.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Enterprise Security</h3>
                <p className="text-sm text-muted-foreground">
                  Secure workspaces with role-based access control and data encryption.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Work together seamlessly with real-time collaboration and project management tools.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <Code2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Code Assistance</h3>
                <p className="text-sm text-muted-foreground">
                  Get real-time code suggestions, debugging help, and best practice recommendations.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="glass-card p-6 hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Scalable Solutions</h3>
                <p className="text-sm text-muted-foreground">
                  Build applications that scale from prototype to production with ease.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="glass-card p-8 sm:p-10 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of developers who are building the future with Module's AI-powered platform.
            </p>
            <a 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:scale-105 transition-transform shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Now
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;