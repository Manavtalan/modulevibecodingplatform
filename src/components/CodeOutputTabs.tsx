import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, FileCode } from 'lucide-react';
import { toast } from 'sonner';

interface CodeFile {
  path: string;
  content: string;
}

interface CodeOutputTabsProps {
  files: CodeFile[];
}

export function CodeOutputTabs({ files }: CodeOutputTabsProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = files.filter(file =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentFile = files.find(f => f.path === selectedFile) || files[0];

  const handleCopy = async () => {
    if (currentFile) {
      await navigator.clipboard.writeText(currentFile.content);
      toast.success('Code copied to clipboard');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'preview' | 'code')} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="preview" className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Code
        </TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="mt-4">
        <Card className="p-6 min-h-[500px]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Preview functionality coming soon</p>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="code" className="mt-4">
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] h-[600px]">
            {/* File List */}
            <div className="border-r border-border bg-muted/30">
              <div className="p-3 border-b border-border">
                <Input
                  type="search"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <ScrollArea className="h-[calc(600px-57px)]">
                <div className="p-2">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file.path)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selectedFile === file.path
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                        aria-selected={selectedFile === file.path}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{file.path}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground p-3">No files found</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Code Viewer */}
            <div className="flex flex-col">
              {currentFile ? (
                <>
                  <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                    <span className="text-sm font-medium truncate flex-1">{currentFile.path}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="ml-2 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1">
                    <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                      <code>{currentFile.content}</code>
                    </pre>
                  </ScrollArea>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No file selected</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
