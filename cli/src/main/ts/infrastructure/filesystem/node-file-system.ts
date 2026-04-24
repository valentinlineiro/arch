import fs from 'node:fs/promises';
import { FileSystem } from '../../domain/repositories/file-system.js';

export class NodeFileSystem implements FileSystem {
  async readFile(path: string): Promise<string> {
    return await fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    await fs.writeFile(path, content, 'utf-8');
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async readDirectory(path: string): Promise<string[]> {
    return await fs.readdir(path);
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    await fs.rename(oldPath, newPath);
  }
}
