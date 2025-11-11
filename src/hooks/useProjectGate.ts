import { useState, useEffect } from "react";
import { ensureProject, isSessionStale, getCurrentProject, selectProject, createNewProject, ProjectMeta } from "@/stores/projectStore";

interface ProjectGateState {
  showModal: boolean;
  candidate: ProjectMeta | null;
}

export function useProjectGate() {
  const [state, setState] = useState<ProjectGateState>({
    showModal: false,
    candidate: null,
  });

  useEffect(() => {
    // Ensure project exists
    const project = ensureProject();
    
    // Check if session is stale
    if (isSessionStale()) {
      setState({
        showModal: true,
        candidate: project,
      });
    }
  }, []);

  const resume = () => {
    if (state.candidate) {
      selectProject(state.candidate.id);
    }
    setState({ showModal: false, candidate: null });
  };

  const startNew = () => {
    createNewProject();
    setState({ showModal: false, candidate: null });
  };

  const dismiss = () => {
    setState({ showModal: false, candidate: null });
  };

  return {
    showModal: state.showModal,
    candidate: state.candidate,
    resume,
    startNew,
    dismiss,
  };
}
