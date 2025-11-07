// File: src/components/QualitySettings.tsx
import React from 'react';
import { Settings, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QualitySettingsProps {
  autoRetry: boolean;
  setAutoRetry: (value: boolean) => void;
  minQualityScore: number;
  setMinQualityScore: (value: number) => void;
  maxRetries: number;
  setMaxRetries: (value: number) => void;
}

const QualitySettings: React.FC<QualitySettingsProps> = ({
  autoRetry,
  setAutoRetry,
  minQualityScore,
  setMinQualityScore,
  maxRetries,
  setMaxRetries
}) => {
  const getQualityLabel = (score: number) => {
    if (score >= 90) return 'Very Strict';
    if (score >= 80) return 'Strict';
    if (score >= 70) return 'Moderate';
    return 'Lenient';
  };

  return (
    <Card className="p-4 space-y-4 bg-background border-border">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Quality Validation Settings</h3>
      </div>

      {/* Auto Retry Setting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor="auto-retry" className="text-sm font-medium text-foreground">
            Auto-retry on validation failure
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically regenerate code if quality validation fails</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="auto-retry"
          checked={autoRetry}
          onCheckedChange={setAutoRetry}
        />
      </div>

      {/* Minimum Quality Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">
            Minimum Quality Score
          </Label>
          <span className="text-sm font-semibold text-primary">
            {minQualityScore}/100
          </span>
        </div>
        <Slider
          value={[minQualityScore]}
          onValueChange={(values) => setMinQualityScore(values[0])}
          min={60}
          max={95}
          step={5}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground">
          {getQualityLabel(minQualityScore)}
        </div>
      </div>

      {/* Max Retries */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Maximum Retry Attempts
        </Label>
        <Select
          value={maxRetries.toString()}
          onValueChange={(value) => setMaxRetries(parseInt(value))}
        >
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Select retry limit" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            <SelectItem value="1">1 retry</SelectItem>
            <SelectItem value="2">2 retries</SelectItem>
            <SelectItem value="3">3 retries</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};

export default QualitySettings;
