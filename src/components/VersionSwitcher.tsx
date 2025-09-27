import React, { useState, useEffect } from 'react';
import { versionedRegistry } from '../docs/versionedRegistry';

interface VersionSwitcherProps {
  onChange?: (alias: string) => void;
}

/**
 * Simple dropdown to switch active documentation version alias.
 */
export const VersionSwitcher: React.FC<VersionSwitcherProps> = ({ onChange }) => {
  const [active, setActive] = useState<string>(() => versionedRegistry.getActiveAlias());
  const aliases = versionedRegistry.listAliases();
  const aliasMap = versionedRegistry.getAliasMap();

  useEffect(() => {
    // ensure local state sync if external change in future
    setActive(versionedRegistry.getActiveAlias());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    try {
      versionedRegistry.setActiveAlias(val);
      setActive(val);
      onChange?.(val);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="jw-version-switcher" title="切换文档版本">
      <select value={active} onChange={handleChange} className="jw-version-select">
        {aliases.map(a => {
          const snap = aliasMap[a];
          const label = snap ? `${a} (${snap})` : `${a} (N/A)`;
          return <option key={a} value={a}>{label}</option>;
        })}
      </select>
      {active === 'next' && <span className="jw-version-badge beta">Beta</span>}
    </div>
  );
};
