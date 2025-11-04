import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface TemplateCardProps {
  title: string;
  description: string;
  category: string;
  features: string[];
  icon: React.ReactNode;
  onSelect: () => void;
  isPopular?: boolean;
}

export function TemplateCard({
  title,
  description,
  category,
  features,
  icon,
  onSelect,
  isPopular = false,
}: TemplateCardProps) {
  return (
    <Card className="glass-card p-6 hover:scale-105 transition-all duration-300 relative overflow-hidden group">
      {isPopular && (
        <Badge className="absolute top-4 right-4 bg-gradient-primary border-0">
          <Sparkles className="w-3 h-3 mr-1" />
          Popular
        </Badge>
      )}
      
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold mb-1 truncate">{title}</h3>
          <p className="text-sm text-muted-foreground">{category}</p>
        </div>
      </div>
      
      <p className="text-sm text-foreground/80 mb-4 line-clamp-2">
        {description}
      </p>
      
      <div className="space-y-2 mb-6">
        {features.slice(0, 3).map((feature, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            <span className="truncate">{feature}</span>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={onSelect} 
        variant="glass"
        className="w-full group-hover:glow-primary"
      >
        Use Template
      </Button>
    </Card>
  );
}
