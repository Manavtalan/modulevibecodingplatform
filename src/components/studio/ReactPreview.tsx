import { useMemo, useState, useEffect } from "react";
import { CodeFile } from "@/pages/ModuleStudio";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { bundleReactApp } from "@/lib/reactBundler";

interface ReactPreviewProps {
  files: CodeFile[];
  deviceMode?: 'mobile' | 'tablet' | 'desktop';
}

export const ReactPreview = ({ files, deviceMode = 'desktop' }: ReactPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Bundle the React app
  const bundleResult = useMemo(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = bundleReactApp(files);
      
      if (result.error) {
        setError(result.error);
        return null;
      }
      
      return result.html;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [files]);

  // Handle loading state
  useEffect(() => {
    if (bundleResult || error) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [bundleResult, error]);

  // Force iframe reload when files change
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [files]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Building preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !bundleResult) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="font-semibold">Preview Error</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error || 'Failed to generate preview'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // No files state
  if (files.length === 0) {
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
    <div className="h-full w-full flex items-center justify-center bg-muted/30 p-4">
      <div 
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
        className="transition-all duration-300 rounded-lg overflow-hidden shadow-lg"
      >
        <iframe
          key={previewKey}
          srcDoc={bundleResult}
          className="w-full h-full border-0 bg-white"
          title="React Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );
};
