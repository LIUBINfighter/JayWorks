import React from 'react';

interface ShellLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ sidebar, children, header, footer }) => {
  return (
    <div className="jw-docs-layout">
      {header && <div className="jw-docs-header">{header}</div>}
      <div className="jw-docs-main">
        <aside className="jw-docs-sidebar">{sidebar}</aside>
        <section className="jw-docs-content">{children}</section>
      </div>
      {footer && <div className="jw-docs-footer">{footer}</div>}
    </div>
  );
};
