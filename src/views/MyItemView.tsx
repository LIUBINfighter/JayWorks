import { ItemView } from 'obsidian';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { docRegistry } from '../docs/registry';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';
import { ShellLayout } from '../components/ShellLayout';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { NAV_GROUPS } from '../docs/navigation';
import { getFooterWidgets } from '../docs/footerWidgets';

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
    container.addClass('jw-docs-root-view');
    this.root = createRoot(container);
    this.root.render(<DocsApp />);
  }

	async onClose() {
		if (this.root) {
			this.root.unmount();
		}
	}
}

const DocsApp: React.FC = () => {
  const allIds = docRegistry.getDocIds();
  const firstGroup = NAV_GROUPS[0];
  const firstDocId = allIds.find(id => docRegistry.getDoc(id)?.meta.groupId === firstGroup.id);
  const [currentGroup, setCurrentGroup] = useState<string>(firstGroup.id);
  const [currentId, setCurrentId] = useState<string>(firstDocId || allIds[0]);
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({});
  const [contentEl, setContentEl] = useState<React.ReactElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!currentId) return;
    setLoading(true); setError(null);
    try {
      const rec = docRegistry.getDoc(currentId);
      if (!rec) throw new Error('文档不存在');
      if (rec.status === 'error') throw new Error(rec.error || '解析失败');
      if (rec.compiled) {
        const { frontmatter: fm, element } = rec.compiled;
        const normalized: Record<string, any> = {};
        for (const [k, v] of Object.entries(fm)) {
          if (v instanceof Date) normalized[k] = (v as Date).toISOString().slice(0,10); else if (typeof v === 'object' && v !== null) normalized[k] = JSON.stringify(v); else normalized[k] = v;
        }
        setFrontmatter(normalized);
        setContentEl(element);
      } else if (rec.raw) {
        // 兜底即时编译（正常情况下 registry 已编译）
        const { frontmatter: fm, element } = renderMdxToReact(rec.raw, { components: getComponentMap() });
        const normalized: Record<string, any> = {};
        for (const [k, v] of Object.entries(fm)) {
          if (v instanceof Date) normalized[k] = (v as Date).toISOString().slice(0,10); else if (typeof v === 'object' && v !== null) normalized[k] = JSON.stringify(v); else normalized[k] = v;
        }
        setFrontmatter(normalized);
        setContentEl(element);
      }
    } catch (e: any) {
      console.error(e); setError(e?.message || '渲染失败');
    } finally { setLoading(false); }
  }, [currentId]);

  const groupDocs = docRegistry.list().filter(r => r.meta.groupId === currentGroup);

  // 如果当前文档不在当前组，自动切到该组首篇
  useEffect(() => {
    if (!currentId) return;
    const rec = docRegistry.getDoc(currentId);
    if (rec && rec.meta.groupId !== currentGroup) {
      const firstInGroup = groupDocs[0];
      if (firstInGroup) setCurrentId(firstInGroup.meta.id);
    }
  }, [currentGroup]);

  const handleGroupChange = (gid: string) => {
    setCurrentGroup(gid);
    const first = docRegistry.list().find(r => r.meta.groupId === gid);
    if (first) setCurrentId(first.meta.id);
  };

  const currentDoc = currentId ? docRegistry.getDoc(currentId) : undefined;
  const widgets = getFooterWidgets();
  const ctxFactory = () => ({ doc: currentDoc, groupId: currentGroup, select: setCurrentId });
  const footer = (
    <div className="jw-docs-footer-bar">
      <div className="jw-footer-left">
        {widgets
          .filter(w => (w.align ?? 'left') === 'left')
          .filter(w => !w.when || w.when(ctxFactory()))
          .map(w => <React.Fragment key={w.id}>{w.render(ctxFactory())}</React.Fragment>)}
      </div>
      <div className="jw-footer-center">
        {widgets
          .filter(w => w.align === 'center')
          .filter(w => !w.when || w.when(ctxFactory()))
            .map(w => <React.Fragment key={w.id}>{w.render(ctxFactory())}</React.Fragment>)}
      </div>
      <div className="jw-footer-right">
        {widgets
          .filter(w => (w.align ?? 'left') === 'right')
          .filter(w => !w.when || w.when(ctxFactory()))
          .map(w => <React.Fragment key={w.id}>{w.render(ctxFactory())}</React.Fragment>)}
      </div>
    </div>
  );

  return (
    <ShellLayout
      sidebar={<Sidebar currentId={currentId} docs={groupDocs} groupId={currentGroup} onSelect={setCurrentId} />}
      header={<TopNav currentGroup={currentGroup} onChange={handleGroupChange} />}
      footer={footer}
    >
      <ErrorBoundary>
        {loading && <div>加载中...</div>}
        {error && <div style={{ color: 'var(--text-error)' }}>错误: {error}</div>}
        {!loading && !error && (
          <div>
            <h1>{frontmatter.title || '文档'}</h1>
            {frontmatter.description && <p style={{marginTop:-8,opacity:0.8}}>{frontmatter.description}</p>}
            <div style={{ borderTop: '1px solid var(--background-modifier-border)', marginTop: 12, paddingTop: 12 }}>
              {contentEl}
            </div>
          </div>
        )}
      </ErrorBoundary>
    </ShellLayout>
  );
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error?: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error('MDX Render Error', error, info); }
  render() { if (this.state.hasError) return <div style={{ color: 'var(--text-error)' }}>渲染出现错误: {String(this.state.error?.message || this.state.error)}</div>; return this.props.children; }
}

export default MyItemView;
