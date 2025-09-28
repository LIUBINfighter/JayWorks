import { ItemView } from 'obsidian';
import React from 'react';
import { createRoot } from 'react-dom/client';
import DomAgentConsole from '../components/DomAgentConsole';

class UseAgentView extends ItemView {
  root: ReturnType<typeof createRoot> | null = null;

  getViewType(): string {
    return 'use-agent-view';
  }

  getDisplayText(): string {
    return 'Use Agent';
  }

  getIcon(): string {
    return 'brain';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.addClass('jw-use-agent-root');
    this.root = createRoot(container);
    this.root.render(
      <div style={{ padding: 8 }}>
  <DomAgentConsole app={this.app} />
      </div>
    );
  }

  async onClose() {
    if (this.root) this.root.unmount();
  }
}

export default UseAgentView;
