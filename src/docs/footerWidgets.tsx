import React from 'react';
import { FooterWidget, FooterWidgetContext } from './types';
import { docRegistry } from './registry';

const widgets: FooterWidget[] = [];

export function registerFooterWidget(w: FooterWidget) {
  widgets.push(w);
  widgets.sort((a,b)=>(a.order ?? 100)-(b.order ?? 100));
}

export function getFooterWidgets(): FooterWidget[] { return widgets.slice(); }

// Prev / Next widget
registerFooterWidget({
  id: 'prev-next',
  order: 10,
  align: 'right',
  render: ({ doc, groupId, select }: FooterWidgetContext) => {
    if (!doc) return null;
    const all = docRegistry.list().filter(d => d.meta.groupId === groupId);
    const idx = all.findIndex(d => d.meta.id === doc.meta.id);
    if (idx === -1) return null;
    const prev = idx > 0 ? all[idx-1] : null;
    const next = idx < all.length - 1 ? all[idx+1] : null;
    if (!prev && !next) return null;
    return (
      <div className="jw-footer-pager">
        {prev && (
          <a href="#" onClick={(e)=>{e.preventDefault();select(prev.meta.id);}} className="jw-footer-pager-item prev">
            <span className="label">Previous</span>
            <span className="title">« {prev.meta.navLabel || prev.meta.title}</span>
          </a>
        )}
        {next && (
          <a href="#" onClick={(e)=>{e.preventDefault();select(next.meta.id);}} className="jw-footer-pager-item next">
            <span className="label">Next</span>
            <span className="title">{next.meta.navLabel || next.meta.title} »</span>
          </a>
        )}
      </div>
    );
  }
});

// Meta info widget (updated + reading time)
registerFooterWidget({
  id: 'meta-info',
  order: 20,
  align: 'right',
  render: ({ doc }: FooterWidgetContext) => {
    if (!doc) return null;
    const text = doc.raw || '';
    const plain = text.replace(/```[\s\S]*?```/g,'');
    const words = plain.replace(/[#>*`\\\-\n\r]/g,' ').split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 500));
    const updated = doc.meta.updated ? new Date(doc.meta.updated).toISOString().slice(0,10) : undefined;
    return (
      <div className="jw-footer-meta" title={`约 ${words} 词`}>
        {updated && <span>更新 {updated}</span>}
        <span style={{marginLeft: updated?8:0}}>阅读 {minutes} 分钟</span>
      </div>
    );
  }
});
