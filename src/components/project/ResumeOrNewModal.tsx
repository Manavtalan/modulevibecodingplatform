import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";
import { ProjectMeta } from "@/stores/projectStore";

interface ResumeOrNewModalProps {
  open: boolean;
  project: ProjectMeta | null;
  onResume: () => void;
  onStartNew: () => void;
  onClose: () => void;
}

export function ResumeOrNewModal({ open, project, onResume, onStartNew, onClose }: ResumeOrNewModalProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resume your work?</DialogTitle>
          <DialogDescription>
            You were last working on <span className="font-semibold text-foreground">"{project.name}"</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          <Button
            onClick={onResume}
            size="lg"
            className="w-full justify-start gap-3"
          >
            <FolderOpen className="h-5 w-5" />
            Continue with "{project.name}"
          </Button>
          
          <Button
            onClick={onStartNew}
            variant="outline"
            size="lg"
            className="w-full justify-start gap-3"
          >
            <Plus className="h-5 w-5" />
            Start new project
          </Button>
        </div>

        <DialogFooter className="sm:justify-start">
          <p className="text-xs text-muted-foreground">
            Your previous work is always saved in Project History
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
