"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/client";
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  Users,
  Image,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/dashboard/blog", label: "博客管理", icon: FileText },
  { href: "/dashboard/projects", label: "项目管理", icon: FolderKanban },
  { href: "/dashboard/users", label: "用户管理", icon: Users },
  { href: "/dashboard/notifications", label: "通知中心", icon: Bell },
];

// 侧边栏菜单项组件
function NavItem({ href, label, icon, isActive, onClick }: {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = icon;
  return (
    <Link
      key={href}
      href={href}
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-purple-500/20 text-purple-400' : 'text-white/60 group-hover:bg-white/5 group-hover:text-white'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`font-medium transition-colors ${isActive ? 'text-purple-400' : 'text-white/60 group-hover:text-white'}`}>
        {label}
      </span>
      {isActive && (
        <div className="ml-auto w-1.5 h-8 bg-purple-400 rounded-l-full" />
      )}
    </Link>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gray-800/50 backdrop-blur-lg border-r border-white/10 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              管理后台
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActive}
                  onClick={() => setSidebarOpen(false)}
                />
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {session?.user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{session?.user?.name}</div>
                  <div className="text-white/40 text-sm truncate">
                    {session?.user?.email}
                  </div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-400">
                      管理员
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-lg border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="text-white lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
                onClick={() => {
                  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
                  window.location.assign(frontendUrl);
                }}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">返回前台</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
