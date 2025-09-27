import React from 'react';
import { docRegistry } from '../docs/registry';

interface SidebarProps {
  currentId: string;
  onSelect(id: string): void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentId, onSelect }) => {
  const docs = docRegistry.list();
  return (
    <ul className="jw-docs-menu">
      {docs.map(d => (
        <li key={d.meta.id} className={d.meta.id === currentId ? 'active' : ''}>
          <a href="#" onClick={(e) => { e.preventDefault(); onSelect(d.meta.id); }}>
            {d.meta.title}
          </a>
        </li>
      ))}
    </ul>
  );
};
