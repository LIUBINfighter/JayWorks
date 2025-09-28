import React from 'react';
// React 17+ JSX runtime functions for rehype-react@8 automatic mode
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import matter from 'gray-matter';
import { renderHighlightedHtml } from './codeHighlight';
// 自定义：代码块转换为 <CodeBlock /> 组件

function rehypeCodeBlockToComponent() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.children)) node.children.forEach((c: any) => visit(c));
      if (node.type === 'element' && node.tagName === 'pre' && Array.isArray(node.children) && node.children.length === 1) {
        const codeEl = node.children[0];
        if (codeEl && codeEl.type === 'element' && codeEl.tagName === 'code') {
          const cls: string = (codeEl.properties && codeEl.properties.className && codeEl.properties.className.join ? codeEl.properties.className.join(' ') : (codeEl.properties?.className || '')) as string;
          const match = /language-([A-Za-z0-9+#_-]+)/.exec(cls || '');
          const lang = match ? match[1] : undefined;
          let codeText = '';
          if (Array.isArray(codeEl.children)) {
            codeText = codeEl.children.map((c: any) => (c.type === 'text' ? c.value : '')).join('');
          }
          // 解析 metastring: remark-rehype 默认不会附带; 未来可通过自定义 tokenizer; 这里尝试从 codeEl.data?.meta 或 codeEl.properties['data-meta'] 获取
          const metaRaw = (codeEl.data && codeEl.data.meta) || (codeEl.properties && (codeEl.properties as any)['data-meta']) || '';
          let highlightLines: number[] | undefined;
          if (metaRaw && /\{.+\}/.test(metaRaw)) {
            const spec = metaRaw.match(/\{([^}]+)\}/);
            if (spec) {
              const ranges = spec[1].split(',').map((s: string) => s.trim()).filter(Boolean);
              const lines: number[] = [];
              for (const r of ranges) {
                const m = r.match(/^(\d+)-(\d+)$/);
                if (m) {
                  const a = parseInt(m[1],10), b = parseInt(m[2],10);
                  if (a <= b) { for (let i=a;i<=b;i++) lines.push(i); }
                } else if (/^\d+$/.test(r)) lines.push(parseInt(r,10));
              }
              if (lines.length) highlightLines = Array.from(new Set(lines)).sort((a,b)=>a-b);
            }
          }
          // 对非 mermaid 代码块静态高亮；mermaid 仍由运行时渲染
          let html: string | undefined;
          if (lang !== 'mermaid') {
            try {
              html = renderHighlightedHtml(codeText, lang, { highlightLines }).html;
            } catch (e) {
              // 失败时忽略，仍走运行时（退化为旧逻辑）
            }
          }
          node.tagName = 'CodeBlock';
          node.children = [];
          node.properties = { code: codeText, lang, meta: metaRaw || undefined, highlightLines, html };
        }
      }
    };
    visit(tree);
  };
}

export interface RenderMdxResult {
  frontmatter: Record<string, any>;
  element: React.ReactElement;
}

export interface RenderOptions {
  components?: Record<string, React.ComponentType<any>>;
  /** Remove / ignore import/export nodes for safety. */
  stripMdxImports?: boolean;
}

/**
 * Convert mdxJsx* nodes produced by remark-mdx into standard HAST element nodes
 * BEFORE rehype-react runs. We only keep literal string/boolean attributes.
 */
function rehypeMdxJsxToElement(): any {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.children)) node.children.forEach(visit);
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const tagName = node.name;
        const props: Record<string, any> = {};
        if (Array.isArray(node.attributes)) {
          for (const attr of node.attributes) {
            if (attr.type === 'mdxJsxAttribute' && typeof attr.name === 'string') {
              if (typeof attr.value === 'string') props[attr.name] = attr.value;
              else if (attr.value == null) props[attr.name] = true;
              // skip expressions for safety
            }
          }
        }
        node.type = 'element';
        node.tagName = tagName;
        node.properties = props;
        delete node.name;
        delete node.attributes;
      }
    };
    visit(tree);
  };
}

/**
 * Create a reusable processor. Keep it minimal; later we can add caching.
 */
export function createMdxProcessor(options: RenderOptions = {}) {
  const { components = {}, stripMdxImports = true } = options;

  // Strip mdxjsEsm (import/export) nodes if required
  const remarkStripMdx: any = () => (tree: any) => {
    if (!stripMdxImports) return;
    if (!Array.isArray(tree.children)) return;
    tree.children = tree.children.filter((n: any) => n.type !== 'mdxjsEsm');
  };

  // 将 fenced code 的 meta 透传: ```ts {1,3-5}
  const remarkCodeMetaToData: any = () => (tree: any) => {
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.children)) node.children.forEach(visit);
      if (node.type === 'code' && node.meta) {
        node.data = node.data || {};
        node.data.meta = node.meta; // 供下游 rehype 使用
      }
    };
    visit(tree);
  };

  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkMdx)
    // GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks etc.
    .use(remarkGfm)
    .use(remarkCodeMetaToData)
    .use(remarkStripMdx as any)
    // Pass through MDX ESM nodes (they're stripped anyway) and then transform mdxJsx* into elements.
    .use(remarkRehype as any, { allowDangerousHtml: false, passThrough: ['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement'] })
  .use(rehypeMdxJsxToElement)
  .use(rehypeCodeBlockToComponent as any)
    .use(rehypeReact as any, {
      jsx,
      jsxs,
      Fragment,
      components,
    });
}

/**
 * Render an MD/MDX string (with optional frontmatter) into a React element and return frontmatter.
 * Uses gray-matter to extract frontmatter before feeding body to unified.
 */
export function renderMdxToReact(raw: string, options: RenderOptions = {}): RenderMdxResult {
  const { data: frontmatter, content } = matter(raw);
  const processor = createMdxProcessor(options);
  const vfile: any = processor.processSync(content);
  return { frontmatter: frontmatter as Record<string, any>, element: vfile.result };
}
