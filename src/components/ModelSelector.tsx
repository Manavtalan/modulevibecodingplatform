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
    value: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    description: 'Best quality and reasoning. Ideal for complex projects.',
  },
  {
    value: 'gpt-5-mini',
    label: 'GPT-5 Mini',
    description: 'Fast and balanced. Great for most use cases.',
  },
  {
    value: 'gemini-flash',
    label: 'Gemini Flash',
    description: 'Fastest generation. Good for quick iterations.',
  },
];

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
                <span className="font-medium">{model.label}</span>
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
