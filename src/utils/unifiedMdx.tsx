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
// 自定义：代码块转换为 <CodeBlock /> 组件

function rehypeCodeBlockToComponent() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node.children)) node.children.forEach((c: any) => visit(c));
      // 寻找 <pre><code class="language-ts">...</code></pre>
      if (node.type === 'element' && node.tagName === 'pre' && Array.isArray(node.children) && node.children.length === 1) {
        const codeEl = node.children[0];
        if (codeEl && codeEl.type === 'element' && codeEl.tagName === 'code') {
          const cls: string = (codeEl.properties && codeEl.properties.className && codeEl.properties.className.join ? codeEl.properties.className.join(' ') : (codeEl.properties?.className || '')) as string;
            const match = /language-([A-Za-z0-9+#_-]+)/.exec(cls || '');
            const lang = match ? match[1] : undefined;
            // 提取纯文本（不处理内联 <span>，当前阶段假设 remark-rehype 未装饰内部）
            let codeText = '';
            if (Array.isArray(codeEl.children)) {
              codeText = codeEl.children.map((c: any) => (c.type === 'text' ? c.value : '')).join('');
            }
            // 替换为 <CodeBlock code="..." lang="..." />
            node.tagName = 'CodeBlock';
            node.children = [];
            node.properties = { code: codeText, lang };
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

  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml'])
    .use(remarkMdx)
    // GitHub Flavored Markdown: tables, task lists, strikethrough, autolinks etc.
    .use(remarkGfm)
    .use(remarkStripMdx as any)
    // Pass through MDX ESM nodes (they're stripped anyway) and then transform mdxJsx* into elements.
    .use(remarkRehype as any, { allowDangerousHtml: false, passThrough: ['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement'] })
    .use(rehypeMdxJsxToElement)
    .use(rehypeCodeBlockToComponent)
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
