import type { SandpackFiles } from "@codesandbox/sandpack-react";

export interface GenFile {
  path: string;
  content: string;
}

export type SandpackTemplate = "react-ts" | "static" | "vanilla-ts" | "vanilla";

export interface PreviewAdapterResult {
  template: SandpackTemplate;
  files: SandpackFiles;
  dependencies: Record<string, string>;
  entry: string;
}

/**
 * Detect if the project is a React project based on file patterns
 */
function isReactProject(files: GenFile[]): boolean {
  // Check for React entry files
  const hasReactEntry = files.some(f => 
    f.path.match(/src\/(main|index)\.(tsx?|jsx?)$/) ||
    f.path.match(/^(main|index)\.(tsx?|jsx?)$/)
  );

  // Check for package.json with React
  const packageJson = files.find(f => f.path === 'package.json');
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson.content);
      const hasReact = pkg.dependencies?.react || pkg.devDependencies?.react;
      if (hasReact) return true;
    } catch {}
  }

  // Check for React imports in any file
  const hasReactImport = files.some(f => 
    f.content.includes('from "react"') ||
    f.content.includes('from \'react\'') ||
    f.content.includes('import React')
  );

  return hasReactEntry || hasReactImport;
}

/**
 * Detect if the project uses TypeScript
 */
function usesTypeScript(files: GenFile[]): boolean {
  return files.some(f => 
    f.path.endsWith('.ts') || 
    f.path.endsWith('.tsx') ||
    f.path === 'tsconfig.json'
  );
}

/**
 * Sanitize dependencies to ensure all values are valid strings
 */
function sanitizeDependencies(raw: any): Record<string, string> {
  const result: Record<string, string> = {};

  if (raw && typeof raw === "object") {
    for (const [name, version] of Object.entries(raw)) {
      if (typeof version === "string" && version.trim().length > 0) {
        result[name] = version.trim();
      }
    }
  }

  return result;
}

/**
 * Extract dependencies from package.json
 */
function extractDependencies(files: GenFile[]): Record<string, string> {
  const packageJson = files.find(f => f.path === 'package.json');
  
  // Default React dependencies
  const defaultReactDeps: Record<string, string> = {
    react: "^18.3.1",
    "react-dom": "^18.3.1"
  };

  if (!packageJson) {
    return defaultReactDeps;
  }

  try {
    const pkg = JSON.parse(packageJson.content);
    const deps = sanitizeDependencies(pkg.dependencies);
    const devDeps = sanitizeDependencies(pkg.devDependencies);
    
    return {
      ...defaultReactDeps,
      ...deps,
      ...devDeps
    };
  } catch (e) {
    console.warn("Invalid package.json in preview adapter:", e);
    return defaultReactDeps;
  }
}

/**
 * Find the entry point file
 */
function findEntry(files: GenFile[], isReact: boolean): string {
  if (!isReact) {
    // For static projects, look for index.html
    const htmlFile = files.find(f => 
      f.path === 'index.html' || 
      f.path.endsWith('/index.html')
    );
    return htmlFile ? `/${htmlFile.path}` : '/index.html';
  }

  // For React projects, look for main entry
  const entryPatterns = [
    /^src\/main\.tsx?$/,
    /^src\/index\.tsx?$/,
    /^main\.tsx?$/,
    /^index\.tsx?$/,
    /^src\/App\.tsx?$/
  ];

  for (const pattern of entryPatterns) {
    const entry = files.find(f => pattern.test(f.path));
    if (entry) {
      return `/${entry.path}`;
    }
  }

  // Fallback to first .tsx or .ts file
  const firstReactFile = files.find(f => 
    f.path.endsWith('.tsx') || f.path.endsWith('.jsx')
  );
  return firstReactFile ? `/${firstReactFile.path}` : '/src/main.tsx';
}

/**
 * Normalize file path to ensure it starts with /
 */
function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Convert Module's generated files to Sandpack format
 */
export function adaptFilesToSandpack(files: GenFile[]): PreviewAdapterResult {
  const isReact = isReactProject(files);
  const isTS = usesTypeScript(files);

  // Determine template - always use react-ts for React projects for consistency
  let template: SandpackTemplate = "react-ts";
  if (!isReact) {
    template = isTS ? "vanilla-ts" : "static";
  }

  // Convert files to Sandpack format
  const sandpackFiles: SandpackFiles = {};
  
  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    sandpackFiles[normalizedPath] = {
      code: file.content
    };
  }

  // For React projects, ensure we have a basic structure
  if (isReact) {
    // Add index.html if missing
    if (!sandpackFiles['/index.html'] && !sandpackFiles['/public/index.html']) {
      sandpackFiles['/index.html'] = {
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`
      };
    }

    // Add package.json if missing
    if (!sandpackFiles['/package.json']) {
      sandpackFiles['/package.json'] = {
        code: JSON.stringify({
          name: "module-preview",
          version: "1.0.0",
          dependencies: extractDependencies(files)
        }, null, 2)
      };
    }
  }

  const dependencies = extractDependencies(files);
  const entry = findEntry(files, isReact);

  // Final safety check - ensure dependencies are valid
  const safeDependencies = sanitizeDependencies(dependencies);
  
  console.debug("Sandpack preview config:", { template, entry, dependencies: safeDependencies });

  return {
    template,
    files: sandpackFiles,
    dependencies: safeDependencies,
    entry
  };
}
