// NOTE: 多版本 (versionedRegistry) 已暂停使用，仅保留 i18n 层。
// 保留文件以便未来如果需要恢复版本 alias 功能。
// import { versionedRegistry } from './versionedRegistry';
import { createI18nRegistry } from './i18nRegistry';
import { DocRegistry } from './types';
import { docRegistry } from './registry';

/**
 * 仅保留 i18n 层（原先: versionedRegistry -> i18n）。
 * 现在直接: docRegistry -> i18nRegistry。
 * 未来如恢复多版本，可再次包一层 createVersionedRegistry。
 */

const i18n = createI18nRegistry(docRegistry as unknown as DocRegistry, {
  activeLocale: 'zh-CN',
  defaultLocale: 'zh-CN'
});

export const docsRegistry = i18n; // unified export name for UI usage

export type CombinedDocsRegistry = typeof docsRegistry;
