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
