import { FileSystem } from '../repositories/file-system.js';

export class ConfigLoader {
  static async load(fileSystem: FileSystem): Promise<any> {
    let config: any = {};
    try {
      if (await fileSystem.exists('arch.config.json')) {
        config = JSON.parse(await fileSystem.readFile('arch.config.json'));
      }
      if (await fileSystem.exists('.arch-local.json')) {
        const local = JSON.parse(await fileSystem.readFile('.arch-local.json'));
        this.deepMerge(config, local);
      }
    } catch (e: any) {
      console.warn(`Failed to load config: ${e.message}`);
    }
    return config;
  }

  private static deepMerge(target: any, source: any) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
}
