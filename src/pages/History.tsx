import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, FolderOpen, Clock } from "lucide-react";
import { getAllProjects, deleteProject, openProject, ProjectState } from "@/stores/projectStore";
import { Button } from "@/components/ui/button";

export default function History() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectState[]>([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = getAllProjects();
    setProjects(allProjects.sort((a, b) => 
      new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
    ));
  };

  const handleOpenProject = (id: string) => {
    openProject(id);
    navigate("/studio");
  };

  const handleDeleteProject = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
      loadProjects();
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const formatTokens = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    return {
      text: `${used.toLocaleString()} / ${limit.toLocaleString()}`,
      percentage: Math.min(percentage, 100)
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-page py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Project History</h1>
          <p className="text-neutral-400">View and manage your saved projects</p>
        </div>

        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-neutral-400 mb-6">Create your first project to get started</p>
            <Button onClick={() => navigate("/studio")}>
              Create New Project
            </Button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300">
                      Tokens Used
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-300">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
                    const tokens = formatTokens(project.tokenUsed, project.tokenLimit);
                    return (
                      <tr
                        key={project.id}
                        className="border-b border-neutral-800/50 hover:bg-neutral-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {project.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-neutral-100">
                                {project.name}
                              </div>
                              <div className="text-xs text-neutral-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Created {formatDate(project.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm text-neutral-300 font-mono">
                              {tokens.text}
                            </div>
                            <div className="h-1.5 w-32 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                                style={{ width: `${tokens.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {project.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-400">
                          {formatDate(project.lastOpened)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenProject(project.id)}
                            >
                              <FolderOpen className="w-4 h-4 mr-1" />
                              Open
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
