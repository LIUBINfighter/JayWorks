import React, { useState, useEffect } from 'react';
import { docsRegistry } from '../docs/combinedRegistry';

interface LocaleSwitcherProps {
  onChange?: (locale: string) => void;
  locales?: string[]; // 可手动覆盖
}

export const LocaleSwitcher: React.FC<LocaleSwitcherProps> = ({ onChange, locales }) => {
  const [active, setActive] = useState<string>(() => docsRegistry.getActiveLocale());
  const list = locales || docsRegistry.listLocales();

  useEffect(() => {
    setActive(docsRegistry.getActiveLocale());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    docsRegistry.setActiveLocale(val);
    setActive(val);
    onChange?.(val);
  };

  return (
    <div className="jw-locale-switcher" title="切换语言">
      <select value={active} onChange={handleChange} className="jw-locale-select">
        {list.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      {active !== docsRegistry.getDefaultLocale() && <span className="jw-locale-badge">{active}</span>}
    </div>
  );
};
