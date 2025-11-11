export type ProjectPlan = "Starter" | "Pro" | "Enterprise";

export interface ProjectState {
  id: string;
  name: string;
  plan: ProjectPlan;
  tokenUsed: number;
  tokenLimit: number;
  visibility: "private" | "public";
  createdAt: string;
  lastOpened: string;
  theme: "light" | "dark" | "system";
}

const STORAGE_KEY = "module.projectData.v1";

// Default project state
const createDefaultProject = (): ProjectState => ({
  id: crypto.randomUUID(),
  name: "Untitled Project",
  plan: "Starter",
  tokenUsed: 0,
  tokenLimit: 1000000,
  visibility: "private",
  createdAt: new Date().toISOString(),
  lastOpened: new Date().toISOString(),
  theme: "system"
});

// Get all projects from localStorage
export function getAllProjects(): ProjectState[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading projects:", error);
    return [];
  }
}

// Get current project (most recently opened)
export function getCurrentProject(): ProjectState {
  const projects = getAllProjects();
  if (projects.length === 0) {
    const defaultProject = createDefaultProject();
    saveProject(defaultProject);
    return defaultProject;
  }
  
  // Return most recently opened
  const sorted = projects.sort((a, b) => 
    new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
  );
  return sorted[0];
}

// Save/update a project
export function saveProject(project: ProjectState): void {
  try {
    const projects = getAllProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
      projects[index] = { ...project, lastOpened: new Date().toISOString() };
    } else {
      projects.push({ ...project, lastOpened: new Date().toISOString() });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Error saving project:", error);
  }
}

// Update current project
export function updateProject(updates: Partial<ProjectState>): void {
  const current = getCurrentProject();
  saveProject({ ...current, ...updates });
}

// Delete a project
export function deleteProject(id: string): void {
  try {
    const projects = getAllProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Error deleting project:", error);
  }
}

// Create a new project
export function createNewProject(name: string = "Untitled Project"): ProjectState {
  const project = createDefaultProject();
  project.name = name;
  saveProject(project);
  return project;
}

// Open a project (update lastOpened)
export function openProject(id: string): ProjectState | null {
  const projects = getAllProjects();
  const project = projects.find(p => p.id === id);
  
  if (project) {
    project.lastOpened = new Date().toISOString();
    saveProject(project);
    return project;
  }
  
  return null;
}

// Update token usage
export function updateTokenUsage(used: number): void {
  const current = getCurrentProject();
  updateProject({ tokenUsed: current.tokenUsed + used });
}
