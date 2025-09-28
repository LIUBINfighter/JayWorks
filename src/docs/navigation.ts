// 自动扫描多语言文档：
// - 主导航使用 zh-cn 目录结构
// - 其它语言目录 (en 等) 只作为变体存在（不直接出现在导航）
// - Root README 仍然保留为单独入口（id=readme）
import rootReadme from '../../README.md';

// esbuild 支持 import.meta.globEager（与 Vite 类似）；若不支持需改为手动维护。
// 扫描中文主文档 (zh-cn)
// 兼容 esbuild：声明 any 以通过 TS；运行期若不支持需改为构建脚本生成。
const zhModules = (import.meta as any).globEager ? (import.meta as any).globEager('./zh-cn/**/*.mdx') : {};
// 扫描英文变体 (en)
const enModules = (import.meta as any).globEager ? (import.meta as any).globEager('./en/**/*.mdx') : {};

// 将路径映射为逻辑 id：例如 ./zh-cn/demo/demo.mdx -> demo ；子目录 style-guide/readme.mdx -> style-guide
function toCanonicalId(rel: string): string {
  // 去掉前缀 ./zh-cn/ 或 ./en/
  const cleaned = rel.replace(/^\.\/(zh-cn|en)\//, '');
  // 去掉扩展名
  const noExt = cleaned.replace(/\.mdx?$/i, '');
  // style-guide/readme -> style-guide ; 其它保持文件名
  if (noExt.endsWith('/readme')) return noExt.replace(/\/readme$/, '');
  return noExt.split('/').join('-'); // 用 - 链接层级，避免与 locale 规则冲突
}

// 生成 MDX_SOURCES 初始映射（中文为 canonical，英文加 .en 后缀）
const MDX_SOURCES_INTERNAL: Record<string, any> = { 'readme': rootReadme };
for (const p in zhModules) {
  const mod = zhModules[p];
  const id = toCanonicalId(p.replace(/^\.\//, ''));
  if (!id) continue;
  MDX_SOURCES_INTERNAL[id] = mod.default || mod;
}
for (const p in enModules) {
  const mod = enModules[p];
  const baseId = toCanonicalId(p.replace(/^\.\//, ''));
  if (!baseId) continue;
  // 英文变体：追加 .en
  MDX_SOURCES_INTERNAL[baseId + '.en'] = mod.default || mod;
}

export interface NavDocItem {
  type?: 'doc';        // 可选标记
  id: string;          // 文档唯一 ID / slug
  file: string;        // 相对 docs 根路径（用于调试校验）
  label?: string;      // 导航显示名称（可覆盖 frontmatter.title）
  draft?: boolean;     // draft: true 时不出现在导航与列表
}

export interface NavCategory {
  type: 'category';
  id: string;                 // 分类 ID（可与 index 文档 id 相同）
  label: string;              // 展示名称
  items: NavDocItem[];        // 子文档（纯 doc）
  defaultId?: string;         // 点击分类时选中的文档（默认首个）
  collapsible?: boolean;      // 是否可折叠（默认 true）
  collapsed?: boolean;        // 初始是否折叠
  draft?: boolean;            // 整个分类隐藏
}

export type NavEntry = NavDocItem | NavCategory;

export interface NavGroup {
  id: string;          // 顶部导航组 ID
  label: string;       // 顶部显示名
  items: NavEntry[];   // 顺序即显示顺序（支持 doc + category）
}

// MDX 源映射（与 import 名称对应）
export const MDX_SOURCES: Record<string, any> = MDX_SOURCES_INTERNAL;

// 顶部导航分组配置（按数组顺序呈现）
// 基于 zh-cn 模块构建导航组：
// 规则：demo/* -> Demo 组；dev/* -> Dev 组；style-guide/* 聚合为分类
function buildNavGroups(): NavGroup[] {
  const demoItems: NavDocItem[] = [
    { id: 'readme', file: '../README.md', label: 'README' }
  ];
  const devItems: NavEntry[] = [];
  const styleGuideDocs: NavDocItem[] = [];

  for (const p in zhModules) {
    const rel = p.replace(/^\.\/zh-cn\//, '');
    if (!rel.endsWith('.mdx')) continue;
    const id = toCanonicalId('zh-cn/' + rel).replace(/^zh-cn-/, ''); // already normalized
    if (rel.startsWith('demo/')) {
      if (id !== 'readme') demoItems.push({ id, file: 'zh-cn/' + rel });
    } else if (rel.startsWith('dev/style-guide/')) {
      const sgId = toCanonicalId('zh-cn/' + rel).replace(/^zh-cn-/, '');
      styleGuideDocs.push({ id: sgId, file: 'zh-cn/' + rel });
    } else if (rel.startsWith('dev/')) {
      const devId = toCanonicalId('zh-cn/' + rel).replace(/^zh-cn-/, '');
      devItems.push({ id: devId, file: 'zh-cn/' + rel });
    }
  }

  // style-guide 分类（如果存在内容）
  if (styleGuideDocs.length) {
    devItems.push({
      type: 'category',
      id: 'style-guide',
      label: 'Style Guide',
      defaultId: 'style-guide',
      items: styleGuideDocs
    } as NavCategory);
  }

  return [
    { id: 'demo', label: 'Demo', items: demoItems },
    { id: 'dev', label: 'Dev', items: devItems }
  ];
}

export const NAV_GROUPS: NavGroup[] = buildNavGroups();
