import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/history/ProjectCard";
import { getAllProjects, selectProject, deleteProject, duplicateProject, ProjectMeta } from "@/stores/projectStore";
import { FolderPlus } from "lucide-react";

interface MyProjectsProps {
  onCreateNew: () => void;
}

export function MyProjects({ onCreateNew }: MyProjectsProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = () => {
      const allProjects = getAllProjects();
      setProjects(allProjects);
    };

    loadProjects();

    // Subscribe to changes
    const unsubscribe = () => {
      loadProjects();
    };

    window.addEventListener("storage", unsubscribe);
    return () => window.removeEventListener("storage", unsubscribe);
  }, []);

  const handleOpen = (id: string) => {
    selectProject(id);
    navigate(`/studio?project=${id}`);
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    setProjects(getAllProjects());
  };

  const handleDuplicate = (id: string) => {
    const newId = duplicateProject(id);
    if (newId) {
      setProjects(getAllProjects());
    }
  };

  const handleRename = (id: string, name: string) => {
    const allProjects = JSON.parse(localStorage.getItem("module.projects.v1") || "{}");
    if (allProjects[id]) {
      allProjects[id].name = name;
      localStorage.setItem("module.projects.v1", JSON.stringify(allProjects));
      setProjects(getAllProjects());
    }
  };

  // Show only first 6 projects on dashboard
  const displayProjects = projects.slice(0, 6);

  if (projects.length === 0) {
    return (
      <div className="relative z-10 py-12 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: '#ffffff' }}>
              My <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)' }}>Projects</span>
            </h2>
          </div>

          <div className="glass-card p-12 text-center rounded-2xl">
            <FolderPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first project using the "Try Demo" button above!
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 rounded-full font-semibold transition-all hover:scale-105"
              style={{
                backgroundImage: 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(255,122,24,0.4)'
              }}
            >
              Start New Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color: '#ffffff' }}>
            My <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #FF7A18 0%, #FFB347 100%)' }}>Projects</span>
          </h2>
          {projects.length > 6 && (
            <button
              onClick={() => navigate('/history')}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              View All →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayProjects.map((project) => (
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
      </div>
    </div>
  );
}
