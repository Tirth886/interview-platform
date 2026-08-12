import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, CalendarCheck, UserCircle } from "lucide-react";
import { cn } from "@shared/ui";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/interviews", label: "Sessions", icon: CalendarCheck, end: false },
  { to: "/profile", label: "Profile", icon: UserCircle, end: false },
] as const;

export const AppLayout = (): JSX.Element => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-white">
        <div className="flex h-16 items-center border-b border-border px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              AI Interview Platform
            </p>
            <p className="text-sm font-semibold text-foreground">Interview Portal</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
