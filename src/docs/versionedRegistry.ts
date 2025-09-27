import { DocRegistry, DocRecord } from './types';
import manifest from './version-manifest.json';
import { docRegistry } from './registry';

/**
 * Lightweight version alias resolver wrapping the base docRegistry.
 * Current strategy: all docs in code are treated as belonging to the 'latest' snapshot
 * unless future code loads additional versioned sources (e.g., archived directories).
 */

interface VersionManifest {
  aliases: Record<string, string | null>; // alias -> snapshot version (null if not available)
  tracks: Array<{ major: number; snapshot: string; stable: boolean }>; // minimal info
  meta?: Record<string, any>;
}

const vm = manifest as VersionManifest;

export interface VersionedRegistryOptions {
  activeAlias?: string; // 'latest' | 'next' | 'v2' ...
}

export interface VersionedDocRegistry extends DocRegistry {
  setActiveAlias(alias: string): void;
  getActiveAlias(): string;
  /** map alias -> snapshot (string | null) */
  getAliasMap(): Record<string, string | null>;
  /** list supported aliases */
  listAliases(): string[];
}

export function createVersionedRegistry(base: DocRegistry, opts: VersionedRegistryOptions = {}): VersionedDocRegistry {
  let activeAlias = opts.activeAlias || 'latest';

  function resolveSnapshot(alias: string): string | null {
    return vm.aliases[alias] ?? null;
  }

  function annotate(record: DocRecord | undefined, alias: string): DocRecord | undefined {
    if (!record) return record;
    const snapshot = resolveSnapshot(alias);
    if (!record.meta.version) record.meta.version = snapshot || '0.0.0';
    if (!record.meta.alias) record.meta.alias = alias;
    if (record.meta.version?.includes('beta') || alias === 'next') record.meta.isPreRelease = true;
    if (record.meta.track == null) {
      const major = Number((record.meta.version || '0').split('.')[0]) || 0;
      record.meta.track = major;
    }
    return record;
  }

  return {
    getDocIds() {
      return base.getDocIds();
    },
    getDoc(id: string) {
      return annotate(base.getDoc(id), activeAlias);
    },
    list() {
      return base.list().map(r => annotate(r, activeAlias)!).filter(Boolean);
    },
    setActiveAlias(alias: string) {
      if (!(alias in vm.aliases)) throw new Error(`Unknown version alias: ${alias}`);
      activeAlias = alias;
    },
    getActiveAlias() { return activeAlias; },
    getAliasMap() { return { ...vm.aliases }; },
    listAliases() { return Object.keys(vm.aliases); }
  };
}

// Provide a default wrapped registry export (initial alias = 'latest')
export const versionedRegistry = createVersionedRegistry(docRegistry, { activeAlias: 'latest' });
