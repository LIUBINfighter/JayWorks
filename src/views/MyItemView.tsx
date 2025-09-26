import { ItemView } from 'obsidian';
import React from 'react';
import { createRoot } from 'react-dom/client';

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

const MyReactComponent = () => {
	return <div>Hello from React!</div>;
};

export default MyItemView;
