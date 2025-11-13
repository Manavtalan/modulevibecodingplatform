import type { SandpackFiles } from "@codesandbox/sandpack-react";

export interface GenFile {
  path: string;
  content: string;
}

export type SandpackTemplate = "react-ts" | "static";

export interface PreviewAdapterResult {
  template: SandpackTemplate;
  files: SandpackFiles;
}

/**
 * Normalize file path to ensure it starts with /
 */
function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Convert Module's generated files to Sandpack format
 * Module only generates React + TypeScript projects, so we always use react-ts template
 */
export function adaptFilesToSandpack(files: GenFile[]): PreviewAdapterResult {
  // Always use react-ts template since Module only generates React + TS projects
  const template: SandpackTemplate = "react-ts";

  // Convert files to Sandpack format
  const sandpackFiles: SandpackFiles = {};
  
  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    sandpackFiles[normalizedPath] = {
      code: file.content
    };
  }

  console.debug("Sandpack preview config:", { template, fileCount: files.length });

  return {
    template,
    files: sandpackFiles,
  };
}
