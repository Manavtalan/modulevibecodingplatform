import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink, Smartphone, Tablet, Monitor, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { CodeFile } from "@/pages/ModuleStudio";
import { FilePlan } from "@/components/GenerationProgress";
import { DiagnosticInfo } from "@/hooks/useCodeGeneration";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReactPreview } from "./ReactPreview";
import FileExplorer from "@/components/FileExplorer";

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
}

type DeviceMode = 'mobile' | 'tablet' | 'desktop';

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
  onRegenerate
}: PreviewPanelProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Auto-select first file when files change
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0].path);
    }
  }, [files, selectedFile]);

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

  const getDeviceClass = () => {
    switch (deviceMode) {
      case 'mobile': return 'max-w-[375px] mx-auto';
      case 'tablet': return 'max-w-[768px] mx-auto';
      default: return 'w-full';
    }
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) return 'jsx';
    if (filename.endsWith('.ts')) return 'typescript';
    return 'text';
  };

  const renderPreview = () => {
    if (files.length === 0) {
      // Show detailed error info if available
      const hasParsingErrors = diagnosticInfo && diagnosticInfo.parsingErrors.length > 0;
      
      return (
        <div className="flex items-center justify-center h-full p-8">
          <Card className="max-w-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-500 mt-1" />
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-lg font-semibold">No Files Generated</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasParsingErrors 
                      ? "The AI generated content, but we couldn't parse it into files."
                      : "Ask Module to generate code to see a live preview."}
                  </p>
                </div>
                
                {hasParsingErrors && diagnosticInfo && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Parsing Issues Detected</AlertTitle>
                    <AlertDescription className="mt-2 space-y-1">
                      {diagnosticInfo.parsingErrors.map((err, idx) => (
                        <div key={idx} className="text-xs">• {err}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex gap-2 pt-2">
                  {rawOutputAvailable && (
                    <Dialog open={showDiagnostics} onOpenChange={setShowDiagnostics}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Raw Output
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Raw AI Output & Diagnostics</DialogTitle>
                          <DialogDescription>
                            This is the raw content received from the AI. Use this to debug parsing issues.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh] rounded border p-4 bg-muted/30">
                          {diagnosticInfo && (
                            <div className="space-y-4 text-sm">
                              <div>
                                <strong>Extraction Method:</strong> {diagnosticInfo.extractionMethod}
                              </div>
                              <div>
                                <strong>File Markers Found:</strong> {diagnosticInfo.fileMarkersFound}
                              </div>
                              <div>
                                <strong>Code Blocks Found:</strong> {diagnosticInfo.codeBlocksFound}
                              </div>
                              <div>
                                <strong>Raw Content ({diagnosticInfo.rawContent.length} bytes):</strong>
                                <pre className="mt-2 p-3 bg-background rounded text-xs whitespace-pre-wrap break-all">
                                  {diagnosticInfo.rawContent}
                                </pre>
                              </div>
                            </div>
                          )}
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {onRegenerate && (
                    <Button variant="default" size="sm" onClick={onRegenerate}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate with Stricter Prompt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Check if it's a React app
    const hasReactFiles = files.some(f => 
      f.path.includes('.tsx') || 
      f.path.includes('.jsx') || 
      f.content.includes('import React') ||
      f.content.includes('from "react"') ||
      f.content.includes('from \'react\'')
    );

    if (hasReactFiles) {
      return <ReactPreview files={files} deviceMode={deviceMode} />;
    }
    
    // Check if it's a Vue app (Sandpack also supports Vue, but for now we'll show a message)
    const hasVueFiles = files.some(f => 
      f.path.includes('.vue') || 
      f.content.includes('<script setup')
    );

    if (hasVueFiles) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <Card className="max-w-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-blue-500 mt-1" />
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-lg font-semibold">Vue Application Generated</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vue preview coming soon! Use the Code tab to view and download the generated files.
                  </p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="default" size="sm" onClick={() => onTabChange('code')}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Code Files
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadProject}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Project
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Find HTML file for simple web pages
    const htmlFile = files.find(f => f.path.endsWith('.html'));
    if (!htmlFile) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <Card className="max-w-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <div>
                <h3 className="font-semibold">No HTML File Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Switch to the Code tab to view the generated files.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onTabChange('code')}>
                  View Code Files
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    // Create a blob URL for the HTML preview
    let htmlContent = htmlFile.content;

    // Inject CSS and JS inline for preview
    const cssFile = files.find(f => f.path.endsWith('.css'));
    const jsFile = files.find(f => f.path.endsWith('.js'));

    if (cssFile) {
      htmlContent = htmlContent.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }
    if (jsFile) {
      htmlContent = htmlContent.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    return (
      <div className={`${getDeviceClass()} h-full transition-all duration-300`}>
        <iframe
          srcDoc={htmlContent}
          className="w-full h-full border-0 bg-white rounded-lg shadow-sm"
          title="Preview"
          sandbox="allow-scripts"
        />
      </div>
    );
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
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={deviceMode === 'mobile' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setDeviceMode('mobile')}
              >
                <Smartphone className="h-3 w-3" />
              </Button>
              <Button
                variant={deviceMode === 'tablet' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setDeviceMode('tablet')}
              >
                <Tablet className="h-3 w-3" />
              </Button>
              <Button
                variant={deviceMode === 'desktop' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setDeviceMode('desktop')}
              >
                <Monitor className="h-3 w-3" />
              </Button>
            </div>
          )}
          {files.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleDownloadProject}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'preview' ? (
          <div className="h-full overflow-auto bg-muted/30 p-4">
            {renderPreview()}
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
                  onOpen={(path) => setSelectedFile(path)}
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
