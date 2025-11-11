import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { getAllProjects, deleteProject, duplicateProject, selectProject, createNewProject, updateCurrent, subscribe } from "@/stores/projectStore";

export function ProjectHistoryPage() {
  const [projects, setProjects] = useState(getAllProjects());
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to project changes
    const unsubscribe = subscribe(() => {
      setProjects(getAllProjects());
    });

    return unsubscribe;
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (id: string) => {
    selectProject(id);
    navigate("/studio");
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(getAllProjects());
  };

  const handleDuplicate = (id: string) => {
    duplicateProject(id);
    setProjects(getAllProjects());
  };

  const handleRename = (id: string, name: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      selectProject(id);
      updateCurrent({ name });
      setProjects(getAllProjects());
    }
  };

  const handleNewProject = () => {
    const newProject = createNewProject();
    navigate("/studio");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Project History</h1>
            <p className="text-muted-foreground">
              Manage and access all your projects
            </p>
          </div>
          <Button onClick={handleNewProject} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            New Project
          </Button>
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Projects Grid */}
        {filteredProjects.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found matching "{searchQuery}"</p>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <FolderOpen className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first project to start building amazing React applications
            </p>
            <Button onClick={handleNewProject} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
