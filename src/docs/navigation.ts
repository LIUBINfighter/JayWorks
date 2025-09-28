// Static navigation and doc source definitions (refactored to Guide / Reference / Developer structure)
// Root README still as readme (may be used for jumping or referencing, not directly in navigation)
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

// en Guide
import enIntroduction from './en/guide/introduction.mdx';
import enCoreFeatures from './en/guide/core-features.mdx';
import enInteractiveDiagrams from './en/guide/interactive-diagrams.mdx';

// en Reference
import enPluginSettings from './en/reference/plugin-settings.mdx';

// en Developer
import enRenderingPipeline from './en/developer/rendering-pipeline.mdx';
import enNavigationConfig from './en/developer/navigation-config.mdx';
import enFrontmatterSchema from './en/developer/frontmatter-schema.mdx';
import enStyleGuideOverview from './en/developer/style-guide/overview.mdx';
import enStyleGuideObsidian from './en/developer/style-guide/obsidian-theme.mdx';
import enMdxDebugRecord from './en/developer/mdx-debug-record.mdx';

const MDX_SOURCES_INTERNAL: Record<string, any> = {
  // root references
  'readme': rootReadme,
  'readme.en': rootReadmeEn,
  // zh-cn guide
  'introduction': zhIntroduction,
  'core-features': zhCoreFeatures,
  'interactive-diagrams': zhInteractiveDiagrams,
  // zh-cn reference
  'plugin-settings': zhPluginSettings,
  // zh-cn developer
  'rendering-pipeline': zhRenderingPipeline,
  'navigation-config': zhNavigationConfig,
  'frontmatter-schema': zhFrontmatterSchema,
  'style-guide-overview': zhStyleGuideOverview,
  'style-guide-obsidian': zhStyleGuideObsidian,
  'mdx-debug-record': zhMdxDebugRecord,
  // en guide
  'introduction.en': enIntroduction,
  'core-features.en': enCoreFeatures,
  'interactive-diagrams.en': enInteractiveDiagrams,
  // en reference
  'plugin-settings.en': enPluginSettings,
  // en developer
  'rendering-pipeline.en': enRenderingPipeline,
  'navigation-config.en': enNavigationConfig,
  'frontmatter-schema.en': enFrontmatterSchema,
  'style-guide-overview.en': enStyleGuideOverview,
  'style-guide-obsidian.en': enStyleGuideObsidian,
  'mdx-debug-record.en': enMdxDebugRecord,
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
      // zh-cn
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
