import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewComponent,
  SandpackConsole,
  SandpackLayout,
} from '@codesandbox/sandpack-react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GenFile, adaptFilesToSandpack, FIXED_SANDPACK_DEPS } from './previewAdapter';
import { DeviceMode } from './usePreviewFiles';

interface SandpackPreviewProps {
  files: GenFile[];
  device: DeviceMode;
  isUpdating: boolean;
  reloadKey: number;
}

/**
 * Sandpack-based preview component that renders React/TS projects
 * 
 * ARCHITECTURE:
 * - Always uses fixed Vite + React + TypeScript + Tailwind template
 * - AI files ONLY override src/App.tsx and src/components/*
 * - Dependencies are FIXED (never from AI)
 * - Validation runs BEFORE merging into template
 * - Broken code shows friendly error, never crashes Sandpack
 */
export const SandpackPreview = ({ 
  files, 
  device, 
  isUpdating,
  reloadKey 
}: SandpackPreviewProps) => {
  // Adapt and validate AI files, merge with fixed template
  const sandpackData = useMemo(() => {
    if (files.length === 0) return null;
    
    try {
      // This function:
      // 1. Validates AI-generated files (validateGeneratedFiles)
      // 2. Merges with BASE_TEMPLATE_FILES (buildSandpackFiles)
      // 3. Returns { files, validation } - template and deps are FIXED
      const result = adaptFilesToSandpack(files);
      
      // Validate the result structure
      if (!result.files) {
        console.error('Invalid adapter result: missing files', result);
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('Error adapting files for Sandpack:', error);
      // Store the error for display
      return { error: error instanceof Error ? error.message : 'Failed to prepare preview' };
    }
  }, [files, reloadKey]); // Include reloadKey to force re-adaptation

  // Get device dimensions
  const getDeviceDimensions = () => {
    switch (device) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  const dimensions = getDeviceDimensions();

  // No files state
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="font-semibold">No Files Generated</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ask Module to generate code to see a live preview.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Error adapting files
  if (!sandpackData || 'error' in sandpackData) {
    const errorMessage = 'error' in sandpackData 
      ? sandpackData.error 
      : 'Failed to prepare preview. Check the generated files.';
    
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-2xl p-8 bg-red-500/5 border-red-400/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-300 mb-2">
                Code Generation Failed
              </h3>
              <p className="text-sm text-red-200/90 mb-3">
                {errorMessage}
              </p>
              <div className="mt-4 p-3 bg-red-900/20 border border-red-400/20 rounded">
                <p className="text-xs text-red-300/80">
                  💡 <strong>Suggestions:</strong>
                </p>
                <ul className="text-xs text-red-300/70 mt-2 space-y-1 list-disc list-inside">
                  <li>Try regenerating with a clearer, more specific prompt</li>
                  <li>Break down complex requests into smaller steps</li>
                  <li>Ensure your prompt describes a valid React UI component</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Check for server framework (Next.js, etc.)
  const hasServerFramework = files.some(f => 
    f.path.includes('next.config') || 
    f.path.includes('app/page.tsx') ||
    f.path.includes('pages/api')
  );

  return (
    <div className="h-full w-full flex flex-col">
      {/* Server framework warning */}
      {hasServerFramework && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ This project uses server features. Full server preview isn't supported in browser-only preview yet. Only client-side rendering is shown.
          </p>
        </div>
      )}

      {/* Loading indicator */}
      {isUpdating && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Updating preview...</span>
          </div>
        </div>
      )}

      {/* Preview area */}
      <div className={`flex-1 flex bg-muted/30 ${device === 'desktop' ? '' : 'items-center justify-center p-4'}`}>
        <div
          key={reloadKey} // Force remount on reload
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
          className={`transition-all duration-300 overflow-hidden ${device === 'desktop' ? '' : 'rounded-lg shadow-lg'}`}
        >
          <SandpackProvider
            template="react-ts"
            files={sandpackData.files}
            customSetup={{
              dependencies: FIXED_SANDPACK_DEPS,
            }}
            theme="dark"
          >
            <SandpackLayout>
              <div className="flex flex-col h-full w-full">
                {/* Preview */}
                <div className="flex-1 bg-white">
                  <SandpackPreviewComponent
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    style={{ height: '100%' }}
                  />
                </div>
                
                {/* Console */}
                <div className="h-32 border-t border-border bg-background">
                  <SandpackConsole
                    showHeader={false}
                    showSyntaxError
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </div>
    </div>
  );
};
