import { ItemView } from 'obsidian';
import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
// Use combined registry (version + i18n)
import { docsRegistry } from '../docs/combinedRegistry';
import { renderMdxToReact } from '../utils/unifiedMdx';
import { getComponentMap } from '../components/registry';
import { ShellLayout } from '../components/ShellLayout';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { SearchBar } from '../components/SearchBar';
import { highlightTerms, clearHighlights } from '../utils/highlight';
import { NAV_GROUPS, DOC_FILE_PATHS } from '../docs/navigation';
import { LocaleSwitcher } from '../components/LocaleSwitcher';
import { getFooterWidgets } from '../docs/footerWidgets';

class MyItemView extends ItemView {
	root: ReturnType<typeof createRoot> | null = null;
  private removeActiveListener?: () => void;

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

    const update = () => {
      const active = this.app.workspace.getActiveViewOfType(MyItemView);
      if (active === this) document.body.classList.add('jw-docs-hide-statusbar');
      else document.body.classList.remove('jw-docs-hide-statusbar');
    };
    update();
    const off = this.app.workspace.on('active-leaf-change', () => update());
    this.registerEvent(off);
    this.removeActiveListener = () => {
      document.body.classList.remove('jw-docs-hide-statusbar');
    };
  }

	async onClose() {
		if (this.root) {
			this.root.unmount();
		}
    if (this.removeActiveListener) this.removeActiveListener();
    document.body.classList.remove('jw-docs-hide-statusbar');
	}
}

const DocsApp: React.FC = () => {
  const allIds = docsRegistry.getDocIds();
  const firstGroup = NAV_GROUPS[0];
  // 使用 canonicalId 列表本身 already canonical; 直接选第一组内第一篇
  const firstDocId = allIds.find(id => docsRegistry.getDoc(id)?.meta.groupId === firstGroup.id);
  const [currentGroup, setCurrentGroup] = useState<string>(firstGroup.id);
  const [currentId, setCurrentId] = useState<string>(firstDocId || allIds[0]);
  // 跟踪当前激活语言；用于在切换语言时强制触发渲染/重新解析
  const [activeLocale, setActiveLocale] = useState<string>(() => docsRegistry.getActiveLocale());
  const [frontmatter, setFrontmatter] = useState<Record<string, any>>({});
  const [contentEl, setContentEl] = useState<React.ReactElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTokens, setSearchTokens] = useState<string[]>([]);

  useEffect(() => {
    if (!currentId) return;
    setLoading(true); setError(null);
    try {
  const rec = docsRegistry.getDoc(currentId);
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
  }, [currentId, activeLocale]); // locale 变化时重新获取文档（获取对应语言或 fallback）

  // groupDocs 需在 locale 变化后重新计算（list() 本身按 locale 解析）
  const groupDocs = docsRegistry.list().filter(r => r.meta.groupId === currentGroup);

  // 统一的文档选择：如果目标文档属于其它 group，同步切换 group，再设置当前文档
  const selectDoc = (id: string) => {
  const rec = docsRegistry.getDoc(id);
    if (rec) {
      const gid = rec.meta.groupId;
      if (gid && gid !== currentGroup) {
        setCurrentGroup(gid);
      }
    }
    setCurrentId(id);
  };

  // 文档渲染完成后执行高亮（若当前有搜索 tokens）
  useEffect(() => {
    if (!searchTokens.length) return; // 无 tokens 则跳过
    const rootEl = document.querySelector('.jw-docs-content');
    if (!rootEl) return;
    // 延迟一个 tick 确保内容已经挂载
    const t = setTimeout(() => {
      highlightTerms(rootEl as HTMLElement, searchTokens).catch(console.error);
    }, 30);
    return () => clearTimeout(t);
  }, [contentEl, searchTokens]);

  // 非搜索来源的导航（Sidebar/分页）清除高亮
  const navigateWithoutSearch = (id: string) => {
    setSearchTokens([]);
    const rootEl = document.querySelector('.jw-docs-content');
    if (rootEl) { clearHighlights(rootEl as HTMLElement).catch(()=>{}); }
    selectDoc(id);
  };

  // 如果当前文档不在当前组，自动切到该组首篇
  useEffect(() => {
    if (!currentId) return;
    const rec = docsRegistry.getDoc(currentId);
    // 当前文档如果不属于当前组，或者已经解析不到（locale 变化后可能）则回退该组第一篇
    if (!rec || rec.meta.groupId !== currentGroup) {
      const firstInGroup = groupDocs[0];
      if (firstInGroup) setCurrentId(firstInGroup.meta.canonicalId || firstInGroup.meta.id);
    }
  }, [currentGroup, activeLocale]);

  const handleGroupChange = (gid: string) => {
    setCurrentGroup(gid);
    const first = docsRegistry.list().find(r => r.meta.groupId === gid);
    if (first) setCurrentId(first.meta.canonicalId || first.meta.id);
  };

  const currentDoc = currentId ? docsRegistry.getDoc(currentId) : undefined;
  const widgets = getFooterWidgets();
  const ctxFactory = () => ({ doc: currentDoc, groupId: currentGroup, select: navigateWithoutSearch });
  // Footer 顺序调整：最右侧放分页(prev/next)，其左侧放 meta（即：right -> left 的视觉优先级）
  const rightWidgets = widgets.filter(w => (w.align ?? 'left') === 'right').filter(w => !w.when || w.when(ctxFactory()));
  const leftWidgets = widgets.filter(w => (w.align ?? 'left') === 'left').filter(w => !w.when || w.when(ctxFactory()));
  const centerWidgets = widgets.filter(w => w.align === 'center').filter(w => !w.when || w.when(ctxFactory()));
  const footer = (
    <div className="jw-docs-footer-bar">
      <div className="jw-footer-left">
        {leftWidgets.map(w => <React.Fragment key={w.id}>{w.render(ctxFactory())}</React.Fragment>)}
      </div>
      <div className="jw-footer-center">
        {centerWidgets.map(w => <React.Fragment key={w.id}>{w.render(ctxFactory())}</React.Fragment>)}
      </div>
      <div className="jw-footer-right">
        {rightWidgets.map(w => <React.Fragment key={w.id}>{w.render(ctxFactory())}</React.Fragment>)}
      </div>
    </div>
  );

  return (
    <ShellLayout
      sidebar={<Sidebar currentId={currentId} docs={groupDocs} groupId={currentGroup} onSelect={navigateWithoutSearch} />}
      header={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <TopNav currentGroup={currentGroup} onChange={(gid)=>{ setSearchTokens([]); handleGroupChange(gid); }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <LocaleSwitcher onChange={(loc) => {
              // 更新本地 locale 状态，触发依赖 activeLocale 的 effect
              setActiveLocale(loc);
              if (currentId) {
                const rec = docsRegistry.getDoc(currentId);
                if (!rec) {
                  const firstInGroup = docsRegistry.list().find(r => r.meta.groupId === currentGroup);
                  if (firstInGroup) setCurrentId(firstInGroup.meta.id);
                } else {
                  // 使用 canonicalId 保持跨语言稳定。如果 canonicalId 与当前 id 不同，仍然指向逻辑同一文档
                  setCurrentId(rec.meta.canonicalId || rec.meta.id);
                }
              } else {
                // 若无当前文档，回到当前组第一篇
                const firstInGroup = docsRegistry.list().find(r => r.meta.groupId === currentGroup);
                if (firstInGroup) setCurrentId(firstInGroup.meta.id);
              }
            }} />
            <SearchBar onSelect={(id, tokens)=>{ setSearchTokens(tokens); selectDoc(id); }} />
          </div>
        </div>
      }
      footer={footer}
    >
      <ErrorBoundary>
        {loading && <div>加载中...</div>}
        {error && <div style={{ color: 'var(--text-error)' }}>错误: {error}</div>}
        {!loading && !error && (
          <div>
            {/* 路径显示（标题上方） */}
            {useMemo(() => {
              if (!currentId) return null;
              const rec = docsRegistry.getDoc(currentId);
              if (!rec) return null;
              const path = rec.meta.filePath || DOC_FILE_PATHS[rec.meta.canonicalId || rec.meta.id];
              if (!path) return null;
              return <div className="jw-doc-path" style={{ marginBottom:8 }} title={path}><code>{path}</code></div>;
            }, [currentId, activeLocale])}
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
