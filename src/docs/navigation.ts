// 静态导航与文档源定义（重构为 Guide / Reference / Developer 三分结构）
// Root README 仍作为 readme（可能用于跳转或引用，不再直接进入导航）
import rootReadme from '../../README.md';
import rootReadmeEn from '../../README.en.md';

// zh-cn Guide
import zhIntroduction from './zh-cn/guide/introduction.mdx';
import zhCoreFeatures from './zh-cn/guide/core-features.mdx';
import zhInteractiveDiagrams from './zh-cn/guide/interactive-diagrams.mdx';

// zh-cn Reference
import zhPluginSettings from './zh-cn/reference/plugin-settings.mdx';

// zh-cn Developer
import zhRenderingPipeline from './zh-cn/developer/rendering-pipeline.mdx';
import zhNavigationConfig from './zh-cn/developer/navigation-config.mdx';
import zhFrontmatterSchema from './zh-cn/developer/frontmatter-schema.mdx';
import zhStyleGuideOverview from './zh-cn/developer/style-guide/overview.mdx';
import zhStyleGuideObsidian from './zh-cn/developer/style-guide/obsidian-theme.mdx';
import zhMdxDebugRecord from './zh-cn/developer/mdx-debug-record.mdx';

// （保留英文 demo 示例作为未来 i18n 占位，不进入导航，仅 id.en 用于映射）
import enDemo from './en/demo/demo.mdx';
import enExample from './en/demo/example.mdx';

const MDX_SOURCES_INTERNAL: Record<string, any> = {
  // root references
  'readme': rootReadme,
  'readme.en': rootReadmeEn,
  // guide
  'introduction': zhIntroduction,
  'core-features': zhCoreFeatures,
  'interactive-diagrams': zhInteractiveDiagrams,
  // reference
  'plugin-settings': zhPluginSettings,
  // developer
  'rendering-pipeline': zhRenderingPipeline,
  'navigation-config': zhNavigationConfig,
  'frontmatter-schema': zhFrontmatterSchema,
  'style-guide-overview': zhStyleGuideOverview,
  'style-guide-obsidian': zhStyleGuideObsidian,
  'mdx-debug-record': zhMdxDebugRecord,
  // english placeholders (not in nav yet)
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
    id: 'guide',
    label: '指南',
    items: [
      { id: 'introduction', file: 'zh-cn/guide/introduction.mdx', label: '介绍' },
      { id: 'core-features', file: 'zh-cn/guide/core-features.mdx', label: '核心功能' },
      { id: 'interactive-diagrams', file: 'zh-cn/guide/interactive-diagrams.mdx', label: '交互式图表' }
    ]
  },
  {
    id: 'reference',
    label: '参考',
    items: [
      { id: 'plugin-settings', file: 'zh-cn/reference/plugin-settings.mdx', label: '插件设置', draft: true }
    ]
  },
  {
    id: 'developer',
    label: '开发者',
    items: [
      { id: 'rendering-pipeline', file: 'zh-cn/developer/rendering-pipeline.mdx', label: '渲染管线' },
      { id: 'navigation-config', file: 'zh-cn/developer/navigation-config.mdx', label: '导航配置' },
      { id: 'frontmatter-schema', file: 'zh-cn/developer/frontmatter-schema.mdx', label: 'Frontmatter 规范' },
      { id: 'mdx-debug-record', file: 'zh-cn/developer/mdx-debug-record.mdx', label: 'MDX 调试记录' },
      {
        type: 'category',
        id: 'style-guide',
        label: '样式指南',
        defaultId: 'style-guide-overview',
        items: [
          { id: 'style-guide-overview', file: 'zh-cn/developer/style-guide/overview.mdx', label: '概览' },
          { id: 'style-guide-obsidian', file: 'zh-cn/developer/style-guide/obsidian-theme.mdx', label: 'Obsidian 风格适配' }
        ]
      }
    ]
  }
];

// 提供文档 id -> 源文件相对路径映射（仅针对已进入导航的 canonical 文档）
export const DOC_FILE_PATHS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const group of NAV_GROUPS) {
    for (const entry of group.items) {
      if ((entry as any).type === 'category') {
        const cat: any = entry;
        if (cat.draft) continue;
        for (const doc of cat.items) {
          if (doc.draft) continue;
          map[doc.id] = doc.file;
        }
      } else {
        const doc: any = entry;
        if (doc.draft) continue;
        map[doc.id] = doc.file;
      }
    }
  }
  return map;
})();
