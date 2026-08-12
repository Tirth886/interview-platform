import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import {
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui";
import { useAuthStore } from "../stores/useAuthStore";
import { useAppState } from "../stores/useAppState";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/candidates", label: "Candidates", icon: Users, end: false },
  { to: "/app/interviews", label: "Interviews", icon: CalendarCheck, end: false },
  { to: "/app/analytics", label: "Analytics", icon: BarChart2, end: false },
  { to: "/app/settings", label: "Settings", icon: Settings, end: false },
] as const;

export const AppLayout = (): JSX.Element => {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const { isSidebarCollapsed, toggleSidebar } = useAppState();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isAdmin = session?.user.role === "admin";
  const visibleNavItems = navItems.filter((item) => item.to !== "/app/settings" || isAdmin);

  const handleLogout = (): void => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  const closeMobile = (): void => setIsMobileOpen(false);

  const initials = (session?.user.email ?? "??").slice(0, 2).toUpperCase();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Mobile backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            aria-hidden="true"
            onClick={closeMobile}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-white transition-all duration-200",
            "lg:static lg:z-auto",
            isSidebarCollapsed ? "w-16" : "w-60",
            isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* Brand / toggle row */}
          <div
            className={cn(
              "flex h-16 shrink-0 items-center border-b border-border transition-all",
              isSidebarCollapsed ? "justify-center px-0" : "justify-between px-4",
            )}
          >
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  AI Interview
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  Company Portal
                </p>
              </div>
            )}

            {/* Desktop collapse toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              onClick={closeMobile}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav items */}
          <nav
            className={cn(
              "flex flex-1 flex-col gap-0.5 overflow-y-auto py-4",
              isSidebarCollapsed ? "items-center px-0" : "px-3",
            )}
          >
            {visibleNavItems.map(({ to, label, icon: Icon, end }) => {
              if (isSidebarCollapsed) {
                return (
                  <Tooltip key={to}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={to}
                        end={end}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          cn(
                            "mx-auto grid h-9 w-9 place-items-center rounded-md transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="sr-only">{label}</span>
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Profile / logout section */}
          <div
            className={cn(
              "border-t border-border p-3",
              isSidebarCollapsed ? "flex flex-col items-center gap-2" : "space-y-1",
            )}
          >
            {isSidebarCollapsed ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="img"
                      aria-label={`${session?.user.email} profile`}
                      className="flex h-9 w-9 cursor-default select-none items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                    >
                      {initials}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="space-y-0.5">
                    <p className="text-xs font-medium">{session?.user.company.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user.email}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="mx-auto grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Logout"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Logout</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
                  <div
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {session?.user.company.name ?? "Company"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {session?.user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-foreground">Company Portal</span>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
