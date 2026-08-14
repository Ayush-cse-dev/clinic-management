export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="page-header-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {actions && <div className="topbar-actions">{actions}</div>}
    </div>
  );
}
