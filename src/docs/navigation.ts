import demo from './demo/demo.mdx';
import example from './demo/example.mdx';
// dev 分组文档（之前缺失导致侧边栏空）
import mdxComponentDebug from './dev/mdx-component-debug.mdx';
import unifiedPlan from './dev/unified-plan.mdx';

export interface NavDocItem {
  id: string;          // 文档唯一 ID / slug
  file: string;        // 相对 docs 根路径（用于调试校验）
  label?: string;      // 导航显示名称（可覆盖 frontmatter.title）
  draft?: boolean;     // draft: true 时不出现在导航与列表
}

export interface NavGroup {
  id: string;          // 顶部导航组 ID
  label: string;       // 顶部显示名
  items: NavDocItem[]; // 顺序即显示顺序
}

// MDX 源映射（与 import 名称对应）
export const MDX_SOURCES: Record<string, string | any> = {
  demo,
  example,
  'mdx-component-debug': mdxComponentDebug,
  'unified-plan': unifiedPlan,
};

// 顶部导航分组配置（按数组顺序呈现）
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'demo',
    label: 'Demo',
    items: [
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
    ],
  },
];
