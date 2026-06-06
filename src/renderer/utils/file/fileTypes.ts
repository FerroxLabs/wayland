export type FileOrFolderItem = {
  path: string; // Absolute path
  name: string; // File name (may be cleaned for display)
  isFile: boolean; // Whether it is a file
  relativePath?: string; // Relative path to workspace (for sending to Agent)
};
