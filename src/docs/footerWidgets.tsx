import React from 'react';
import { FooterWidget, FooterWidgetContext } from './types';
import FooterMeta from '../components/FooterMeta';
import { docsRegistry } from './combinedRegistry';
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
    // 使用 i18n registry 的 canonical 列表，保证顺序与原始导航一致
    const canonicalList = docsRegistry.list(); // 每个 record 代表当前 activeLocale 下的版本
    // 当前 canonicalId（如果不存在则退回 id）
    const currentCanonical = doc.meta.canonicalId || doc.meta.id;
    const idx = canonicalList.findIndex(r => (r.meta.canonicalId || r.meta.id) === currentCanonical);
    if (idx === -1) return null;
    const prev = idx > 0 ? canonicalList[idx - 1] : null;
    const next = idx < canonicalList.length - 1 ? canonicalList[idx + 1] : null;
    const groupLabel = (gid?: string) => gid ? (NAV_GROUPS.find(g=>g.id===gid)?.label || gid) : '';
    if (!prev && !next) return null;
    const toId = (r: any) => r.meta.canonicalId || r.meta.id;
    return (
      <div className="jw-footer-pager">
        {prev && (
          <a
            href="#"
            onClick={(e)=>{e.preventDefault();select(toId(prev));}}
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
            onClick={(e)=>{e.preventDefault();select(toId(next));}}
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
