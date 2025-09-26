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
		this.root.render(<MyReactComponent app={this.app} />);
	}

	async onClose() {
		if (this.root) {
			this.root.unmount();
		}
	}
}

const MyReactComponent: React.FC<{ app: any }> = ({ app }) => {
	const [frontmatter, setFrontmatter] = useState<any>({});
	const [content, setContent] = useState<string>('');

	useEffect(() => {
		const loadMDX = async () => {
			try {
				const file = app.vault.getAbstractFileByPath('src/docs/example.mdx');
				if (file && 'read' in file) {
					const rawContent = await file.read();
					// 简单解析 frontmatter
					const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
					if (frontmatterMatch) {
						const fm = frontmatterMatch[1];
						const body = frontmatterMatch[2];
						const fmLines = fm.split('\n');
						const fmObj: any = {};
						fmLines.forEach((line: string) => {
							const [key, ...value] = line.split(': ');
							if (key) fmObj[key] = value.join(': ').replace(/^["']|["']$/g, '');
						});
						setFrontmatter(fmObj);
						setContent(body);
					} else {
						setContent(rawContent);
					}
				}
			} catch (error) {
				console.error('Failed to load MDX:', error);
			}
		};
		loadMDX();
	}, [app]);

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
