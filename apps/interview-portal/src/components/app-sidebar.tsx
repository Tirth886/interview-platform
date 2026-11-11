import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  UserCircle,
  GalleryVerticalEnd,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const platformNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/interviews", label: "Sessions", icon: CalendarCheck, end: false },
  { to: "/profile", label: "Profile", icon: UserCircle, end: false },
] as const;

export function AppSidebar(): JSX.Element {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = (): void => {
    if (isMobile) {
      setOpenMobile(false);
    }
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
                <span className="truncate font-semibold">Interview Portal</span>
                <span className="truncate text-xs">Candidate workspace</span>
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
