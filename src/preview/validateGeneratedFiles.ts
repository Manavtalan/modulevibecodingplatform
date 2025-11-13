/**
 * Code quality validation for AI-generated files
 * Runs before files are merged into the preview template
 */

export interface ValidationResult {
  ok: boolean;
  error?: string;
  details?: string;
}

/**
 * Validate AI-generated files before preview rendering
 * Prevents broken code from crashing Sandpack
 */
export function validateGeneratedFiles(files: Record<string, string>): ValidationResult {
  console.log('[validation] Checking generated files...', Object.keys(files));

  // 1. Must have src/App.tsx (required entry point)
  if (!files["src/App.tsx"] && !files["/src/App.tsx"]) {
    return {
      ok: false,
      error: "Missing required file: src/App.tsx",
      details: "The AI must generate at least an App.tsx file for the preview to work."
    };
  }

  // 2. At least one file must exist
  if (Object.keys(files).length === 0) {
    return {
      ok: false,
      error: "No files were generated",
      details: "The AI did not return any code files."
    };
  }

  // Validate each file
  for (const [path, content] of Object.entries(files)) {
    // 3. Content must be a string
    if (typeof content !== "string") {
      return {
        ok: false,
        error: `Invalid file content type in ${path}`,
        details: `Expected string, got ${typeof content}`
      };
    }

    // 4. Content must not be empty
    if (content.trim().length === 0) {
      return {
        ok: false,
        error: `Empty file: ${path}`,
        details: "Generated files must contain code."
      };
    }

    // 5. No undefined/null placeholders (common AI mistake)
    if (content.includes("undefined") || content.match(/\bnull\b/)) {
      // Allow "null" in comments or strings, but be suspicious
      const suspiciousPatterns = [
        /= undefined/,
        /: undefined/,
        /\(undefined\)/,
        /return undefined/,
        /= null(?![a-zA-Z])/,
        /: null(?![a-zA-Z])/,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          return {
            ok: false,
            error: `Suspicious placeholder detected in ${path}`,
            details: "The AI generated code with undefined or null values. This usually indicates incomplete generation."
          };
        }
      }
    }

    // 6. No markdown code fences (AI forgot to extract code)
    if (content.includes("```tsx") || content.includes("```typescript") || content.includes("```jsx")) {
      return {
        ok: false,
        error: `Markdown code fences found in ${path}`,
        details: "The AI returned code wrapped in markdown. This indicates a formatting error."
      };
    }

    // 7. File size limits (prevent extreme outputs)
    if (content.length > 200000) {
      return {
        ok: false,
        error: `File too large: ${path}`,
        details: `File is ${content.length} characters (max: 200,000). This may indicate runaway generation.`
      };
    }

    // 8. For .tsx/.jsx files: rough JSX balance check
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) {
      // Check for basic React syntax
      if (!content.includes('import') && !content.includes('export')) {
        return {
          ok: false,
          error: `Missing import/export statements in ${path}`,
          details: "React components must have import and export statements."
        };
      }

      // Rough div balance check (allows some tolerance for fragments, etc.)
      const openDivs = (content.match(/<div\b/g) || []).length;
      const closeDivs = (content.match(/<\/div>/g) || []).length;
      
      if (closeDivs > openDivs) {
        return {
          ok: false,
          error: `Too many closing </div> tags in ${path}`,
          details: `Found ${closeDivs} closing tags but only ${openDivs} opening tags.`
        };
      }
      
      if (Math.abs(openDivs - closeDivs) > 20) {
        return {
          ok: false,
          error: `Likely unbalanced <div> tags in ${path}`,
          details: `Opening tags: ${openDivs}, closing tags: ${closeDivs}. Difference is too large.`
        };
      }

      // Check for unclosed JSX elements (basic heuristic)
      const openBrackets = (content.match(/<[A-Z][a-zA-Z0-9]*\b/g) || []).length;
      const closeBrackets = (content.match(/<\/[A-Z][a-zA-Z0-9]*>/g) || []).length;
      const selfClosing = (content.match(/\/>/g) || []).length;
      
      const expectedClosing = openBrackets - selfClosing;
      if (closeBrackets < expectedClosing - 10) {
        return {
          ok: false,
          error: `Likely unclosed JSX elements in ${path}`,
          details: "Some React components may not be properly closed."
        };
      }
    }

    // 9. Check for invalid imports (forbidden libraries)
    const forbiddenImports = [
      'lucide-react',
      'framer-motion',
      '@radix-ui',
      '@/components/ui',
      'clsx',
      'tailwind-merge',
      'shadcn',
    ];

    for (const forbidden of forbiddenImports) {
      if (content.includes(`from "${forbidden}"`) || content.includes(`from '${forbidden}'`)) {
        return {
          ok: false,
          error: `Forbidden import detected in ${path}`,
          details: `Cannot import from "${forbidden}". Only "react" and relative imports are allowed.`
        };
      }
    }

    // 10. Check for empty imports
    if (content.includes('from ""') || content.includes("from ''") || content.includes('from null')) {
      return {
        ok: false,
        error: `Invalid empty import in ${path}`,
        details: "Found an import statement with an empty or null source."
      };
    }

    // 11. Check for basic TypeScript syntax errors
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      // Very basic check: balanced curly braces
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      
      if (Math.abs(openBraces - closeBraces) > 5) {
        return {
          ok: false,
          error: `Likely unbalanced braces in ${path}`,
          details: `Opening braces: ${openBraces}, closing braces: ${closeBraces}.`
        };
      }
    }
  }

  console.log('[validation] ✅ All files passed validation');
  return { ok: true };
}

/**
 * Quick validation for single file
 */
export function validateSingleFile(path: string, content: string): ValidationResult {
  return validateGeneratedFiles({ [path]: content });
}
