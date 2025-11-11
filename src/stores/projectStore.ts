export type ProjectPlan = "Starter" | "Pro" | "Enterprise";

export interface ChatEntry {
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  description?: string;
  model?: string;
  stack?: string;
  tokensUsed: number;
  sessionTokensUsed: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  color?: string;
  recentFiles?: string[];
  lastPreviewDevice?: "desktop" | "tablet" | "mobile";
  chat?: ChatEntry[];
  // Legacy fields for backwards compatibility
  plan?: ProjectPlan;
  tokenLimit?: number;
  visibility?: "private" | "public";
  theme?: "light" | "dark" | "system";
}

export interface ProjectState {
  currentId: string | null;
  projects: Record<string, ProjectMeta>;
}

const LS_KEY = "module.projects.v1";
const LS_CUR = "module.currentProject.v1";
const FRESH_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
const LEGACY_KEY = "module.projectData.v1";

// Listeners for reactivity
const listeners = new Set<() => void>();

// Migrate legacy projects (run once)
function migrateLegacyProjects(): void {
  const migrated = localStorage.getItem("module.migrated.v1");
  if (migrated) return;

  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const oldProjects: any[] = JSON.parse(legacy);
      const state = getProjectState();
      
      oldProjects.forEach((old: any) => {
        if (!state.projects[old.id]) {
          const meta: ProjectMeta = {
            id: old.id,
            name: old.name,
            model: "gpt-4o",
            stack: "vite-react-ts",
            tokensUsed: old.tokenUsed || 0,
            sessionTokensUsed: 0,
            createdAt: old.createdAt,
            updatedAt: old.lastOpened || old.createdAt,
            lastOpenedAt: old.lastOpened || old.createdAt,
            color: "#6366f1",
            recentFiles: [],
            chat: [],
            // Preserve legacy fields
            plan: old.plan,
            tokenLimit: old.tokenLimit,
            visibility: old.visibility,
            theme: old.theme,
          };
          state.projects[meta.id] = meta;
        }
      });
      
      saveProjectState(state);
    }
    localStorage.setItem("module.migrated.v1", "true");
  } catch (error) {
    console.error("Migration error:", error);
  }
}

// Create default project
function createDefaultProject(name?: string): ProjectMeta {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name || `Untitled Project`,
    model: "gpt-4o",
    stack: "vite-react-ts",
    tokensUsed: 0,
    sessionTokensUsed: 0,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    color: "#6366f1",
    recentFiles: [],
    chat: [],
  };
}

// Get project state from localStorage
export function getProjectState(): ProjectState {
  migrateLegacyProjects();
  
  try {
    const stored = localStorage.getItem(LS_KEY);
    const currentId = localStorage.getItem(LS_CUR);
    
    if (stored) {
      const projects = JSON.parse(stored);
      return {
        currentId: currentId || null,
        projects,
      };
    }
  } catch (error) {
    console.error("Error loading projects:", error);
  }
  
  return { currentId: null, projects: {} };
}

// Save project state to localStorage
function saveProjectState(state: ProjectState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state.projects));
    if (state.currentId) {
      localStorage.setItem(LS_CUR, state.currentId);
    } else {
      localStorage.removeItem(LS_CUR);
    }
    notifyListeners();
  } catch (error) {
    console.error("Error saving projects:", error);
  }
}

// Notify listeners
function notifyListeners(): void {
  listeners.forEach(listener => listener());
}

// Subscribe to project changes
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Ensure there's a current project
export function ensureProject(): ProjectMeta {
  const state = getProjectState();
  
  if (state.currentId && state.projects[state.currentId]) {
    const project = state.projects[state.currentId];
    project.lastOpenedAt = new Date().toISOString();
    state.projects[state.currentId] = project;
    saveProjectState(state);
    return project;
  }
  
  // Create new project
  const project = createDefaultProject();
  state.projects[project.id] = project;
  state.currentId = project.id;
  saveProjectState(state);
  return project;
}

// Select a project
export function selectProject(id: string): ProjectMeta | null {
  const state = getProjectState();
  const project = state.projects[id];
  
  if (!project) return null;
  
  project.lastOpenedAt = new Date().toISOString();
  state.currentId = id;
  state.projects[id] = project;
  saveProjectState(state);
  return project;
}

// Get current project
export function getCurrentProject(): ProjectMeta | null {
  const state = getProjectState();
  if (!state.currentId) return null;
  return state.projects[state.currentId] || null;
}

// Update current project
export function updateCurrent(updates: Partial<ProjectMeta>): void {
  const state = getProjectState();
  if (!state.currentId) return;
  
  const current = state.projects[state.currentId];
  if (!current) return;
  
  state.projects[state.currentId] = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  saveProjectState(state);
}

// Record tokens
export function recordTokens(delta: number): void {
  const state = getProjectState();
  if (!state.currentId) return;
  
  const current = state.projects[state.currentId];
  if (!current) return;
  
  current.tokensUsed += delta;
  current.sessionTokensUsed += delta;
  current.updatedAt = new Date().toISOString();
  
  state.projects[state.currentId] = current;
  saveProjectState(state);
}

// Append chat entry
export function appendChat(entry: ChatEntry): void {
  const state = getProjectState();
  if (!state.currentId) return;
  
  const current = state.projects[state.currentId];
  if (!current) return;
  
  if (!current.chat) current.chat = [];
  current.chat.push(entry);
  
  // Keep last 50
  if (current.chat.length > 50) {
    current.chat = current.chat.slice(-50);
  }
  
  current.updatedAt = new Date().toISOString();
  state.projects[state.currentId] = current;
  saveProjectState(state);
}

// Log file open
export function logFileOpen(path: string): void {
  const state = getProjectState();
  if (!state.currentId) return;
  
  const current = state.projects[state.currentId];
  if (!current) return;
  
  if (!current.recentFiles) current.recentFiles = [];
  
  // Remove if exists and add to front
  current.recentFiles = [
    path,
    ...current.recentFiles.filter(p => p !== path)
  ].slice(0, 5);
  
  state.projects[state.currentId] = current;
  saveProjectState(state);
}

// Reset session tokens
export function resetSessionTokens(): void {
  const state = getProjectState();
  if (!state.currentId) return;
  
  const current = state.projects[state.currentId];
  if (!current) return;
  
  current.sessionTokensUsed = 0;
  state.projects[state.currentId] = current;
  saveProjectState(state);
}

// Delete project
export function deleteProject(id: string): void {
  const state = getProjectState();
  delete state.projects[id];
  
  if (state.currentId === id) {
    state.currentId = null;
  }
  
  saveProjectState(state);
}

// Duplicate project
export function duplicateProject(id: string): ProjectMeta | null {
  const state = getProjectState();
  const original = state.projects[id];
  
  if (!original) return null;
  
  const now = new Date().toISOString();
  const duplicate: ProjectMeta = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (copy)`,
    sessionTokensUsed: 0,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    chat: [],
  };
  
  state.projects[duplicate.id] = duplicate;
  saveProjectState(state);
  return duplicate;
}

// Get all projects as array
export function getAllProjects(): ProjectMeta[] {
  const state = getProjectState();
  return Object.values(state.projects).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// Check if session is stale
export function isSessionStale(): boolean {
  const current = getCurrentProject();
  if (!current) return false;
  
  const lastOpened = new Date(current.lastOpenedAt).getTime();
  const now = Date.now();
  
  return (now - lastOpened) > FRESH_WINDOW_MS;
}

// Create new project
export function createNewProject(name?: string): ProjectMeta {
  const state = getProjectState();
  const count = Object.keys(state.projects).length;
  const project = createDefaultProject(name || `Untitled Project ${count + 1}`);
  
  state.projects[project.id] = project;
  state.currentId = project.id;
  saveProjectState(state);
  
  return project;
}
