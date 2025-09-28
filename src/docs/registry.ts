import { DocRegistry, DocRecord, DocMeta } from './types';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';
import { NAV_GROUPS, MDX_SOURCES, NavEntry } from './navigation';

// ---------------- Registry with declarative navigation ----------------
const recordMap = new Map<string, DocRecord>();

function normalizeMdx(mod: any, id: string): string {
  if (typeof mod === 'string') return mod;
  return `MDX import '${id}' was not loaded as raw text. Got type: ${typeof mod}`;
}

function registerDoc(groupId: string, docId: string, file: string, label?: string, draft?: boolean) {
  if (draft) return;
  const rawModule = MDX_SOURCES[docId];
  if (!rawModule) {
    console.warn(`[docs] 未找到 MDX 源: ${docId} (file=${file})`);
    return;
  }
  if (recordMap.has(docId)) {
    console.warn(`[docs] 重复的文档 id: ${docId}`);
    return;
  }
  const meta: DocMeta = {
    id: docId,
    title: docId,
    slug: docId,
    sourceType: 'embedded',
    filePath: file,
    groupId,
    navLabel: label,
  };
  const raw = normalizeMdx(rawModule, docId);
  recordMap.set(docId, { meta, raw, status: 'idle' });
}

function walkEntries(groupId: string, entry: NavEntry) {
  if ((entry as any).type === 'category') {
    const cat: any = entry;
    if (cat.draft) return;
    for (const doc of cat.items) registerDoc(groupId, doc.id, doc.file, doc.label, doc.draft);
  } else {
    const doc = entry as any;
    registerDoc(groupId, doc.id, doc.file, doc.label, doc.draft);
  }
}

// 初始化：根据 NAV_GROUPS 顺序注册文档（递归 categories）
for (const group of NAV_GROUPS) {
  for (const entry of group.items) walkEntries(group.id, entry);
}

// 追加：自动注册语言变体文档（不出现在导航，仅用于 i18n 解析）
// 约定：<canonical>.<locale> 且 canonical 已存在，locale 简单匹配 /^[a-z]{2}(?:-[A-Z]{2})?$/
(() => {
  const LOCALE_RE = /^[a-z]{2}(?:-[A-Z]{2})?$/;
  for (const key of Object.keys(MDX_SOURCES)) {
    if (recordMap.has(key)) continue; // 已经注册（在导航里）
    const parts = key.split('.');
    if (parts.length < 2) continue; // 没有 locale 后缀
    const locale = parts[parts.length - 1];
    if (!LOCALE_RE.test(locale)) continue; // 尾段不是合法 locale
    const canonical = parts.slice(0, -1).join('.');
    if (!recordMap.has(canonical)) continue; // 仅在主文档存在时才注册变体
    const base = recordMap.get(canonical)!;
    // 推导变体路径：如果 canonical 在 zh-cn/ 下，替换为 <locale>/ 前缀；否则直接复用
    let derivedPath = base.meta.filePath || key;
    // 特殊处理根 README：README.md -> README.<locale>.md
    if (canonical === 'readme' && /README\.md$/i.test(derivedPath)) {
      derivedPath = derivedPath.replace(/README\.md$/i, `README.${locale}.md`);
    }
    if (derivedPath.includes('zh-cn/')) {
      derivedPath = derivedPath.replace(/zh-cn\//, `${locale}/`);
    } else if (derivedPath.startsWith('zh-cn/')) {
      derivedPath = derivedPath.replace(/^zh-cn\//, `${locale}/`);
    }
    registerDoc(base.meta.groupId || '', key, derivedPath, undefined, false);
  }
})();


function compile(rec: DocRecord) {
  if (!rec.raw || rec.compiled) return;
  try {
    const { frontmatter, element } = renderMdxToReact(rec.raw, { components: getComponentMap() });
    if (frontmatter.title) rec.meta.title = String(frontmatter.title);
    if (frontmatter.description) rec.meta.description = String(frontmatter.description);
    if (frontmatter.category) rec.meta.category = String(frontmatter.category);
    if (frontmatter.order !== undefined) rec.meta.order = Number(frontmatter.order);
    if (frontmatter.tags) {
      try {
        rec.meta.tags = Array.isArray(frontmatter.tags)
          ? frontmatter.tags.map(String)
          : String(frontmatter.tags).split(/[,;\s]+/);
      } catch (err) {
        console.warn('tags 解析失败', err);
      }
    }
    // updated / date 字段解析 -> 时间戳 (优先 updated)
    const dateStr = frontmatter.updated || frontmatter.date;
    if (dateStr) {
      const ts = Date.parse(String(dateStr));
      if (!isNaN(ts)) rec.meta.updated = ts; else console.warn('无法解析日期字段', dateStr);
    }
    rec.compiled = { frontmatter, element, parsedAt: Date.now() };
    rec.status = 'ready';
  } catch (e: any) {
    rec.status = 'error'; rec.error = e?.message || '解析失败';
  }
}

// 不再需要动态 provider 初始化

export const docRegistry: DocRegistry = {
  getDocIds() { return Array.from(recordMap.keys()); },
  getDoc(id: string) {
    const rec = recordMap.get(id);
    if (!rec) return undefined;
    // 仍保留 idle 状态（未来如果想支持按需加载其它来源）
    if (rec.status !== 'error') compile(rec);
    return rec;
  },
  list() {
    // 直接按 NAV_GROUPS 顺序 + items 顺序返回
    const ordered: DocRecord[] = [];
    for (const group of NAV_GROUPS) {
      for (const entry of group.items) {
        if ((entry as any).type === 'category') {
          const cat: any = entry;
            if (cat.draft) continue;
            for (const doc of cat.items) {
              if (doc.draft) continue;
              const rec = recordMap.get(doc.id);
              if (rec) ordered.push(this.getDoc(rec.meta.id)!);
            }
        } else {
          const doc: any = entry;
          if (doc.draft) continue;
          const rec = recordMap.get(doc.id);
          if (rec) ordered.push(this.getDoc(rec.meta.id)!);
        }
      }
    }
    return ordered;
  }
};
// 不再导出 provider 注册（可日后新增）
