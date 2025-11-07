// File: src/components/ValidationResults.tsx
import React from 'react';
import { ValidationResult, ValidationIssue } from '@/utils/codeQualityValidator';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationResultsProps {
  validationResult: ValidationResult | null;
  isValidating: boolean;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ 
  validationResult, 
  isValidating 
}) => {
  if (isValidating) {
    return (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-primary font-medium">Running quality validation...</span>
        </div>
      </div>
    );
  }

  if (!validationResult) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
    if (score >= 70) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
  };

  const getIssueIcon = (issue: ValidationIssue) => {
    switch (issue.type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: 1 | 2 | 3) => {
    const severityStyles = {
      1: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300',
      2: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300',
      3: 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300'
    };

    const severityLabels = {
      1: 'Critical',
      2: 'Important',
      3: 'Minor'
    };

    return (
      <span className={cn(
        'px-2 py-1 rounded-full text-xs font-medium',
        severityStyles[severity]
      )}>
        {severityLabels[severity]}
      </span>
    );
  };

  return (
    <div className={cn(
      'border rounded-lg p-4 mb-4 transition-all',
      getScoreBackground(validationResult.score)
    )}>
      {/* Quality Score Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            Code Quality Analysis
          </h3>
        </div>
        <div className={cn('text-xl font-bold', getScoreColor(validationResult.score))}>
          {validationResult.score}/100
        </div>
      </div>

      {/* Issues List */}
      {validationResult.issues.length > 0 && (
        <div className="space-y-2 mb-3">
          <h4 className="font-medium text-foreground text-sm">Observations:</h4>
          {validationResult.issues.slice(0, 5).map((issue, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm">
              {getIssueIcon(issue)}
              <div className="flex-1">
                <span className="text-foreground/90">{issue.message}</span>
                {issue.file && (
                  <span className="text-muted-foreground ml-2">({issue.file})</span>
                )}
              </div>
              {getSeverityBadge(issue.severity)}
            </div>
          ))}
          {validationResult.issues.length > 5 && (
            <div className="text-sm text-muted-foreground">
              +{validationResult.issues.length - 5} more issues...
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {validationResult.suggestions.length > 0 && (
        <div className="space-y-1">
          <h4 className="font-medium text-foreground text-sm">Enhancement Ideas:</h4>
          {validationResult.suggestions.map((suggestion, index) => (
            <div key={index} className="text-sm text-foreground/80 ml-6">
              • {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ValidationResults;
