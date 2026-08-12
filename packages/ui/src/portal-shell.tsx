import type { ReactNode } from "react";

export type PortalShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export const PortalShell = ({ title, subtitle, children }: PortalShellProps): JSX.Element => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              AI Interview Platform
            </p>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
};
