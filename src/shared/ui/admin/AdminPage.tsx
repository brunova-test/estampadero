import type { ReactNode } from "react";

export function AdminPage({
  module,
  title,
  description,
  className = "",
  hideHeader = false,
  children,
}: {
  module: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  hideHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`admin-page ${className}`}>
      <div className="admin-page-frame">
        {!hideHeader ? (
          <header className="admin-page-header">
            <div>
              <p className="admin-eyebrow">{module}</p>
              <h1 className="admin-page-title">{title}</h1>
            </div>
            {description ? (
              <p className="admin-page-description">{description}</p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function AdminPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`admin-panel ${className}`}>{children}</section>;
}

export function AdminStat({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`admin-stat ${accent ? "admin-stat--accent" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
