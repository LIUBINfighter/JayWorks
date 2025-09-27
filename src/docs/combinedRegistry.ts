import { versionedRegistry } from './versionedRegistry';
import { createI18nRegistry } from './i18nRegistry';
import { DocRegistry } from './types';

/**
 * Combine version + locale layers: versionedRegistry (base) -> i18n wrapper.
 * For now we assume base registry IDs already contain potential locale suffix (.en).
 */

const i18n = createI18nRegistry(versionedRegistry as unknown as DocRegistry, {
  activeLocale: 'zh-CN',
  defaultLocale: 'zh-CN'
});

export const docsRegistry = i18n; // unified export name for UI usage

export type CombinedDocsRegistry = typeof docsRegistry;
