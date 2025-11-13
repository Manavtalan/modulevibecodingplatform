import { useState, useEffect, useCallback } from 'react';
import { GenFile } from './previewAdapter';
import { getCurrentProject, updateCurrent } from '@/stores/projectStore';

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface UsePreviewFilesResult {
  debouncedFiles: GenFile[];
  device: DeviceMode;
  setDevice: (device: DeviceMode) => void;
  isUpdating: boolean;
  forceReload: () => void;
  reloadKey: number;
}

/**
 * Hook to manage debounced preview updates and per-project device state
 */
export function usePreviewFiles(
  projectId: string,
  genFiles: GenFile[],
  debounceMs: number = 500
): UsePreviewFilesResult {
  const [debouncedFiles, setDebouncedFiles] = useState<GenFile[]>(genFiles);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Get device from project store
  const project = getCurrentProject();
  const [device, setDeviceState] = useState<DeviceMode>(
    project?.lastPreviewDevice || 'desktop'
  );

  // Update device in project store when it changes
  const setDevice = useCallback((newDevice: DeviceMode) => {
    setDeviceState(newDevice);
    updateCurrent({ lastPreviewDevice: newDevice });
  }, []);

  // Force reload function
  const forceReload = useCallback(() => {
    setReloadKey(prev => prev + 1);
  }, []);

  // Debounce file changes
  useEffect(() => {
    setIsUpdating(true);
    
    const timer = setTimeout(() => {
      setDebouncedFiles(genFiles);
      setIsUpdating(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [genFiles, debounceMs]);

  // Load device preference from project store on mount
  useEffect(() => {
    const currentProject = getCurrentProject();
    if (currentProject?.lastPreviewDevice) {
      setDeviceState(currentProject.lastPreviewDevice);
    }
  }, [projectId]);

  return {
    debouncedFiles,
    device,
    setDevice,
    isUpdating,
    forceReload,
    reloadKey
  };
}
