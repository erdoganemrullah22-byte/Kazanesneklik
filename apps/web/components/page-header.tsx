import type * as React from "react";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {children ? <div className="text-lg text-muted-foreground">{children}</div> : null}
    </header>
  );
}
