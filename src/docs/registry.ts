import { DocRegistry, DocRecord, DocMeta } from './types';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';
import { NAV_GROUPS, MDX_SOURCES } from './navigation';

// ---------------- Registry with declarative navigation ----------------
const recordMap = new Map<string, DocRecord>();

function normalizeMdx(mod: any, id: string): string {
  if (typeof mod === 'string') return mod;
  return `MDX import '${id}' was not loaded as raw text. Got type: ${typeof mod}`;
}

// 初始化：根据 NAV_GROUPS 顺序注册文档
for (const group of NAV_GROUPS) {
  for (const item of group.items) {
    if (item.draft) continue; // 跳过 draft
    const rawModule = MDX_SOURCES[item.id];
    if (!rawModule) {
      console.warn(`[docs] 未找到 MDX 源: ${item.id} (file=${item.file})`);
      continue;
    }
    if (recordMap.has(item.id)) {
      console.warn(`[docs] 重复的文档 id: ${item.id}`);
      continue;
    }
    const meta: DocMeta = {
      id: item.id,
      title: item.id,
      slug: item.id,
      sourceType: 'embedded',
      filePath: item.file,
      groupId: group.id,
      navLabel: item.label,
    };
    const raw = normalizeMdx(rawModule, item.id);
    // 初始即放入 raw，延迟编译
    recordMap.set(item.id, { meta, raw, status: 'idle' });
  }
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
      for (const item of group.items) {
        if (item.draft) continue;
        const rec = recordMap.get(item.id);
        if (rec) ordered.push(this.getDoc(rec.meta.id)!);
      }
    }
    return ordered;
  }
};
// 不再导出 provider 注册（可日后新增）
