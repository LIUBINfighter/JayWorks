import React from 'react';
// React 17+ JSX runtime functions for rehype-react@8 automatic mode
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import matter from 'gray-matter';

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
    .use(remarkStripMdx as any)
    // Pass through MDX ESM nodes (they're stripped anyway) and then transform mdxJsx* into elements.
    .use(remarkRehype as any, { allowDangerousHtml: false, passThrough: ['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement'] })
    .use(rehypeMdxJsxToElement)
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
