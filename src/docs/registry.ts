import { DocRegistry, DocRecord, DocMeta, DocSourceProvider } from './types';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';

// ---------------- Embedded Provider ----------------
const embeddedDocs: Record<string, string> = {
  demo: `---\ntitle: 组件演示 (Unified)\ndescription: MDX + 受控白名单组件演示\nauthor: JayWorks\ndate: 2025-09-26\n---\n\n# 自定义组件白名单演示\n\n<SimpleButton label="点我" />\n\n<OcrPlayground initialText="Hello MDX" />\n\n> 仅支持字符串/布尔属性，表达式被忽略。\n`,
  example: `---\ntitle: 示例文档\ndescription: 第二篇示例，演示多文档切换\n---\n\n## 二号文档\n\n这是另一份简单内容，可继续扩展。\n\n- 支持 frontmatter\n- 支持 MDX 组件 (受控)\n`
};

const embeddedProvider: DocSourceProvider = {
  name: 'embedded',
  listMeta() {
    return Object.keys(embeddedDocs).map<DocMeta>(id => ({
      id,
      title: id,
      slug: id,
      sourceType: 'embedded'
    }));
  },
  loadRaw(meta: DocMeta) {
    return embeddedDocs[meta.id];
  }
};

// ---------------- Registry Core ----------------
const providers: DocSourceProvider[] = [embeddedProvider];
const recordMap = new Map<string, DocRecord>();

function ensureRecord(meta: DocMeta): DocRecord {
  let rec = recordMap.get(meta.id);
  if (!rec) {
    rec = { meta: { ...meta }, status: 'idle' };
    recordMap.set(meta.id, rec);
  }
  return rec;
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

function loadAllMeta() {
  for (const p of providers) {
    const metas = p.listMeta();
    const arr = Array.isArray(metas) ? metas : [];
    for (const m of arr) ensureRecord(m);
  }
}

loadAllMeta();

export const docRegistry: DocRegistry = {
  getDocIds() { return Array.from(recordMap.keys()); },
  getDoc(id: string) {
    const rec = recordMap.get(id);
    if (!rec) return undefined;
    if (rec.status === 'idle') {
      const provider = providers.find(p => p.name === rec.meta.sourceType) || embeddedProvider;
      try {
        const raw = provider.loadRaw(rec.meta);
        if (typeof raw === 'string') {
          rec.raw = raw;
        } else {
          // 若未来支持 Promise，这里可以升级为 async 外层 API
          rec.status = 'error';
          rec.error = '异步 provider 暂未支持（需升级接口）';
        }
      } catch (e: any) {
        rec.status = 'error'; rec.error = e?.message || '加载失败';
      }
    }
    if (rec.status !== 'error') compile(rec);
    return rec;
  },
  list() {
    return this.getDocIds()
      .map((id: string) => this.getDoc(id)!)
      .filter(Boolean)
  .sort((a: DocRecord, b: DocRecord) => {
        const ao = a.meta.order ?? 9999;
        const bo = b.meta.order ?? 9999;
        if (ao !== bo) return ao - bo;
        return a.meta.title.localeCompare(b.meta.title, 'zh-CN');
      });
  }
};

export function _internalRegisterProvider(p: DocSourceProvider) {
  providers.push(p);
  const metas = p.listMeta();
  if (Array.isArray(metas)) metas.forEach(m => ensureRecord(m));
}
