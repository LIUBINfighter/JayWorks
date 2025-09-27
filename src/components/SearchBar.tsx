import React, { useState, useEffect, useRef } from 'react';
import { querySearch, getTokens } from '../search/index';

interface SearchBarProps {
  onSelect(id: string, tokens: string[]): void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelect }) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{id:string; title:string; description?:string; snippet?: string}[]>([]);
  const [active, setActive] = useState<number>(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timer.current = window.setTimeout(() => {
      const hits = querySearch(q, 15);
      setResults(hits.map(h => ({ id: h.id, title: h.title, description: h.description, snippet: h.snippet })));
      setActive(hits.length ? 0 : -1);
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

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' && results.length) { setOpen(true); setActive(0); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => results.length ? (a + 1) % results.length : -1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => results.length ? (a - 1 + results.length) % results.length : -1);
    } else if (e.key === 'Enter') {
      if (active >= 0 && active < results.length) {
        e.preventDefault(); select(results[active].id);
      }
    } else if (e.key === 'Escape') {
      setOpen(false); setActive(-1);
    }
  };

  // active 项自动滚动到可视区域
  useEffect(() => {
    if (!open) return;
    if (active < 0) return;
    const list = boxRef.current?.querySelector('.jw-search-result-list');
    if (!list) return;
    const item = list.children[active] as HTMLElement | undefined;
    if (!item) return;
    const listRect = (list as HTMLElement).getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top < listRect.top) {
      item.scrollIntoView({ block: 'nearest' });
    } else if (itemRect.bottom > listRect.bottom) {
      item.scrollIntoView({ block: 'nearest' });
    }
  }, [active, open]);

  return (
    <div className="jw-search-box" ref={boxRef}>
      <input
        className="jw-search-input"
        placeholder="搜索..."
        value={q}
        onChange={e => setQ(e.target.value)}
        onFocus={() => { if (results.length) setOpen(true); }}
        onKeyDown={handleKey}
      />
      {open && results.length > 0 && (
        <ul className="jw-search-result-list">
          {results.map((r,i) => (
            <li
              key={r.id}
              className={i===active? 'active' : ''}
              onMouseEnter={()=> setActive(i)}
              onClick={() => select(r.id)}
            >
              <div className="jw-search-item-title">{r.title}</div>
              {r.description && <div className="jw-search-item-desc">{r.description}</div>}
              {r.snippet && <div className="jw-search-item-snippet" dangerouslySetInnerHTML={{__html: r.snippet}} />}
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
