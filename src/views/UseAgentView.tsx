import { ItemView } from 'obsidian';
import React from 'react';
import { createRoot } from 'react-dom/client';

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
      <div style={{ padding: 12 }}>
        <h2>UseAgent 示例占位页</h2>
        <p style={{ opacity: 0.8 }}>这是一个示例侧边页面（继承自 ItemView）。在这里你可以实现 agent 交互、工具条或设置面板。</p>
        <div style={{ marginTop: 12, padding: 8, border: '1px solid var(--background-modifier-border)', borderRadius: 6 }}>
          <strong>占位控件</strong>
          <div style={{ marginTop: 8 }}>暂无功能 — 仅作占位示例。</div>
        </div>
      </div>
    );
  }

  async onClose() {
    if (this.root) this.root.unmount();
  }
}

export default UseAgentView;
