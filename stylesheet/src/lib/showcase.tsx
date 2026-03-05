import React from "react";

export function PageTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-12">
      <h1 className="font-display text-[40px] font-bold tracking-tight">
        {children}
      </h1>
      {subtitle && (
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <h2 className="mb-6 border-b border-border pb-3 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function VariantRow({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {label && (
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          {label}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function StateGrid({
  children,
  columns = 4,
}: {
  children: React.ReactNode;
  columns?: number;
}) {
  return (
    <div
      className="mb-6 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

export function StateCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ThemeBlock({
  mode,
  children,
}: {
  mode: "light" | "dark";
  children: React.ReactNode;
}) {
  if (mode === "light") {
    return (
      <div className="rounded-xl bg-background p-12">
        <h2 className="mb-8 font-display text-2xl font-semibold">
          Light Mode
        </h2>
        {children}
      </div>
    );
  }
  return (
    <div
      className="dark rounded-xl p-12"
      style={{ background: "hsl(240 10% 3.9%)" }}
    >
      <h2 className="mb-8 font-display text-2xl font-semibold text-white">
        Dark Mode
      </h2>
      {children}
    </div>
  );
}

export function BreakpointFrame({
  width,
  label,
  children,
}: {
  width: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {label} — {width}px
      </div>
      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ width: `${width}px`, maxWidth: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}
