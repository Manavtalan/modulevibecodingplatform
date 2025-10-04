import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sparkles, Search, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PromptTemplate {
  id: number;
  name: string;
  description: string;
}

const AI_WEB_APP_PROMPTS: PromptTemplate[] = [
  {
    id: 1,
    name: "Landing Page Generator",
    description: "Generate a responsive, modern landing page for a web startup or SaaS product. Include AI-powered sections like hero banners, dynamic content, testimonials, pricing plans, and call-to-action buttons. Suggest layouts, colors, and typography suitable for web development."
  },
  {
    id: 2,
    name: "MVP Builder",
    description: "Create a minimal viable product (MVP) concept for a web application. Provide core features, user flows, and wireframes to validate the idea quickly. Include suggested web frameworks, tech stack, and database structure."
  },
  {
    id: 3,
    name: "Web App Generator",
    description: "Design a fully functional web application with user authentication, dashboards, role-based access, and API integrations. Include suggested UI components, layouts, and database design suitable for web development."
  },
  {
    id: 4,
    name: "AI Chatbot Web App",
    description: "Create an AI-powered chatbot integrated into a web application for customer support or lead generation. Include conversation flows, intent recognition, fallback responses, and integration with web dashboards."
  },
  {
    id: 5,
    name: "E-commerce Web App",
    description: "Generate a complete AI-powered e-commerce web application. Include product catalog, search and recommendation engine, shopping cart, checkout flow, and payment gateway integration. Suggest UI components and admin dashboards."
  },
  {
    id: 6,
    name: "SaaS Web App Idea",
    description: "Design a web-based SaaS application with core modules, subscription tiers, dashboards, and automated workflows. Include suggested front-end frameworks, back-end architecture, and AI-powered analytics."
  },
  {
    id: 7,
    name: "Portfolio Web App",
    description: "Create a personal portfolio web application with AI-assisted project showcases, blogs, and contact forms. Include dynamic content sections, responsive layouts, and customizable themes."
  },
  {
    id: 8,
    name: "Social Media Web App",
    description: "Generate a social media web platform with AI-powered content recommendations, feeds, user interactions, messaging, and moderation tools. Include dashboard for analytics and engagement tracking."
  },
  {
    id: 9,
    name: "Analytics Dashboard Web App",
    description: "Design a web analytics dashboard with AI-driven insights, charts, filters, KPIs, and predictive analysis. Include customizable layouts, real-time data updates, and integration with databases or APIs."
  },
  {
    id: 10,
    name: "AI Content Generator Web App",
    description: "Create a web application that generates AI-powered content such as blogs, social posts, and marketing material. Include templates, tone adjustments, plagiarism checks, and integration with CMS platforms."
  },
  {
    id: 11,
    name: "Fitness Tracker Web App",
    description: "Build a fitness web application with AI-powered workout recommendations, diet tracking, progress visualization, and personalized dashboards. Include responsive UI, graphs, and admin dashboard features."
  },
  {
    id: 12,
    name: "Learning Management System Web App",
    description: "Design an AI-powered LMS web application with course modules, quizzes, student progress tracking, and personalized learning paths. Include teacher and admin dashboards and analytics tools."
  },
  {
    id: 13,
    name: "Voice Assistant Web App",
    description: "Generate a web application with a voice-enabled AI assistant that helps users automate tasks, set reminders, and fetch information. Include a dashboard for analytics and task history."
  },
  {
    id: 14,
    name: "Finance Tracker Web App",
    description: "Create a web-based finance tracking application with AI insights for budgeting, expense analysis, investment suggestions, and predictive alerts. Include dashboards and graphs for financial visualization."
  },
  {
    id: 15,
    name: "Healthcare Web App",
    description: "Design a web application for healthcare management with AI-powered symptom checking, patient tracking, teleconsultation scheduling, and dashboards for doctors and patients."
  },
  {
    id: 16,
    name: "Travel Planner Web App",
    description: "Build a web application for travel planning with AI-generated itineraries, bookings, recommendations, and budget analysis. Include dashboards and interactive route planners."
  },
  {
    id: 17,
    name: "Real Estate Web App",
    description: "Generate a web application for real estate with AI-powered property recommendations, price predictions, search filters, virtual tours, and dashboards for agents and users."
  },
  {
    id: 18,
    name: "Productivity Web App",
    description: "Create an AI-powered productivity web application with task management, reminders, project boards, workflow automation, and collaboration dashboards. Include analytics and AI suggestions for task prioritization."
  },
  {
    id: 19,
    name: "Job Portal Web App",
    description: "Design a web-based job portal with AI-powered resume matching, job recommendations, employer dashboards, and analytics. Include search filters, notifications, and application tracking."
  },
  {
    id: 20,
    name: "AI Game Web App",
    description: "Create a web application for an AI-powered game with dynamic gameplay, AI-driven NPC behavior, procedural content generation, and leaderboards. Include UI layout, interactive screens, and user stats dashboards."
  }
];

const Prompts: FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredPrompts = AI_WEB_APP_PROMPTS.filter(prompt =>
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyPrompt = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.description);
    setCopiedId(prompt.id);
    toast({
      title: "Copied!",
      description: `"${prompt.name}" prompt copied to clipboard`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUsePrompt = (prompt: PromptTemplate) => {
    navigate('/', { state: { selectedPrompt: prompt.description } });
  };

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 relative z-[1]">
          
          {/* Header */}
          <div className="mb-8 sm:mb-10 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                AI App Development Prompts
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6">
              Use these prompts to generate AI-powered app ideas, prototypes, and MVPs for your projects.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-border/50 focus:border-primary"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '100ms' }}>
            Showing {filteredPrompts.length} of {AI_WEB_APP_PROMPTS.length} prompts
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {filteredPrompts.map((prompt) => (
              <Card 
                key={prompt.id}
                className="glass-card hover:scale-105 transition-all duration-300 group border border-border/50 hover:border-primary/50"
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between text-foreground group-hover:text-primary transition-colors text-lg">
                    <span>{prompt.name}</span>
                    <Sparkles className="w-5 h-5 shrink-0 group-hover:animate-pulse text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {prompt.description}
                  </CardDescription>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUsePrompt(prompt)}
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Use Prompt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyPrompt(prompt)}
                      className="glass-card border-border/50 hover:border-primary/50"
                    >
                      {copiedId === prompt.id ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredPrompts.length === 0 && (
            <div className="text-center py-16 glass-card animate-fade-in">
              <p className="text-muted-foreground text-lg mb-2">No prompts found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prompts;
