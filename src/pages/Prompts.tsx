import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category?: string;
}

const Prompts: FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('ask/templates');
      
      if (error) throw error;
      
      if (data?.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load prompt templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Navigate back to dashboard with selected template
    navigate('/', { state: { selectedTemplate: templateId } });
  };

  return (
    <div className="min-h-screen relative">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Prompt Templates
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Choose a template to kickstart your project with AI-powered generation
          </p>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card 
                key={template.id}
                className="glass-card hover:scale-105 transition-all duration-300 cursor-pointer group border-2 border-glass-border hover:border-primary/50"
                onClick={() => handleSelectTemplate(template.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-start justify-between text-foreground group-hover:text-primary transition-colors">
                    <span>{template.name}</span>
                    <Sparkles className="w-5 h-5 shrink-0 group-hover:animate-pulse" />
                  </CardTitle>
                  {template.category && (
                    <div className="inline-block px-2 py-1 text-xs rounded-full bg-primary/20 text-primary w-fit">
                      {template.category}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {template.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No templates available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompts;
