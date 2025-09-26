import { ItemView } from 'obsidian';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';

class MyItemView extends ItemView {
	root: ReturnType<typeof createRoot> | null = null;

	getViewType(): string {
		return 'my-item-view';
	}

	getDisplayText(): string {
		return 'My Item View';
	}

	getIcon(): string {
		return 'document';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		this.root = createRoot(container);
		this.root.render(<MyReactComponent />);
	}

	async onClose() {
		if (this.root) {
			this.root.unmount();
		}
	}
}

const demoMdx = `---
title: 组件演示 (Unified)
description: MDX + 受控白名单组件（不执行表达式属性）
author: JayWorks
date: "2025-09-26"
---

# 自定义组件白名单演示

下面展示通过 **remark-mdx → remark-rehype(passThrough) → 自定义转换 → rehype-react** 管线渲染的组件。

<SimpleButton label="点我" />

<OcrPlayground initialText="Hello MDX" />

> 注意：属性仅支持字符串/布尔字面量；\`onClick\` 等表达式被忽略。

---

## 能力说明
- 支持 frontmatter 解析
- 支持普通 Markdown（列表、代码块、强调等）
- 支持受控白名单组件（字符串/布尔 props）
- 暂不支持内联 JS 表达式 / 函数属性

## 后续计划
1. Action 字符串 → 事件处理映射（安全替代表达式）。
2. 受控上下文（OCR 状态 / Notice API 注入）。
3. 组件渲染缓存与性能优化。
4. 限制文档 (mdx-limitations.mdx)。
`;

const MyReactComponent: React.FC = () => {
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({});
  const [contentEl, setContentEl] = useState<React.ReactElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const { frontmatter: fm, element } = renderMdxToReact(demoMdx, { components: getComponentMap() });
      const normalized: Record<string, any> = {};
      for (const [k, v] of Object.entries(fm)) {
        if (v instanceof Date) normalized[k] = (v as Date).toISOString().slice(0,10); else if (typeof v === 'object' && v !== null) normalized[k] = JSON.stringify(v); else normalized[k] = v;
      }
      setFrontmatter(normalized);
      setContentEl(element);
    } catch (e: any) {
      console.error(e); setError(e?.message || '渲染失败');
    } finally { setLoading(false); }
  }, []);

  if (loading) return <div>Loading MDX...</div>;
  if (error) return <div style={{ color: 'var(--text-error)' }}>错误: {error}</div>;

  return (
    <ErrorBoundary>
      <div>
        <h1>{frontmatter.title || '文档'}</h1>
        <p><strong>描述:</strong> {frontmatter.description}</p>
        <p><strong>作者:</strong> {frontmatter.author}</p>
        <p><strong>日期:</strong> {frontmatter.date}</p>
        <div style={{ borderTop: '1px solid var(--background-modifier-border)', marginTop: 12, paddingTop: 12 }}>
          {contentEl}
        </div>
      </div>
    </ErrorBoundary>
  );
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error?: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error('MDX Render Error', error, info); }
  render() { if (this.state.hasError) return <div style={{ color: 'var(--text-error)' }}>渲染出现错误: {String(this.state.error?.message || this.state.error)}</div>; return this.props.children; }
}

export default MyItemView;
