import React, { useState, useMemo } from 'react';
import { DocRecord } from '../docs/types';
import { NAV_GROUPS, NavEntry, NavCategory, NavDocItem } from '../docs/navigation';

interface SidebarProps {
  currentId: string;
  docs: DocRecord[];              // 已扁平化文档（当前组）
  onSelect(id: string): void;
  groupId: string;
}

function isCategory(entry: NavEntry): entry is NavCategory { return (entry as any).type === 'category'; }

export const Sidebar: React.FC<SidebarProps> = ({ currentId, docs, onSelect, groupId }) => {
  // 构建该组的原始导航结构（含分类）
  const group = NAV_GROUPS.find(g => g.id === groupId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    group?.items.forEach(it => { if (isCategory(it)) init[it.id] = !!it.collapsed; });
    return init;
  });

  const toggleCat = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  // 建立索引：既支持物理 id（含语言后缀），也支持 canonicalId
  const docMap = useMemo(() => {
    const m = new Map<string, DocRecord>();
    for (const d of docs) {
      m.set(d.meta.id, d);
      if (d.meta.canonicalId) m.set(d.meta.canonicalId, d);
    }
    return m;
  }, [docs]);

  if (!docs.length) {
    return (
      <div className="jw-docs-sidebar-empty">
        <p style={{ padding: '8px 12px', lineHeight: 1.4 }}>
          该分组暂无可显示文档
          <br />
          <span style={{ opacity: 0.7, fontSize: '12px' }}>（可能全部为 draft 或配置尚未完成）</span>
        </p>
      </div>
    );
  }

  const renderEntry = (entry: NavEntry) => {
    if (isCategory(entry)) {
      const cat = entry as NavCategory;
      if (cat.draft) return null;
      const isCol = collapsed[cat.id];
      const visibleDocs: NavDocItem[] = cat.items.filter(d => !d.draft);
      const onClickCat = (e: React.MouseEvent) => {
        e.preventDefault();
        const targetId = cat.defaultId || visibleDocs[0]?.id;
        if (targetId) onSelect(targetId);
        toggleCat(cat.id);
      };
      return (
        <li key={cat.id} className={'jw-cat ' + (isCol ? 'collapsed' : '')}>
          <a href="#" onClick={onClickCat} className="jw-cat-label">
            <span className="jw-cat-caret">{isCol ? '▸' : '▾'}</span>{cat.label}
          </a>
          {!isCol && (
            <ul className="jw-docs-submenu">
              {visibleDocs.map(d => {
                const rec = docMap.get(d.id);
                if (!rec) return null;
                const active = (rec.meta.canonicalId || rec.meta.id) === currentId;
                return (
                  <li key={rec.meta.id} className={active ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); onSelect(rec.meta.canonicalId || rec.meta.id); }}>
                      {rec.meta.navLabel || rec.meta.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }
    const doc = entry as NavDocItem;
    if (doc.draft) return null;
    const rec = docMap.get(doc.id);
    if (!rec) return null;
    const active = (rec.meta.canonicalId || rec.meta.id) === currentId;
    return (
      <li key={rec.meta.id} className={active ? 'active' : ''}>
        <a href="#" onClick={(e) => { e.preventDefault(); onSelect(rec.meta.canonicalId || rec.meta.id); }}>
          {rec.meta.navLabel || rec.meta.title}
        </a>
      </li>
    );
  };

  return (
    <ul className="jw-docs-menu jw-level-root">
      {group?.items.map(renderEntry)}
    </ul>
  );
};
