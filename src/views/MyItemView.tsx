import { ItemView } from 'obsidian';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import SimpleButton from '../components/SimpleButton';

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

const MyReactComponent: React.FC = () => {
	const [frontmatter, setFrontmatter] = useState<any>({});
	const [content, setContent] = useState<string>('');

	useEffect(() => {
		const rawContent = `---
title: "示例文档"
description: "这是一个使用 MDX 的示例文档"
author: "JayWorks"
date: "2025-09-26"
---

# 欢迎使用 JayWorks 插件

这是一个 MDX 文档示例，展示了如何在 Obsidian 插件中渲染 Markdown 和 React 组件。

## 功能介绍

- 支持 Markdown 语法
- 可以嵌入 React 组件
- 使用 frontmatter 元数据

## 示例组件

下面是一个简单的按钮组件：

<SimpleButton label="点击我" onClick={() => alert('按钮被点击了！')} />

## 更多内容

你可以在这里添加更多 Markdown 内容，包括列表、链接等。

- 项目 1
- 项目 2
- 项目 3

[Obsidian 官网](https://obsidian.md)`;

		// 简单解析 frontmatter
		const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (frontmatterMatch) {
			const fm = frontmatterMatch[1];
			const body = frontmatterMatch[2];
			const fmLines = fm.split('\n');
			const fmObj: any = {};
			fmLines.forEach((line: string) => {
				const [key, ...value] = line.split(': ');
				if (key && value.length > 0) fmObj[key.trim()] = value.join(': ').trim().replace(/^["']|["']$/g, '');
			});
			setFrontmatter(fmObj);
			setContent(body);
		} else {
			setContent(rawContent);
		}
	}, []);

	return (
		<div>
			<h1>{frontmatter.title || '文档'}</h1>
			<p><strong>描述:</strong> {frontmatter.description}</p>
			<p><strong>作者:</strong> {frontmatter.author}</p>
			<p><strong>日期:</strong> {frontmatter.date}</p>
			<div style={{ whiteSpace: 'pre-wrap' }}>{content.replace(/<SimpleButton[^>]*\/>/g, '')}</div>
			<SimpleButton label="点击我" onClick={() => alert('按钮被点击了！')} />
		</div>
	);
};

export default MyItemView;
