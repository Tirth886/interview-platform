import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart2,
  GitBranch,
  Bot,
  ListChecks,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Settings,
  GalleryVerticalEnd,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuthStore } from "../stores/useAuthStore";
import { masterNavItems, profileSettingsItems } from "../constants/navigation";

const platformNav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/candidates", label: "Candidates", icon: Users, end: false },
  { to: "/app/interviews", label: "Interviews", icon: CalendarCheck, end: false },
  { to: "/app/analytics", label: "Analytics", icon: BarChart2, end: false },
] as const;

const masterIcons = {
  "hiring-workflow": GitBranch,
  "ai-agent": Bot,
  qa: ListChecks,
} as const;

export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = session?.user.role === "admin";

  const initials = (session?.user.email ?? "??").slice(0, 2).toUpperCase();
  const companyName = session?.user.company.name ?? "Company";

  const closeMobile = (): void => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleLogout = (): void => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{companyName}</span>
                <span className="truncate text-xs">Company Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {platformNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname === item.to ||
                  location.pathname.startsWith(`${item.to}/`);

              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link to={item.to} onClick={closeMobile}>
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Master</SidebarGroupLabel>
            <SidebarMenu>
              {masterNavItems.map((item) => {
                const Icon = masterIcons[item.section];
                const isActive =
                  location.pathname === item.to ||
                  location.pathname.startsWith(`${item.to}/`);

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.to} onClick={closeMobile}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{companyName}</span>
                    <span className="truncate text-xs">{session?.user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{companyName}</span>
                      <span className="truncate text-xs">{session?.user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <>
                    <DropdownMenuGroup>
                      {profileSettingsItems.map((item) => (
                        <DropdownMenuItem
                          key={item.to}
                          onClick={() => {
                            closeMobile();
                            navigate(item.to);
                          }}
                        >
                          {item.to.includes("billing") ? <CreditCard /> : <Settings />}
                          {item.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                  </>
                ) : null}
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
