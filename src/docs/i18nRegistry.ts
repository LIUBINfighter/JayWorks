import { DocRegistry, DocRecord } from './types';

export interface I18nRegistryOptions {
  activeLocale?: string;           // 当前语言
  defaultLocale?: string;          // 默认语言（fallback）
  // 暂简化：通过回调派生 canonicalId，可传 undefined 表示使用 meta.id
  getCanonicalId?(id: string): string;
}

export interface I18nDocRegistry extends DocRegistry {
  setActiveLocale(locale: string): void;
  getActiveLocale(): string;
  getDefaultLocale(): string;
  listLocales(): string[]; // 已知的 locale 列表（从文档扫描得出）
}

/**
 * 简化 i18n：假设当前文档集合里包含多语言版本，其 ID 约定为：`<canonicalId>` 或 `<canonicalId>.<locale>`。
 * 例如：`example` (zh-CN) 与 `example.en` (英文)。如果当前 locale=en，优先使用 `example.en`，否则 fallback example。
 */
export function createI18nRegistry(base: DocRegistry, opts: I18nRegistryOptions = {}): I18nDocRegistry {
  let activeLocale = opts.activeLocale || 'zh-CN';
  const defaultLocale = opts.defaultLocale || 'zh-CN';
  const canonicalOf = opts.getCanonicalId || ((id: string) => id.split('.')[0]);

  // 构建索引：canonicalId -> locale -> record
  function buildIndex() {
    const map = new Map<string, Map<string, DocRecord>>();
    for (const id of base.getDocIds()) {
      const rec = base.getDoc(id);
      if (!rec) continue;
      const parts = id.split('.');
      let locale: string | undefined;
      if (parts.length > 1) locale = parts[parts.length - 1];
      // 仅简单判断：两段式 example.en 视为 locale；如果中间还有点则保留最后一段
      const canonicalId = canonicalOf(id);
      if (!map.has(canonicalId)) map.set(canonicalId, new Map());
      map.get(canonicalId)!.set(locale || defaultLocale, rec);
    }
    return map;
  }

  function resolve(canonicalId: string): DocRecord | undefined {
    const idx = buildIndex();
    const bucket = idx.get(canonicalId);
    if (!bucket) return undefined;
    // 优先 activeLocale，其次 defaultLocale，其次任意
    let rec = bucket.get(activeLocale);
    if (rec) {
      if (!rec.meta.locale) rec.meta.locale = activeLocale;
      rec.meta.canonicalId = canonicalId;
      rec.meta.isFallback = false;
      return rec;
    }
    rec = bucket.get(defaultLocale) || Array.from(bucket.values())[0];
    if (rec) {
      if (!rec.meta.locale) rec.meta.locale = rec.meta.locale || defaultLocale;
      rec.meta.canonicalId = canonicalId;
      rec.meta.isFallback = rec.meta.locale !== activeLocale;
      return rec;
    }
    return undefined;
  }

  function listCanonicalIds(): string[] {
    const idx = buildIndex();
    return Array.from(idx.keys());
  }

  return {
    getDocIds() {
      // 对外暴露 canonicalId 列表
      return listCanonicalIds();
    },
    getDoc(id: string) {
      return resolve(id);
    },
    list() {
      return listCanonicalIds().map(cid => resolve(cid)).filter(Boolean) as DocRecord[];
    },
    setActiveLocale(locale: string) { activeLocale = locale; },
    getActiveLocale() { return activeLocale; },
    getDefaultLocale() { return defaultLocale; },
    listLocales() {
      const idx = buildIndex();
      const set = new Set<string>();
      for (const m of idx.values()) for (const loc of m.keys()) set.add(loc);
      return Array.from(set.values());
    }
  };
}
