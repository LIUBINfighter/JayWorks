import { DocRegistry, DocRecord, DocMeta } from './types';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';

// Milestone 0: 内嵌示例文档集合（后续可扩展 provider 模式）
const embeddedSources: Record<string, string> = {
  demo: `---\ntitle: 组件演示 (Unified)\ndescription: MDX + 受控白名单组件演示\nauthor: JayWorks\ndate: 2025-09-26\n---\n\n# 自定义组件白名单演示\n\n<SimpleButton label="点我" />\n\n<OcrPlayground initialText="Hello MDX" />\n\n> 仅支持字符串/布尔属性，表达式被忽略。\n`,
  example: `---\ntitle: 示例文档\ndescription: 第二篇示例，演示多文档切换\n---\n\n## 二号文档\n\n这是另一份简单内容，可继续扩展。\n\n- 支持 frontmatter\n- 支持 MDX 组件 (受控)\n`
};

// 初始化记录
const records = new Map<string, DocRecord>();
for (const [id, raw] of Object.entries(embeddedSources)) {
  const meta: DocMeta = { id, title: id, slug: id };
  records.set(id, { meta, raw, status: 'idle' });
}

function compileIfNeeded(rec: DocRecord) {
  if (!rec.raw) return;
  if (rec.compiled) return;
  try {
    const { frontmatter, element } = renderMdxToReact(rec.raw, { components: getComponentMap() });
    // 合并 frontmatter 中可覆盖的 meta 字段
    if (frontmatter.title) rec.meta.title = String(frontmatter.title);
    if (frontmatter.description) rec.meta.description = String(frontmatter.description);
    rec.compiled = { frontmatter, element, parsedAt: Date.now() };
    rec.status = 'ready';
  } catch (e: any) {
    rec.status = 'error';
    rec.error = e?.message || '解析失败';
  }
}

export const docRegistry: DocRegistry = {
  getDocIds() { return Array.from(records.keys()); },
  getDoc(id: string) {
    const rec = records.get(id);
    if (!rec) return undefined;
    compileIfNeeded(rec);
    return rec;
  },
  list() { return this.getDocIds().map((id: string) => this.getDoc(id)!).filter(Boolean); }
};
