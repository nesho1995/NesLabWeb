import type { ReactNode } from 'react';

type Props = {
  title: string;
  lead: string;
  bullets: string[];
  children?: ReactNode;
};

export function ModulePlaceholderPage({ title, lead, bullets, children }: Props) {
  return (
    <div className="pro-card" style={{ maxWidth: 720 }}>
      <p className="pro-topbar__kicker" style={{ margin: 0, marginBottom: 6 }}>
        Modulo en evolucion
      </p>
      <h1 className="pro-hero__title" style={{ margin: 0, fontSize: 24 }}>
        {title}
      </h1>
      <p className="pro-muted" style={{ margin: '12px 0 0' }}>
        {lead}
      </p>
      <ul
        className="pro-muted"
        style={{ margin: '16px 0 0', paddingLeft: 20, lineHeight: 1.55, fontSize: 14 }}
      >
        {bullets.map((b) => (
          <li key={b} style={{ marginBottom: 6 }}>
            {b}
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
