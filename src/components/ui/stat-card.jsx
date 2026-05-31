import { Icon } from "@/components/ui/icon";
export function StatCard({
  icon,
  label,
  value,
  badge,
  iconClassName,
  rightNode,
}) {
  return (
    <article className="rounded-2xl border border-outline-variant/70 bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="rounded-xl bg-primary-fixed p-2.5">
          <Icon name={icon} className={`text-xl text-primary ${iconClassName ?? ""}`} />
        </div>
        {rightNode ? rightNode : null}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">{label}</p>
      <p className="font-display text-3xl font-bold leading-none mt-1">{value}</p>
      {badge ? (
        <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-secondary">
          {badge}
        </span>
      ) : null}
    </article>
  );
}
