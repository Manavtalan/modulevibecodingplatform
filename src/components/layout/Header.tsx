import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProjectDropdown from "../ui/ProjectDropdown";
import TokenBalance from "../ui/TokenBalance";
import { getCurrentProject, updateProject, ProjectState } from "@/stores/projectStore";

export default function Header() {
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<ProjectState | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    const project = getCurrentProject();
    setCurrentProject(project);
    setProjectName(project.name);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleNameBlur = () => {
    if (projectName.trim() && currentProject) {
      updateProject({ name: projectName.trim() });
    } else if (!projectName.trim() && currentProject) {
      setProjectName(currentProject.name);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-neutral-950/80 backdrop-blur-lg px-4 py-2 border-b border-neutral-800">
      <div className="flex items-center gap-3">
        <button
          onClick={handleHomeClick}
          className="p-1.5 rounded-md hover:bg-neutral-800 transition-colors"
          title="Go to Dashboard"
        >
          <Home className="w-5 h-5 text-neutral-400 hover:text-neutral-200" />
        </button>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="bg-transparent text-base font-semibold text-neutral-100 outline-none border-b border-transparent hover:border-neutral-700 focus:border-primary transition-colors px-2 py-1 min-w-[200px]"
            placeholder="Untitled Project"
          />
          {currentProject && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {currentProject.plan === "Starter" ? "Landing Page" : currentProject.plan}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TokenBalance />
        <ProjectDropdown />
      </div>
    </header>
  );
}
