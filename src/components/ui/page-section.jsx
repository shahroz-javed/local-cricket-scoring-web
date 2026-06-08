
export function PageSection({ title, subtitle, action, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {subtitle ? <p className="text-sm text-foreground-muted">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

