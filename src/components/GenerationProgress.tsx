import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

export interface FilePlan {
  path: string;
  description: string;
  status?: 'pending' | 'generating' | 'complete' | 'failed';
}

export interface GenerationProgressProps {
  phase: 'planning' | 'generating' | 'complete' | 'error';
  currentFile: string | null;
  filesComplete: string[];
  filesFailed: string[];
  filesTotal: number;
  filesPlan: FilePlan[];
  errorMessage?: string;
}

export function GenerationProgress({
  phase,
  currentFile,
  filesComplete,
  filesFailed,
  filesTotal,
  filesPlan,
  errorMessage,
}: GenerationProgressProps) {
  const progress = filesTotal > 0 ? (filesComplete.length / filesTotal) * 100 : 0;

  const getFileStatus = (filePath: string): 'pending' | 'generating' | 'complete' | 'failed' => {
    if (filesFailed.includes(filePath)) return 'failed';
    if (filesComplete.includes(filePath)) return 'complete';
    if (currentFile === filePath) return 'generating';
    return 'pending';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {phase === 'planning' && 'Planning project structure...'}
              {phase === 'generating' && 'Generating files...'}
              {phase === 'complete' && '✓ Generation complete'}
              {phase === 'error' && 'Generation failed'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {phase === 'generating' && `${filesComplete.length} of ${filesTotal} files complete`}
              {phase === 'complete' && `Successfully generated ${filesComplete.length} file(s)`}
              {phase === 'error' && errorMessage}
            </p>
          </div>
          {phase === 'generating' && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
        </div>

        {/* Progress Bar */}
        {phase === 'generating' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* File List */}
        {filesPlan.length > 0 && (
          <ScrollArea className="h-[300px] border rounded-lg p-4">
            <div className="space-y-2">
              {filesPlan.map((file) => {
                const status = getFileStatus(file.path);
                return (
                  <div
                    key={file.path}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      status === 'generating'
                        ? 'bg-primary/10 border border-primary/20'
                        : status === 'complete'
                        ? 'bg-green-500/10'
                        : status === 'failed'
                        ? 'bg-destructive/10'
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {status === 'generating' && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      {status === 'complete' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {status === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      {status === 'pending' && (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.path}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {file.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </Card>
  );
}
