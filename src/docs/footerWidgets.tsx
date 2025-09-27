import React from 'react';
import { FooterWidget, FooterWidgetContext } from './types';
import FooterMeta from '../components/FooterMeta';
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
  order: 9,
  align: 'right',
  render: ({ doc }: FooterWidgetContext) => (
    <FooterMeta doc={doc} />
  )
});
