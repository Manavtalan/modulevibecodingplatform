import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const models = [
  {
    value: 'claude-opus-4-1-20250805',
    label: 'Claude Opus 4',
    badge: 'Primary',
    description: 'Highly intelligent model - 200K context, 32K output tokens'
  },
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    badge: 'Secondary',
    description: 'Fast and efficient for most tasks'
  },
  {
    value: 'claude-3-sonnet',
    label: 'Claude 3 Sonnet',
    badge: 'Fallback',
    description: 'Balanced performance and quality'
  }
] as const;

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const selectedModel = models.find(m => m.value === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="model">AI Model</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Different models offer different trade-offs between speed, quality, and cost.
                Claude excels at complex reasoning, GPT-5 is well-balanced, and Gemini is fastest.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="model">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.label}</span>
                  {model.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      model.badge === 'Primary' ? 'bg-primary/20 text-primary' :
                      model.badge === 'Secondary' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {model.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedModel && (
        <p className="text-xs text-muted-foreground">
          {selectedModel.description}
        </p>
      )}
    </div>
  );
}
