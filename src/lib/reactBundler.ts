import * as Babel from '@babel/standalone';

export interface BundleResult {
  html: string;
  error?: string;
}

export function bundleReactApp(files: Array<{ path: string; content: string }>): BundleResult {
  try {
    // Find entry point (main.tsx or index.tsx or App.tsx)
    const entryFile = files.find(f => 
      f.path.includes('main.tsx') || 
      f.path.includes('index.tsx') || 
      f.path.includes('App.tsx')
    );

    if (!entryFile) {
      return { html: '', error: 'No entry point found (main.tsx, index.tsx, or App.tsx)' };
    }

    // Transpile all TSX/JSX/TS files to JS
    const transpiledFiles = files.map(file => {
      if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx') || file.path.endsWith('.ts')) {
        try {
          const result = Babel.transform(file.content, {
            presets: ['react', 'typescript'],
            filename: file.path,
          });
          return { ...file, transpiledCode: result.code || '' };
        } catch (err: any) {
          console.error(`Transpile error in ${file.path}:`, err);
          return { ...file, transpiledCode: `console.error("Transpile error in ${file.path}: ${err.message}")` };
        }
      }
      return { ...file, transpiledCode: file.content };
    });

    // Build module system
    const moduleMap = buildModuleMap(transpiledFiles);

    // Extract CSS files
    const cssContent = files
      .filter(f => f.path.endsWith('.css'))
      .map(f => f.content)
      .join('\n');

    // Generate HTML with inline scripts and styles
    const html = generatePreviewHTML(moduleMap, cssContent, entryFile.path);

    return { html };
  } catch (err: any) {
    return { html: '', error: err.message };
  }
}

function buildModuleMap(files: Array<{ path: string; transpiledCode: string }>) {
  const modules: Record<string, string> = {};
  
  files.forEach(file => {
    // Normalize path for module resolution
    let modulePath = file.path;
    if (modulePath.startsWith('src/')) {
      modulePath = '/' + modulePath;
    }
    if (!modulePath.startsWith('/')) {
      modulePath = '/' + modulePath;
    }
    
    modules[modulePath] = file.transpiledCode;
  });
  
  return modules;
}

function generatePreviewHTML(modules: Record<string, string>, css: string, entryPath: string): string {
  // Normalize entry path
  let normalizedEntry = entryPath;
  if (!normalizedEntry.startsWith('/')) {
    normalizedEntry = '/' + normalizedEntry;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${css}
  </style>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script>
    // Simple module system
    const modules = ${JSON.stringify(modules)};
    const moduleCache = {};
    
    function require(path) {
      // Normalize path
      if (!path.startsWith('/') && !path.startsWith('.')) {
        path = '/' + path;
      }
      
      // Handle relative imports
      if (path.startsWith('.')) {
        // Convert to absolute (simplified)
        path = '/' + path.replace(/^\.\//, 'src/').replace(/^\.\.\//g, '');
      }
      
      // Remove /src/src duplication
      path = path.replace('/src/src/', '/src/');
      
      // Check cache
      if (moduleCache[path]) {
        return moduleCache[path].exports;
      }
      
      // Check if module exists
      if (!modules[path]) {
        // Try with extensions
        const withExtensions = [
          path,
          path + '.tsx', 
          path + '.ts', 
          path + '.jsx', 
          path + '.js',
          path + '/index.tsx',
          path + '/index.ts',
          path + '/index.jsx',
          path + '/index.js'
        ];
        
        for (const p of withExtensions) {
          if (modules[p]) {
            path = p;
            break;
          }
        }
      }
      
      const code = modules[path];
      if (!code) {
        console.error('Module not found:', path, 'Available:', Object.keys(modules));
        return {};
      }
      
      // Create module
      const module = { exports: {} };
      moduleCache[path] = module;
      
      // Execute module code
      try {
        const func = new Function('require', 'module', 'exports', 'React', 'ReactDOM', code);
        func(require, module, module.exports, window.React, window.ReactDOM);
      } catch (err) {
        console.error('Error executing module', path, err);
      }
      
      return module.exports;
    }
    
    // Load entry point
    try {
      require('${normalizedEntry}');
    } catch (err) {
      console.error('Error loading entry:', err);
      document.body.innerHTML = '<div style="color: #ef4444; padding: 20px; font-family: monospace;"><strong>Preview Error:</strong><br/>' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
}
