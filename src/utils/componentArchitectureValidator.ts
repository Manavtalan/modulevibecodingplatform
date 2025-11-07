// File: src/utils/componentArchitectureValidator.ts

export interface ComponentFile {
  path: string;
  content: string;
  lineCount: number;
}

export interface ArchitectureValidation {
  valid: boolean;
  score: number;
  issues: ArchitectureIssue[];
  suggestions: string[];
}

export interface ArchitectureIssue {
  type: 'error' | 'warning' | 'info';
  category: 'structure' | 'size' | 'patterns' | 'typescript';
  message: string;
  file?: string;
  severity: 1 | 2 | 3;
}

export class ComponentArchitectureValidator {

  static validateReactArchitecture(files: ComponentFile[]): ArchitectureValidation {
    const issues: ArchitectureIssue[] = [];
    let score = 100;

    // Validate folder structure
    const structureValidation = this.validateFolderStructure(files);
    issues.push(...structureValidation.issues);

    // Validate component sizes
    const sizeValidation = this.validateComponentSizes(files);
    issues.push(...sizeValidation.issues);

    // Validate component patterns
    const patternValidation = this.validateComponentPatterns(files);
    issues.push(...patternValidation.issues);

    // Validate TypeScript usage
    const typescriptValidation = this.validateTypeScriptUsage(files);
    issues.push(...typescriptValidation.issues);

    // Calculate score
    issues.forEach(issue => {
      switch (issue.severity) {
        case 1: score -= 12; break;
        case 2: score -= 6; break;
        case 3: score -= 2; break;
      }
    });

    score = Math.max(0, score);

    return {
      valid: score >= 85 && !issues.some(i => i.severity === 1),
      score,
      issues,
      suggestions: this.generateArchitectureSuggestions(issues)
    };
  }

  private static validateFolderStructure(files: ComponentFile[]): ArchitectureValidation {
    const issues: ArchitectureIssue[] = [];

    // Required folder structure
    const requiredStructure = {
      'src/App.tsx': false,
      'src/components/layout/': false,
      'src/components/sections/': false, 
      'src/components/ui/': false,
      'src/styles/design-tokens.css': false,
      'src/styles/globals.css': false,
      'src/types/index.ts': false
    };

    // Check for required files/folders
    files.forEach(file => {
      if (file.path === 'src/App.tsx') requiredStructure['src/App.tsx'] = true;
      if (file.path.includes('components/layout/')) requiredStructure['src/components/layout/'] = true;
      if (file.path.includes('components/sections/')) requiredStructure['src/components/sections/'] = true;
      if (file.path.includes('components/ui/')) requiredStructure['src/components/ui/'] = true;
      if (file.path.includes('design-tokens.css')) requiredStructure['src/styles/design-tokens.css'] = true;
      if (file.path.includes('globals.css')) requiredStructure['src/styles/globals.css'] = true;
      if (file.path.includes('types/') && file.path.endsWith('.ts')) requiredStructure['src/types/index.ts'] = true;
    });

    // Report missing structure
    Object.entries(requiredStructure).forEach(([path, exists]) => {
      if (!exists) {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `Missing required file/folder: ${path}`,
          severity: 1
        });
      }
    });

    // Check for required component types
    const requiredComponents = {
      'Navbar': files.some(f => f.path.includes('Navbar.tsx')),
      'Footer': files.some(f => f.path.includes('Footer.tsx')),
      'Hero': files.some(f => f.path.includes('Hero.tsx')),
      'Features': files.some(f => f.path.includes('Features.tsx')),
      'Button': files.some(f => f.path.includes('Button.tsx')),
      'Card': files.some(f => f.path.includes('Card.tsx'))
    };

    Object.entries(requiredComponents).forEach(([component, exists]) => {
      if (!exists) {
        issues.push({
          type: 'error',
          category: 'structure',
          message: `Missing required component: ${component}`,
          severity: 1
        });
      }
    });

    // Check for flat component structure (anti-pattern)
    const flatComponents = files.filter(f => 
      f.path.startsWith('src/components/') && 
      !f.path.includes('/layout/') && 
      !f.path.includes('/sections/') && 
      !f.path.includes('/ui/') &&
      f.path.endsWith('.tsx')
    );

    if (flatComponents.length > 0) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: `Found ${flatComponents.length} components in flat structure. Use layout/, sections/, ui/ folders.`,
        severity: 2
      });
    }

    return { valid: true, score: 100, issues, suggestions: [] };
  }

  private static validateComponentSizes(files: ComponentFile[]): ArchitectureValidation {
    const issues: ArchitectureIssue[] = [];

    files.forEach(file => {
      if (!file.path.endsWith('.tsx')) return;

      let maxLines = 200; // Default max
      
      // Set specific limits based on component type
      if (file.path.includes('App.tsx')) maxLines = 50;
      else if (file.path.includes('components/ui/')) maxLines = 100;
      else if (file.path.includes('components/layout/')) maxLines = 150;
      else if (file.path.includes('components/sections/')) maxLines = 200;

      if (file.lineCount > maxLines) {
        issues.push({
          type: 'warning',
          category: 'size',
          message: `Component exceeds ${maxLines} lines (${file.lineCount} lines). Consider breaking into smaller components.`,
          file: file.path,
          severity: file.lineCount > maxLines + 50 ? 1 : 2
        });
      }

      // Check for very small components (might be incomplete)
      if (file.lineCount < 10 && file.path.includes('components/')) {
        issues.push({
          type: 'info',
          category: 'size',
          message: `Component seems very small (${file.lineCount} lines). Ensure it's complete.`,
          file: file.path,
          severity: 3
        });
      }
    });

    return { valid: true, score: 100, issues, suggestions: [] };
  }

  private static validateComponentPatterns(files: ComponentFile[]): ArchitectureValidation {
    const issues: ArchitectureIssue[] = [];

    files.forEach(file => {
      if (!file.path.endsWith('.tsx')) return;

      const content = file.content;

      // Check for functional components (modern pattern)
      if (content.includes('class ') && content.includes('extends Component')) {
        issues.push({
          type: 'warning',
          category: 'patterns',
          message: 'Use functional components instead of class components',
          file: file.path,
          severity: 2
        });
      }

      // Check for proper exports
      if (!content.includes('export default') && !content.includes('export {')) {
        issues.push({
          type: 'error',
          category: 'patterns',
          message: 'Component must have proper export statement',
          file: file.path,
          severity: 1
        });
      }

      // Check for design token usage
      if (content.includes('className') && !content.includes('var(--') && !content.includes('bg-[var(')) {
        issues.push({
          type: 'warning',
          category: 'patterns',
          message: 'Component should use design tokens instead of hardcoded values',
          file: file.path,
          severity: 2
        });
      }

      // Check for hardcoded colors/styles
      if (content.match(/#[0-9a-fA-F]{3,6}/) || content.match(/rgb\(/) || content.match(/rgba\(/)) {
        issues.push({
          type: 'warning',
          category: 'patterns',
          message: 'Avoid hardcoded colors. Use design tokens.',
          file: file.path,
          severity: 2
        });
      }

      // Check for proper imports
      if (content.includes('React.') && !content.includes("import React")) {
        issues.push({
          type: 'error',
          category: 'patterns',
          message: 'Missing React import',
          file: file.path,
          severity: 1
        });
      }

      // Check App.tsx specific patterns
      if (file.path.includes('App.tsx')) {
        if (content.includes('useState') || content.includes('useEffect')) {
          issues.push({
            type: 'warning',
            category: 'patterns',
            message: 'App.tsx should only compose components, not contain business logic',
            file: file.path,
            severity: 2
          });
        }
      }

      // Check UI components for variants
      if (file.path.includes('components/ui/') && file.path.includes('Button.tsx')) {
        if (!content.includes('variant') && !content.includes('size')) {
          issues.push({
            type: 'warning',
            category: 'patterns',
            message: 'Button component should support variant and size props',
            file: file.path,
            severity: 2
          });
        }
      }
    });

    return { valid: true, score: 100, issues, suggestions: [] };
  }

  private static validateTypeScriptUsage(files: ComponentFile[]): ArchitectureValidation {
    const issues: ArchitectureIssue[] = [];

    // Check for types file
    const hasTypesFile = files.some(f => f.path.includes('types/') && f.path.endsWith('.ts'));
    if (!hasTypesFile) {
      issues.push({
        type: 'error',
        category: 'typescript',
        message: 'Missing types file (src/types/index.ts)',
        severity: 1
      });
    }

    files.forEach(file => {
      if (!file.path.endsWith('.tsx')) return;

      const content = file.content;

      // Check for component prop interfaces
      if (content.includes('props') && !content.includes('interface') && !content.includes('type ')) {
        issues.push({
          type: 'warning',
          category: 'typescript',
          message: 'Component props should have TypeScript interface definitions',
          file: file.path,
          severity: 2
        });
      }

      // Check for any usage without proper typing
      if (content.includes(': any')) {
        issues.push({
          type: 'info',
          category: 'typescript',
          message: 'Avoid using "any" type. Use specific types instead.',
          file: file.path,
          severity: 3
        });
      }

      // Check for proper function component typing
      if (content.includes('function ') && !content.includes(': React.FC') && !content.includes('React.ReactNode')) {
        issues.push({
          type: 'info',
          category: 'typescript',
          message: 'Consider using explicit function component typing',
          file: file.path,
          severity: 3
        });
      }
    });

    return { valid: true, score: 100, issues, suggestions: [] };
  }

  private static generateArchitectureSuggestions(issues: ArchitectureIssue[]): string[] {
    const suggestions: string[] = [];

    const structureIssues = issues.filter(i => i.category === 'structure');
    const sizeIssues = issues.filter(i => i.category === 'size');
    const patternIssues = issues.filter(i => i.category === 'patterns');
    const typescriptIssues = issues.filter(i => i.category === 'typescript');

    if (structureIssues.length > 0) {
      suggestions.push('Fix component organization: use layout/, sections/, ui/ folder structure');
    }

    if (sizeIssues.length > 0) {
      suggestions.push('Break down large components into smaller, focused components');
    }

    if (patternIssues.length > 0) {
      suggestions.push('Update to modern React patterns: functional components, design tokens');
    }

    if (typescriptIssues.length > 0) {
      suggestions.push('Add proper TypeScript interfaces for component props');
    }

    if (issues.some(i => i.message.includes('hardcoded'))) {
      suggestions.push('Replace all hardcoded values with design tokens');
    }

    return suggestions;
  }
}
