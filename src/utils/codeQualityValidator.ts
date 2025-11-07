// File: src/utils/codeQualityValidator.ts

import { ComponentArchitectureValidator } from './componentArchitectureValidator';

export interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'structure' | 'design' | 'modern' | 'accessibility' | 'architecture';
  message: string;
  file?: string;
  severity: 1 | 2 | 3; // 1=critical, 2=important, 3=minor
}

export class CodeQualityValidator {
  
  /**
   * Main validation function that checks code quality across all files
   */
  static validateCodebase(files: CodeFile[], codeType: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 100;

    // Run all validation checks
    const structureValidation = this.validateFileStructure(files, codeType);
    const designValidation = this.validateDesignQuality(files);
    const modernValidation = this.validateModernPatterns(files);
    const accessibilityValidation = this.validateAccessibility(files);

    // NEW: React architecture validation
    if (codeType === 'react') {
      const componentFiles = files.map(f => ({
        path: f.path,
        content: f.content,
        lineCount: f.content.split('\n').length
      }));

      const architectureValidation = ComponentArchitectureValidator.validateReactArchitecture(componentFiles);
      
      // Convert architecture issues to validation issues
      const convertedIssues = architectureValidation.issues.map(issue => ({
        type: issue.type,
        category: 'architecture' as const,
        message: issue.message,
        file: issue.file,
        severity: issue.severity
      }));

      issues.push(...convertedIssues);
      
      // Architecture score impacts overall score more heavily
      score = Math.min(score, architectureValidation.score);
    }

    // Combine all issues
    issues.push(...structureValidation.issues);
    issues.push(...designValidation.issues);
    issues.push(...modernValidation.issues);
    issues.push(...accessibilityValidation.issues);

    // Calculate overall score
    issues.forEach(issue => {
      switch (issue.severity) {
        case 1: score -= 15; break; // Critical issues
        case 2: score -= 8; break;  // Important issues  
        case 3: score -= 3; break;  // Minor issues
      }
    });

    score = Math.max(0, score);

    // Generate suggestions
    const suggestions = this.generateSuggestions(issues, codeType);

    return {
      valid: score >= 80 && !issues.some(i => i.severity === 1),
      score,
      issues,
      suggestions
    };
  }

  /**
   * Validate file structure requirements
   */
  private static validateFileStructure(files: CodeFile[], codeType: string): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    if (codeType === 'html') {
      // HTML project must have minimum 3 files
      if (files.length < 3) {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `HTML projects must have at least 3 files, found ${files.length}`,
          severity: 1
        });
      }

      // Check for required files
      const requiredFiles = ['index.html', '.css', '.js'];
      const missingFiles = requiredFiles.filter(required => 
        !files.some(file => 
          required === 'index.html' ? file.path.includes('index.html') :
          file.path.endsWith(required)
        )
      );

      missingFiles.forEach(missing => {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `Missing required file type: ${missing}`,
          severity: 1
        });
      });

      // Check for inline styles/scripts (bad practice)
      const htmlFiles = files.filter(f => f.path.endsWith('.html'));
      htmlFiles.forEach(file => {
        if (file.content.includes('<style>') || file.content.includes('<script>')) {
          issues.push({
            type: 'warning',
            category: 'structure',
            message: 'Avoid inline styles and scripts. Use external files.',
            file: file.path,
            severity: 2
          });
        }
      });
    }

    if (codeType === 'react') {
      // React project must have minimum 5 component files
      if (files.length < 5) {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `React projects must have at least 5 component files, found ${files.length}`,
          severity: 1
        });
      }

      // Check for required React files
      const requiredReactFiles = [
        'App.tsx',
        'Navbar',
        'Hero',
        'Features',
        'Footer'
      ];

      const missingComponents = requiredReactFiles.filter(required => 
        !files.some(file => file.path.includes(required))
      );

      missingComponents.forEach(missing => {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `Missing required React component: ${missing}`,
          severity: 1
        });
      });

      // Check for design tokens
      const hasDesignTokens = files.some(f => 
        f.path.includes('design-tokens') || 
        f.path.includes('tokens.css') ||
        f.content.includes('--primary-') ||
        f.content.includes('--space-')
      );

      if (!hasDesignTokens) {
        issues.push({
          type: 'error',
          category: 'structure',
          message: 'Missing design tokens system (design-tokens.css)',
          severity: 1
        });
      }

      // Check for proper imports
      const componentFiles = files.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
      componentFiles.forEach(file => {
        if (file.content.includes('export default') && !file.content.includes('import')) {
          issues.push({
            type: 'warning',
            category: 'structure',
            message: 'Component should have proper imports',
            file: file.path,
            severity: 3
          });
        }
      });
    }

    return {
      valid: issues.filter(i => i.severity === 1).length === 0,
      score: 100,
      issues,
      suggestions: []
    };
  }

  /**
   * Validate modern design patterns
   */
  private static validateDesignQuality(files: CodeFile[]): ValidationResult {
    const issues: ValidationIssue[] = [];
    const cssFiles = files.filter(f => f.path.endsWith('.css') || f.content.includes('style'));

    if (cssFiles.length === 0) {
      issues.push({
        type: 'error',
        category: 'design',
        message: 'No CSS files found for styling',
        severity: 1
      });
      return { valid: false, score: 0, issues, suggestions: [] };
    }

    cssFiles.forEach(file => {
      const content = file.content.toLowerCase();

      // Check for modern layout methods
      const hasModernLayout = content.includes('grid') || 
                             content.includes('flexbox') || 
                             content.includes('flex');
      
      if (!hasModernLayout) {
        issues.push({
          type: 'error',
          category: 'design',
          message: 'Missing modern layout methods (CSS Grid or Flexbox)',
          file: file.path,
          severity: 1
        });
      }

      // Check for transitions and animations
      const hasAnimations = content.includes('transition') ||
                           content.includes('animation') ||
                           content.includes('@keyframes') ||
                           content.includes('transform');

      if (!hasAnimations) {
        issues.push({
          type: 'warning',
          category: 'design',
          message: 'Missing smooth transitions and animations',
          file: file.path,
          severity: 2
        });
      }

      // Check for modern colors and gradients
      const hasModernColors = content.includes('gradient') ||
                             content.includes('rgba') ||
                             content.includes('hsla') ||
                             content.includes('var(--') ||
                             content.includes('hsl(');

      if (!hasModernColors) {
        issues.push({
          type: 'warning',
          category: 'design',
          message: 'Missing modern color schemes or gradients',
          file: file.path,
          severity: 2
        });
      }

      // Check for hover effects
      const hasHoverEffects = content.includes(':hover') ||
                             content.includes('hover:');

      if (!hasHoverEffects) {
        issues.push({
          type: 'warning',
          category: 'design',
          message: 'Missing hover effects for interactive elements',
          file: file.path,
          severity: 2
        });
      }

      // Check for responsive design
      const hasResponsive = content.includes('@media') ||
                           content.includes('sm:') ||
                           content.includes('md:') ||
                           content.includes('lg:') ||
                           content.includes('clamp(');

      if (!hasResponsive) {
        issues.push({
          type: 'error',
          category: 'design',
          message: 'Missing responsive design patterns',
          file: file.path,
          severity: 1
        });
      }

      // Check for old/outdated patterns
      const hasOutdatedPatterns = content.includes('table') && content.includes('layout') ||
                                 content.includes('float:') ||
                                 content.includes('position: absolute') && content.includes('top: 50%');

      if (hasOutdatedPatterns) {
        issues.push({
          type: 'warning',
          category: 'design',
          message: 'Contains outdated CSS layout patterns',
          file: file.path,
          severity: 2
        });
      }
    });

    return {
      valid: issues.filter(i => i.severity === 1).length === 0,
      score: 100,
      issues,
      suggestions: []
    };
  }

  /**
   * Validate modern patterns and best practices
   */
  private static validateModernPatterns(files: CodeFile[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check for semantic HTML
    const htmlFiles = files.filter(f => f.path.endsWith('.html') || f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
    
    htmlFiles.forEach(file => {
      const content = file.content.toLowerCase();

      // Check for semantic HTML elements
      const hasSemanticElements = content.includes('<header>') ||
                                 content.includes('<nav>') ||
                                 content.includes('<main>') ||
                                 content.includes('<section>') ||
                                 content.includes('<footer>');

      if (!hasSemanticElements && file.path.endsWith('.html')) {
        issues.push({
          type: 'warning',
          category: 'modern',
          message: 'Missing semantic HTML elements (header, nav, main, section, footer)',
          file: file.path,
          severity: 2
        });
      }

      // Check for modern font loading
      if (file.path.endsWith('.css') && content.includes('@font-face') && !content.includes('font-display')) {
        issues.push({
          type: 'info',
          category: 'modern',
          message: 'Consider adding font-display: swap for better performance',
          file: file.path,
          severity: 3
        });
      }
    });

    // Check React-specific modern patterns
    const reactFiles = files.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
    
    reactFiles.forEach(file => {
      const content = file.content;

      // Check for functional components
      const hasClassComponents = content.includes('class ') && content.includes('extends Component');
      if (hasClassComponents) {
        issues.push({
          type: 'warning',
          category: 'modern',
          message: 'Consider using functional components instead of class components',
          file: file.path,
          severity: 2
        });
      }

      // Check for proper TypeScript typing
      if (file.path.endsWith('.tsx') && !content.includes('interface') && !content.includes('type') && content.includes('props')) {
        issues.push({
          type: 'info',
          category: 'modern',
          message: 'Consider adding TypeScript interfaces for props',
          file: file.path,
          severity: 3
        });
      }

      // Check for hardcoded values
      const hasHardcodedColors = content.match(/#[0-9a-fA-F]{3,6}/) ||
                                content.match(/rgb\(/) ||
                                content.match(/rgba\([^)]*255[^)]*\)/) ||
                                content.includes('color: black') ||
                                content.includes('color: white');

      if (hasHardcodedColors) {
        issues.push({
          type: 'warning',
          category: 'modern',
          message: 'Avoid hardcoded colors. Use design tokens instead.',
          file: file.path,
          severity: 2
        });
      }
    });

    return {
      valid: issues.filter(i => i.severity === 1).length === 0,
      score: 100,
      issues,
      suggestions: []
    };
  }

  /**
   * Validate accessibility patterns
   */
  private static validateAccessibility(files: CodeFile[]): ValidationResult {
    const issues: ValidationIssue[] = [];

    const htmlFiles = files.filter(f => f.path.endsWith('.html') || f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));

    htmlFiles.forEach(file => {
      const content = file.content.toLowerCase();

      // Check for alt attributes on images
      if (content.includes('<img') && !content.includes('alt=')) {
        issues.push({
          type: 'warning',
          category: 'accessibility',
          message: 'Images should have alt attributes for accessibility',
          file: file.path,
          severity: 2
        });
      }

      // Check for button accessibility
      if (content.includes('onclick') && !content.includes('onkeypress')) {
        issues.push({
          type: 'info',
          category: 'accessibility',
          message: 'Interactive elements should support keyboard navigation',
          file: file.path,
          severity: 3
        });
      }

      // Check for form labels
      if (content.includes('<input') && !content.includes('label') && !content.includes('aria-label')) {
        issues.push({
          type: 'warning',
          category: 'accessibility',
          message: 'Form inputs should have associated labels',
          file: file.path,
          severity: 2
        });
      }

      // Check for heading hierarchy
      if (content.includes('<h1>') && content.includes('<h3>') && !content.includes('<h2>')) {
        issues.push({
          type: 'warning',
          category: 'accessibility',
          message: 'Heading hierarchy should be logical (h1 → h2 → h3)',
          file: file.path,
          severity: 2
        });
      }
    });

    return {
      valid: issues.filter(i => i.severity === 1).length === 0,
      score: 100,
      issues,
      suggestions: []
    };
  }

  /**
   * Generate actionable suggestions based on validation issues
   */
  private static generateSuggestions(issues: ValidationIssue[], codeType: string): string[] {
    const suggestions: string[] = [];

    const errorIssues = issues.filter(i => i.severity === 1);
    const designIssues = issues.filter(i => i.category === 'design');
    const modernIssues = issues.filter(i => i.category === 'modern');
    const architectureIssues = issues.filter(i => i.category === 'architecture');

    if (errorIssues.length > 0) {
      suggestions.push('CRITICAL: Fix structural issues before proceeding');
    }

    if (architectureIssues.length > 0) {
      suggestions.push('Refactor component architecture: use proper folder structure (layout/, sections/, ui/)');
      
      if (architectureIssues.some(i => i.message.includes('exceeds'))) {
        suggestions.push('Break down large components into smaller, focused components');
      }
      
      if (architectureIssues.some(i => i.message.includes('TypeScript'))) {
        suggestions.push('Add proper TypeScript interfaces for all component props');
      }
    }

    if (designIssues.length > 0) {
      suggestions.push('Add modern design patterns: CSS Grid/Flexbox, gradients, animations');
    }

    if (modernIssues.length > 0) {
      suggestions.push('Update to modern development practices and remove outdated patterns');
    }

    if (codeType === 'react' && !issues.some(i => i.message.includes('design-tokens'))) {
      suggestions.push('Implement comprehensive design token system');
    }

    if (issues.some(i => i.category === 'accessibility')) {
      suggestions.push('Improve accessibility with proper ARIA labels and semantic HTML');
    }

    return suggestions;
  }
}
