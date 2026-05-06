import { BridgeProvider, BridgeConfig } from './bridge-provider.js';
import { NativeProvider, NativeConfig } from './native-provider.js';
import type { LLMProvider } from './llm-provider.js';
import { spawnSync } from 'node:child_process';

export interface ResolveResult {
  provider: LLMProvider | null;
  name: string | null;
  model: string;
}

export class ProviderRegistry {
  constructor(private config: any) {}

  resolveModel(size: string): string {
    return this.config.governance?.modelTiers?.[size] ?? '';
  }

  private isBinAvailable(bin: string): boolean {
    return spawnSync('which', [bin]).status === 0;
  }

  resolve(
    taskClass: string,
    taskSize: string,
    isBinAvailable: (bin: string) => boolean = (bin) => this.isBinAvailable(bin)
  ): ResolveResult {
    return this.resolveAll(taskClass, taskSize, isBinAvailable)[0] ?? { provider: null, name: null, model: '' };
  }

  resolveAll(
    taskClass: string,
    taskSize: string,
    isBinAvailable: (bin: string) => boolean = (bin) => this.isBinAvailable(bin)
  ): ResolveResult[] {
    const model = this.resolveModel(taskSize);
    const preferredName: string | null = this.config.routing?.[taskClass] ?? null;

    if (preferredName === 'local') {
      return [{ provider: null, name: 'local', model }];
    }

    const providerConfigs: any[] = this.config.providers ?? this.buildLegacyProviders();

    const preferred = providerConfigs.find(p => p.name === preferredName);

    // Reorder to put preferred first, then others in order of config
    const ordered = preferred
      ? [preferred, ...providerConfigs.filter(p => p.name !== preferredName)]
      : providerConfigs;

    const results: ResolveResult[] = [];

    for (const pc of ordered) {
      if (pc.type === 'bridge') {
        if (!isBinAvailable(pc.bin)) continue;
        results.push({ provider: new BridgeProvider(pc as BridgeConfig), name: pc.name, model });
      } else if (pc.type === 'native') {
        results.push({ provider: new NativeProvider(pc as NativeConfig), name: pc.name, model });
      }
    }

    return results;
  }

  private buildLegacyProviders(): any[] {
    return (this.config.clis ?? []).map((c: any) => ({
      ...c,
      type: 'bridge',
    }));
  }
}
