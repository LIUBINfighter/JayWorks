import React, { useState, useEffect, useRef } from 'react';
import { querySearch, getTokens } from '../search/index';

interface SearchBarProps {
  onSelect(id: string, tokens: string[]): void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelect }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{id:string; title:string; description?:string}[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timer.current = window.setTimeout(() => {
      const hits = querySearch(q, 15);
      setResults(hits.map(h => ({ id: h.id, title: h.title, description: h.description })));
      setOpen(true);
    }, 160);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const select = (id: string) => {
    const tokens = getTokens(q).filter(t => t.length >= 2);
    onSelect(id, tokens);
    setOpen(false);
  };

  return (
    <div className="jw-search-box" ref={boxRef}>
      <input
        className="jw-search-input"
        placeholder="搜索..."
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
      />
      {open && results.length > 0 && (
        <ul className="jw-search-result-list">
          {results.map(r => (
            <li key={r.id} onClick={() => select(r.id)}>
              <div className="jw-search-item-title">{r.title}</div>
              {r.description && <div className="jw-search-item-desc">{r.description}</div>}
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && q.trim() && (
        <div className="jw-search-empty">无结果</div>
      )}
    </div>
  );
};
