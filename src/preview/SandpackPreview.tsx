import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview as SandpackPreviewComponent,
  SandpackConsole,
  SandpackLayout,
} from '@codesandbox/sandpack-react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GenFile, adaptFilesToSandpack } from './previewAdapter';
import { DeviceMode } from './usePreviewFiles';

interface SandpackPreviewProps {
  files: GenFile[];
  device: DeviceMode;
  isUpdating: boolean;
  reloadKey: number;
}

/**
 * Sandpack-based preview component that renders React/TS and static projects
 */
export const SandpackPreview = ({ 
  files, 
  device, 
  isUpdating,
  reloadKey 
}: SandpackPreviewProps) => {
  // Adapt files to Sandpack format
  const sandpackData = useMemo(() => {
    if (files.length === 0) return null;
    
    try {
      return adaptFilesToSandpack(files);
    } catch (error) {
      console.error('Error adapting files:', error);
      return null;
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
  if (!sandpackData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="font-semibold">Preview Error</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Failed to prepare preview. Check the generated files.
              </p>
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
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
        <div
          key={reloadKey} // Force remount on reload
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
          className="transition-all duration-300 rounded-lg overflow-hidden shadow-lg"
        >
          <SandpackProvider
            template={sandpackData.template}
            files={sandpackData.files}
            customSetup={{
              dependencies: sandpackData.dependencies,
              entry: sandpackData.entry,
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
