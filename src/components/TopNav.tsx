import React from 'react';
import { NAV_GROUPS } from '../docs/navigation';

interface TopNavProps {
  currentGroup: string;
  onChange(groupId: string): void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentGroup, onChange }) => {
  return (
    <div className="jw-docs-topnav">
      {NAV_GROUPS.map(g => (
        <button
          key={g.id}
          className={g.id === currentGroup ? 'active' : ''}
          onClick={() => onChange(g.id)}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
};
