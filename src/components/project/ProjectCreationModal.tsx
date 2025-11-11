import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { createNewProject } from "@/stores/projectStore";
import { Globe, LayoutDashboard, Briefcase, FileText } from "lucide-react";

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
}

const projectTypes = [
  { id: "landing-page", label: "Landing Page", icon: Globe, description: "Marketing pages & portfolios" },
  { id: "web-app", label: "Web App", icon: LayoutDashboard, description: "Full-featured applications" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Admin panels & analytics" },
  { id: "portfolio", label: "Portfolio", icon: Briefcase, description: "Personal & professional showcases" },
];

export function ProjectCreationModal({ open, onClose }: ProjectCreationModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState<string>("landing-page");
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!projectName.trim()) return;

    const newProject = createNewProject(projectName.trim());
    const newProjectId = newProject.id;
    
    // Update project with type
    const allProjects: Record<string, any> = JSON.parse(localStorage.getItem("module.projects.v1") || "{}");
    if (allProjects[newProjectId]) {
      allProjects[newProjectId] = {
        ...allProjects[newProjectId],
        stack: projectType,
        description: `A ${projectTypes.find(t => t.id === projectType)?.description || projectType}`,
      };
      localStorage.setItem("module.projects.v1", JSON.stringify(allProjects));
    }

    onClose();
    navigate(`/studio?project=${newProjectId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] glass-card border-primary/20"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a New Project</DialogTitle>
          <DialogDescription>
            Enter your project details to begin building in Module Studio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              placeholder="My Awesome Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="glass-card border-primary/30"
              autoFocus
            />
          </div>

          {/* Project Type */}
          <div className="space-y-3">
            <Label>Project Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProjectType(type.id)}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${projectType === type.id 
                      ? "border-primary bg-primary/10 shadow-lg" 
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                    }
                  `}
                >
                  <type.icon className={`w-5 h-5 mb-2 ${projectType === type.id ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-sm font-semibold">{type.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!projectName.trim()}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50"
          >
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
