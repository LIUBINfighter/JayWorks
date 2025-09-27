import React from 'react';
import { DocRecord } from '../docs/types';

interface SidebarProps {
  currentId: string;
  docs: DocRecord[];
  onSelect(id: string): void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentId, docs, onSelect }) => {
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
  return (
    <ul className="jw-docs-menu">
      {docs.map(d => (
        <li key={d.meta.id} className={d.meta.id === currentId ? 'active' : ''}>
          <a href="#" onClick={(e) => { e.preventDefault(); onSelect(d.meta.id); }}>
            {d.meta.navLabel || d.meta.title}
          </a>
        </li>
      ))}
    </ul>
  );
};
