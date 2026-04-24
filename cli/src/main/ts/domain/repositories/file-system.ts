export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readDirectory(path: string): Promise<string[]>;
  rename(oldPath: string, newPath: string): Promise<void>;
}
