// File: src/components/DesignPatternShowcase.tsx
import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DesignPatternValidation } from '../utils/designPatternValidator';

interface DesignPatternShowcaseProps {
  validation: DesignPatternValidation | null;
}

const DesignPatternShowcase: React.FC<DesignPatternShowcaseProps> = ({ validation }) => {
  if (!validation) return null;

  const getPatternIcon = (found: boolean, importance: string) => {
    if (found) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return importance === 'critical' ? 
        <XCircle className="h-5 w-5 text-red-500" /> :
        <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Modern Design Patterns
        </h3>
        <div className={`text-2xl font-bold ${getScoreColor(validation.score)}`}>
          {validation.score}/100
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {validation.patterns.map((pattern, index) => (
          <div
            key={index}
            className={`flex items-center space-x-3 p-3 rounded-lg border ${
              pattern.found 
                ? 'bg-green-50 border-green-200' 
                : pattern.importance === 'critical'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            {getPatternIcon(pattern.found, pattern.importance)}
            <div className="flex-1">
              <div className="font-medium text-gray-900">{pattern.pattern}</div>
              <div className="text-sm text-gray-600">{pattern.description}</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full font-medium ${
              pattern.importance === 'critical' 
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {pattern.importance}
            </div>
          </div>
        ))}
      </div>

      {validation.suggestions.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Improvement Suggestions:</h4>
          <div className="space-y-2">
            {validation.suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-gray-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`mt-4 p-3 rounded-lg ${
        validation.valid 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        <div className="font-medium">
          {validation.valid 
            ? '✓ Meets modern design standards' 
            : '✗ Needs modern design improvements'}
        </div>
      </div>
    </div>
  );
};

export default DesignPatternShowcase;
