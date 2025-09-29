import React from 'react';
import { NAV_GROUPS, getGroupLabel } from '../docs/navigation';

interface TopNavProps {
  currentGroup: string;
  onChange(groupId: string): void;
  locale?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ currentGroup, onChange, locale }) => {
  return (
    <div className="jw-docs-topnav">
      {NAV_GROUPS.map(g => (
        <button
          key={g.id}
          className={g.id === currentGroup ? 'active' : ''}
          onClick={() => onChange(g.id)}
        >
          {getGroupLabel(g.id, locale)}
        </button>
      ))}
    </div>
  );
};
