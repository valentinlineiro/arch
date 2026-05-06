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

  private getStrategy(taskClass: string, taskSize: string): any[] {
    const strategies = this.config.strategies || {};
    
    // Exact match: class and size
    if (strategies[taskClass]?.[taskSize]) return strategies[taskClass][taskSize];
    
    // Fallback 1: class default size
    if (strategies[taskClass]?.default) return strategies[taskClass].default;
    
    // Fallback 2: default class, specific size
    if (strategies.default?.[taskSize]) return strategies.default[taskSize];
    
    // Fallback 3: default class, default size
    if (strategies.default?.default) return strategies.default.default;

    return [];
  }

  resolve(
    taskClass: string,
    taskSize: string,
    isBinAvailable: (bin: string) => boolean = (bin) => spawnSync('which', [bin]).status === 0
  ): ResolveResult {
    return this.resolveAll(taskClass, taskSize, isBinAvailable)[0] ?? { provider: null, name: null, model: '' };
  }

  resolveAll(
    taskClass: string,
    taskSize: string,
    isBinAvailable: (bin: string) => boolean = (bin) => spawnSync('which', [bin]).status === 0
  ): ResolveResult[] {
    const strategy = this.getStrategy(taskClass, taskSize);

    // Legacy fallback: if no strategy entry found, use old routing/modelTiers logic if they exist
    if (strategy.length === 0 && (this.config.routing || this.config.governance?.modelTiers)) {
      return this.resolveAllLegacy(taskClass, taskSize, isBinAvailable);
    }

    const providerConfigs: any[] = this.config.providers ?? this.buildLegacyProviders();
    const results: ResolveResult[] = [];

    for (const step of strategy) {
      if (step.provider === 'local') {
        results.push({ provider: null, name: 'local', model: step.model || '' });
        continue;
      }

      const pc = providerConfigs.find(p => p.name === step.provider);
      if (!pc) continue;

      if (pc.type === 'bridge') {
        if (!isBinAvailable(pc.bin)) continue;
        results.push({ provider: new BridgeProvider(pc as BridgeConfig), name: pc.name, model: step.model });
      } else if (pc.type === 'native') {
        results.push({ provider: new NativeProvider(pc as NativeConfig), name: pc.name, model: step.model });
      }
    }

    return results;
  }

  private resolveAllLegacy(
    taskClass: string,
    taskSize: string,
    isBinAvailable: (bin: string) => boolean
  ): ResolveResult[] {
    const preferredName: string | null = this.config.routing?.[taskClass] ?? null;

    if (preferredName === 'local') {
      return [{ provider: null, name: 'local', model: this.resolveModelLegacy(taskSize, 'local') }];
    }

    const providerConfigs: any[] = this.config.providers ?? this.buildLegacyProviders();
    const preferred = providerConfigs.find(p => p.name === preferredName);
    const ordered = preferred
      ? [preferred, ...providerConfigs.filter(p => p.name !== preferredName)]
      : providerConfigs;

    const results: ResolveResult[] = [];
    const tier = this.config.governance?.modelTiers?.[taskSize];

    for (const pc of ordered) {
      const model = this.resolveModelLegacy(taskSize, pc.name);
      if (typeof tier === 'object' && tier !== null && !model) continue;

      if (pc.type === 'bridge') {
        if (!isBinAvailable(pc.bin)) continue;
        results.push({ provider: new BridgeProvider(pc as BridgeConfig), name: pc.name, model });
      } else if (pc.type === 'native') {
        results.push({ provider: new NativeProvider(pc as NativeConfig), name: pc.name, model });
      }
    }
    return results;
  }

  private resolveModelLegacy(size: string, providerName?: string): string {
    const tier = this.config.governance?.modelTiers?.[size];
    if (!tier) return '';
    if (typeof tier === 'string') return tier;
    if (typeof tier === 'object' && tier !== null) {
      if (providerName && typeof (tier as any)[providerName] === 'string') {
        return (tier as any)[providerName];
      }
    }
    return '';
  }

  private buildLegacyProviders(): any[] {
    return (this.config.clis ?? []).map((c: any) => ({
      ...c,
      type: 'bridge',
    }));
  }
}
