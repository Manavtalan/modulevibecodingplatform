// File: src/utils/designPatternValidator.ts

export interface DesignPatternValidation {
  valid: boolean;
  score: number;
  patterns: PatternCheck[];
  suggestions: string[];
}

export interface PatternCheck {
  pattern: string;
  found: boolean;
  importance: 'critical' | 'important' | 'nice-to-have';
  description: string;
}

export class DesignPatternValidator {
  
  static validateModernPatterns(files: Array<{ path: string; content: string }>): DesignPatternValidation {
    const patterns: PatternCheck[] = [];
    let score = 100;
    
    const cssFiles = files.filter(f => f.path.endsWith('.css') || f.content.includes('className') || f.content.includes('style'));
    const allContent = cssFiles.map(f => f.content).join('\n').toLowerCase();
    
    // Check for gradient backgrounds
    const hasGradients = allContent.includes('linear-gradient') || 
                        allContent.includes('radial-gradient') ||
                        allContent.includes('gradient-to-');
    
    patterns.push({
      pattern: 'Gradient Backgrounds',
      found: hasGradients,
      importance: 'critical',
      description: 'Modern gradient backgrounds for visual depth'
    });
    
    // Check for glassmorphism effects
    const hasGlassmorphism = allContent.includes('backdrop-filter') ||
                            allContent.includes('blur') ||
                            (allContent.includes('rgba') && allContent.includes('0.1'));
    
    patterns.push({
      pattern: 'Glassmorphism Effects',
      found: hasGlassmorphism,
      importance: 'important',
      description: 'Glassmorphism cards with blur and transparency'
    });
    
    // Check for smooth animations
    const hasSmoothAnimations = allContent.includes('transition') ||
                               allContent.includes('cubic-bezier') ||
                               allContent.includes('animation') ||
                               allContent.includes('transform');
    
    patterns.push({
      pattern: 'Smooth Animations',
      found: hasSmoothAnimations,
      importance: 'critical',
      description: 'Smooth hover effects and transitions'
    });
    
    // Check for modern typography
    const hasModernTypography = allContent.includes('letter-spacing') ||
                               allContent.includes('font-weight') ||
                               allContent.includes('line-height') ||
                               (allContent.includes('inter') || allContent.includes('poppins'));
    
    patterns.push({
      pattern: 'Modern Typography',
      found: hasModernTypography,
      importance: 'important',
      description: 'Professional typography with proper spacing'
    });
    
    // Check for responsive design
    const hasResponsive = allContent.includes('@media') ||
                         allContent.includes('clamp') ||
                         allContent.includes('grid') ||
                         allContent.includes('flex');
    
    patterns.push({
      pattern: 'Responsive Design',
      found: hasResponsive,
      importance: 'critical',
      description: 'Mobile-first responsive layouts'
    });
    
    // Check for modern colors
    const hasModernColors = allContent.includes('hsl') ||
                           allContent.includes('rgba') ||
                           allContent.includes('var(--');
    
    patterns.push({
      pattern: 'Modern Color System',
      found: hasModernColors,
      importance: 'important',
      description: 'Professional color palette with design tokens'
    });
    
    // Calculate score
    patterns.forEach(pattern => {
      if (!pattern.found) {
        switch (pattern.importance) {
          case 'critical':
            score -= 20;
            break;
          case 'important':
            score -= 12;
            break;
          case 'nice-to-have':
            score -= 5;
            break;
        }
      }
    });
    
    score = Math.max(0, score);
    
    // Generate suggestions
    const suggestions = this.generatePatternSuggestions(patterns);
    
    return {
      valid: score >= 80 && patterns.filter(p => p.importance === 'critical').every(p => p.found),
      score,
      patterns,
      suggestions
    };
  }
  
  private static generatePatternSuggestions(patterns: PatternCheck[]): string[] {
    const suggestions: string[] = [];
    const missingPatterns = patterns.filter(p => !p.found);
    
    if (missingPatterns.some(p => p.pattern === 'Gradient Backgrounds')) {
      suggestions.push('Add gradient backgrounds: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)');
    }
    
    if (missingPatterns.some(p => p.pattern === 'Glassmorphism Effects')) {
      suggestions.push('Implement glassmorphism: backdrop-filter: blur(16px); background: rgba(255,255,255,0.1)');
    }
    
    if (missingPatterns.some(p => p.pattern === 'Smooth Animations')) {
      suggestions.push('Add smooth transitions: transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)');
    }
    
    if (missingPatterns.some(p => p.pattern === 'Modern Typography')) {
      suggestions.push('Use modern typography: letter-spacing, font-weight variations, line-height');
    }
    
    if (missingPatterns.some(p => p.pattern === 'Responsive Design')) {
      suggestions.push('Add responsive layouts: CSS Grid, Flexbox, media queries, clamp()');
    }
    
    if (missingPatterns.some(p => p.pattern === 'Modern Color System')) {
      suggestions.push('Use design tokens: CSS custom properties with HSL values');
    }
    
    return suggestions;
  }
}
