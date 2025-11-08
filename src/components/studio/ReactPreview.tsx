import { useMemo } from "react";
import { Sandpack } from "@codesandbox/sandpack-react";
import { CodeFile } from "@/pages/ModuleStudio";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ReactPreviewProps {
  files: CodeFile[];
  deviceMode?: 'mobile' | 'tablet' | 'desktop';
}

export const ReactPreview = ({ files, deviceMode = 'desktop' }: ReactPreviewProps) => {
  // Transform files to Sandpack format
  const sandpackFiles = useMemo(() => {
    const filesObj: Record<string, { code: string }> = {};
    
    files.forEach(file => {
      // Map file paths to Sandpack expected paths
      let sandpackPath = file.path;
      
      // Ensure paths start with /
      if (!sandpackPath.startsWith('/')) {
        sandpackPath = '/' + sandpackPath;
      }
      
      filesObj[sandpackPath] = { code: file.content };
    });
    
    return filesObj;
  }, [files]);

  // Detect dependencies from package.json if present
  const dependencies = useMemo(() => {
    const packageJsonFile = files.find(f => 
      f.path === 'package.json' || f.path === '/package.json'
    );
    
    if (packageJsonFile) {
      try {
        const packageJson = JSON.parse(packageJsonFile.content);
        return packageJson.dependencies || {};
      } catch (e) {
        console.error('Failed to parse package.json:', e);
      }
    }
    
    // Default dependencies for React apps
    return {
      "react": "^18.2.0",
      "react-dom": "^18.2.0"
    };
  }, [files]);

  // Detect entry point
  const entryPoint = useMemo(() => {
    const possibleEntries = [
      '/src/index.tsx',
      '/src/index.jsx',
      '/src/main.tsx',
      '/src/main.jsx',
      '/index.tsx',
      '/index.jsx'
    ];
    
    for (const entry of possibleEntries) {
      if (sandpackFiles[entry]) {
        return entry;
      }
    }
    
    // If no standard entry found, use first tsx/jsx file
    const firstReactFile = Object.keys(sandpackFiles).find(path => 
      path.endsWith('.tsx') || path.endsWith('.jsx')
    );
    
    return firstReactFile || '/src/App.tsx';
  }, [sandpackFiles]);

  // Get device dimensions
  const getDeviceDimensions = () => {
    switch (deviceMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getDeviceDimensions();

  // Check if we have valid files
  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">No Files Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Generate some code to see a preview.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center bg-muted/30">
      <div 
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        className="transition-all duration-300"
      >
        <Sandpack
          template="react-ts"
          files={sandpackFiles}
          customSetup={{
            dependencies,
            entry: entryPoint
          }}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: true,
            showInlineErrors: true,
            wrapContent: true,
            editorHeight: "100%",
            editorWidthPercentage: 0, // Hide editor, only show preview
            autorun: true,
            autoReload: true,
          }}
          theme="dark"
        />
      </div>
    </div>
  );
};
