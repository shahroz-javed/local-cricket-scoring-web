import { Icon } from "@/components/ui/icon";

export function ComingSoon({ title, description }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface p-8 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed">
        <Icon name="construction" className="text-3xl text-primary" />
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-foreground-muted">{description}</p>
    </div>
  );
}
