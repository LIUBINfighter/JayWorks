// 静态导航与文档源定义（移除 import.meta 动态扫描，避免构建环境不支持的警告）
// Root README 作为入口文档 readme
import rootReadme from '../../README.md';
// zh-cn 主语言文档
import zhDemo from './zh-cn/demo/demo.mdx';
import zhExample from './zh-cn/demo/example.mdx';
import zhConfig from './zh-cn/dev/configuration.mdx';
import zhSchema from './zh-cn/dev/frontformatter-schema.mdx';
import zhDebug from './zh-cn/dev/mdx-component-debug.mdx';
import zhUnified from './zh-cn/dev/unified-plan.mdx';
import zhStyleGuideReadme from './zh-cn/dev/style-guide/readme.mdx';
import zhStyleGuideObsidian from './zh-cn/dev/style-guide/obsidian.mdx';
// 英文变体文档（不进入导航，仅通过 id.en 参与 i18n）
import enDemo from './en/demo/demo.mdx';
import enExample from './en/demo/example.mdx';

const MDX_SOURCES_INTERNAL: Record<string, any> = {
  'readme': rootReadme,
  // zh-cn canonical docs
  'demo': zhDemo,
  'example': zhExample,
  'configuration': zhConfig,
  'frontformatter-schema': zhSchema,
  'mdx-component-debug': zhDebug,
  'unified-plan': zhUnified,
  'style-guide': zhStyleGuideReadme,
  'style-guide-obsidian': zhStyleGuideObsidian,
  // english variants
  'demo.en': enDemo,
  'example.en': enExample,
};

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
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'demo',
    label: 'Demo',
    items: [
      { id: 'readme', file: '../README.md', label: 'README' },
      { id: 'demo', file: 'zh-cn/demo/demo.mdx', label: '示例文档' },
      { id: 'example', file: 'zh-cn/demo/example.mdx', label: '第二篇示例' }
    ]
  },
  {
    id: 'dev',
    label: 'Dev',
    items: [
      { id: 'mdx-component-debug', file: 'zh-cn/dev/mdx-component-debug.mdx', label: '组件调试', draft: true },
      { id: 'unified-plan', file: 'zh-cn/dev/unified-plan.mdx', label: '渲染管线设计' },
      {
        type: 'category',
        id: 'style-guide',
        label: 'Style Guide',
        defaultId: 'style-guide',
        items: [
          { id: 'style-guide', file: 'zh-cn/dev/style-guide/readme.mdx', label: '概览' },
          { id: 'style-guide-obsidian', file: 'zh-cn/dev/style-guide/obsidian.mdx', label: 'Obsidian 风格' }
        ]
      },
      { id: 'frontformatter-schema', file: 'zh-cn/dev/frontformatter-schema.mdx', label: 'Frontmatter Schema' },
      { id: 'configuration', file: 'zh-cn/dev/configuration.mdx', label: '配置与使用' }
    ]
  }
];
