import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Download, Smartphone, Tablet, Monitor, AlertCircle, RefreshCw, FileText, ExternalLink } from "lucide-react";
import { CodeFile } from "@/pages/ModuleStudio";
import { FilePlan } from "@/components/GenerationProgress";
import { DiagnosticInfo } from "@/hooks/useCodeGeneration";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FileExplorer from "@/components/FileExplorer";
import { SandpackPreview } from "@/preview/SandpackPreview";
import { usePreviewFiles } from "@/preview/usePreviewFiles";
import { getCurrentProject } from "@/stores/projectStore";

interface PreviewPanelProps {
  files: CodeFile[];
  activeTab: 'preview' | 'code';
  onTabChange: (tab: 'preview' | 'code') => void;
  isGenerating: boolean;
  generationPhase: string;
  currentFile: string | null;
  filePlan: FilePlan[];
  diagnosticInfo?: DiagnosticInfo | null;
  rawOutputAvailable?: boolean;
  onRegenerate?: () => void;
  onFileOpen?: (path: string) => void;
}

export const PreviewPanel = ({
  files,
  activeTab,
  onTabChange,
  isGenerating,
  generationPhase,
  currentFile,
  filePlan,
  diagnosticInfo,
  rawOutputAvailable,
  onRegenerate,
  onFileOpen
}: PreviewPanelProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Get current project ID
  const project = getCurrentProject();
  const projectId = project?.id || 'default';
  
  // Use the preview files hook for debouncing and device management
  const { 
    debouncedFiles, 
    device, 
    setDevice, 
    isUpdating, 
    forceReload,
    reloadKey 
  } = usePreviewFiles(projectId, files);

  // Auto-select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      const firstFile = files[0].path;
      setSelectedFile(firstFile);
      onFileOpen?.(firstFile);
    }
  }, [files, selectedFile, onFileOpen]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied to clipboard!" });
  };

  const handleDownloadProject = () => {
    // Create a simple download of all files as text
    const allCode = files.map(f => `// ${f.path}\n${f.content}`).join("\n\n");
    const blob = new Blob([allCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "module-project.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Project downloaded!" });
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) return 'jsx';
    if (filename.endsWith('.ts')) return 'typescript';
    return 'text';
  };

  const handleOpenInNewTab = () => {
    // Create a standalone HTML file with all the code
    const appFile = files.find(f => f.path === 'src/App.tsx');
    const componentFiles = files.filter(f => f.path.startsWith('src/components/'));
    
    if (!appFile) {
      toast({ title: "No app file found", variant: "destructive" });
      return;
    }

    // Build the standalone HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Module Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #root { width: 100%; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;
    
    ${componentFiles.map(f => `// ${f.path}\n${f.content}`).join('\n\n')}
    
    // ${appFile.path}
    ${appFile.content}
    
    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>`;

    // Create blob and open in new tab
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    toast({ title: "Opened in new tab!" });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'preview' | 'code')} className="w-auto">
          <TabsList className="h-8">
            <TabsTrigger value="preview" className="text-xs px-3">Preview</TabsTrigger>
            <TabsTrigger value="code" className="text-xs px-3">Code</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {activeTab === 'preview' && files.length > 0 && (
            <>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={device === 'mobile' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDevice('mobile')}
                  title="Mobile view"
                >
                  <Smartphone className="h-3 w-3" />
                </Button>
                <Button
                  variant={device === 'tablet' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDevice('tablet')}
                  title="Tablet view"
                >
                  <Tablet className="h-3 w-3" />
                </Button>
                <Button
                  variant={device === 'desktop' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setDevice('desktop')}
                  title="Desktop view"
                >
                  <Monitor className="h-3 w-3" />
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={forceReload}
                title="Reload preview"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleOpenInNewTab}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </>
          )}
          {files.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleDownloadProject} title="Download project">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full w-full overflow-hidden">
            <SandpackPreview
              files={debouncedFiles}
              device={device}
              isUpdating={isUpdating}
              reloadKey={reloadKey}
            />
          </div>
        ) : (
          <div className="flex h-full">
            {/* File Tree */}
            <div className="w-64 border-r border-border bg-muted/30 p-4">
              <h3 className="text-sm font-semibold mb-3">Files</h3>
              {files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files generated yet</p>
              ) : (
                <FileExplorer
                  files={files}
                  activePath={selectedFile}
                  onOpen={(path) => {
                    setSelectedFile(path);
                    onFileOpen?.(path);
                  }}
                />
              )}
            </div>

              {/* Code Viewer */}
              <div className="flex-1 overflow-hidden">
                {selectedFile ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                      <span className="text-sm font-medium">{selectedFile}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const file = files.find(f => f.path === selectedFile);
                          if (file) handleCopyCode(file.content);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <ScrollArea className="flex-1">
                      <SyntaxHighlighter
                        language={getLanguage(selectedFile)}
                        style={vscDarkPlus}
                        showLineNumbers
                        customStyle={{ margin: 0, borderRadius: 0 }}
                      >
                        {files.find(f => f.path === selectedFile)?.content || ''}
                      </SyntaxHighlighter>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm">Select a file to view its code</p>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
