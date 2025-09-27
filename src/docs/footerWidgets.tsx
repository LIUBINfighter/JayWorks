import React from 'react';
import { FooterWidget, FooterWidgetContext } from './types';
import FooterMeta from '../components/FooterMeta';
import { docRegistry } from './registry';
import { NAV_GROUPS } from './navigation';

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
  render: ({ doc, select }: FooterWidgetContext) => {
    if (!doc) return null;
    // 全局（跨组）顺序列表（registry.list 已按 NAV_GROUPS + 声明顺序返回）
    const globalList = docRegistry.list();
    const gIdx = globalList.findIndex(d => d.meta.id === doc.meta.id);
    if (gIdx === -1) return null;
  const prev = gIdx > 0 ? globalList[gIdx-1] : null;
  const next = gIdx < globalList.length - 1 ? globalList[gIdx+1] : null;
  const groupLabel = (gid?: string) => gid ? (NAV_GROUPS.find(g=>g.id===gid)?.label || gid) : '';
    if (!prev && !next) return null;
    return (
      <div className="jw-footer-pager">
        {prev && (
          <a
            href="#"
            onClick={(e)=>{e.preventDefault();select(prev.meta.id);}}
            className="jw-footer-pager-item prev"
            data-group={prev.meta.groupId}
            title={`属于分组: ${groupLabel(prev.meta.groupId)}`}
          >
            <span className="label">Previous</span>
            <span className="title">« {prev.meta.navLabel || prev.meta.title}</span>
          </a>
        )}
        {next && (
          <a
            href="#"
            onClick={(e)=>{e.preventDefault();select(next.meta.id);}}
            className="jw-footer-pager-item next"
            data-group={next.meta.groupId}
            title={`属于分组: ${groupLabel(next.meta.groupId)}`}
          >
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
