// Root README (outside docs/) as first tab doc
import rootReadme from '../../README.md';
import demo from './demo/demo.mdx';
import example from './demo/example.mdx';
import exampleEn from './demo/example.en.mdx';
// dev 分组文档
import mdxComponentDebug from './dev/mdx-component-debug.mdx';
import unifiedPlan from './dev/unified-plan.mdx';
// style-guide 分类文档
import styleGuideReadme from './dev/style-guide/readme.mdx';
import styleGuideObsidian from './dev/style-guide/obsidian.mdx';
// schema 参考文档
import frontmatterSchema from './dev/frontformatter-schema.mdx';
import configuration from './dev/configuration.mdx';
import versioning from './dev/versioning.mdx';

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
export const MDX_SOURCES: Record<string, string | any> = {
  'readme': rootReadme, // root README.md
  demo,
  example,
  'example.en': exampleEn,
  'mdx-component-debug': mdxComponentDebug,
  'unified-plan': unifiedPlan,
  'style-guide': styleGuideReadme,
  'style-guide-obsidian': styleGuideObsidian,
  'frontformatter-schema': frontmatterSchema,
  'configuration': configuration,
  'versioning': versioning,
};

// 顶部导航分组配置（按数组顺序呈现）
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'demo',
    label: 'Demo',
    items: [
      // Insert README as the first document (pseudo file path points to root)
      { id: 'readme', file: '../README.md', label: 'README' },
      { id: 'demo', file: 'demo/demo.mdx', label: '示例文档' },
      { id: 'example', file: 'demo/example.mdx', label: '第二篇示例' },
    ],
  },
  {
    id: 'dev',
    label: 'Dev',
    items: [
      { id: 'mdx-component-debug', file: 'dev/mdx-component-debug.mdx', label: '组件调试', draft: true },
      { id: 'unified-plan', file: 'dev/unified-plan.mdx', label: '渲染管线设计' },
      {
        type: 'category',
        id: 'style-guide',
        label: 'Style Guide',
        defaultId: 'style-guide',
        items: [
          { id: 'style-guide', file: 'dev/style-guide/readme.mdx', label: '概览' },
          { id: 'style-guide-obsidian', file: 'dev/style-guide/obsidian.mdx', label: 'Obsidian 风格' },
        ]
      }
      ,
      { id: 'frontformatter-schema', file: 'dev/frontformatter-schema.mdx', label: 'Frontmatter Schema' }
      ,{ id: 'configuration', file: 'dev/configuration.mdx', label: '配置与使用' }
      ,{ id: 'versioning', file: 'dev/versioning.mdx', label: '版本与别名' }
    ],
  },
];
