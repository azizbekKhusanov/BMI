import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, LayoutDashboard, LogOut, User, Menu, X, GraduationCap, 
  TrendingUp, Bell, FileText, Users, BarChart, Shield, Settings,
  ClipboardList, Brain, Activity, Star, MessageSquare
} from "lucide-react";
import { useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => 
    location.pathname === path || 
    (path !== "/" && path !== "/dashboard" && path !== "/teacher" && path !== "/admin" && location.pathname.startsWith(path));

  const getNavLinks = () => {
    if (roles.includes("admin")) {
      return [
        { path: "/admin", label: "Tizim holati", icon: LayoutDashboard },
        { path: "/admin/users", label: "Foydalanuvchilar", icon: Users },
        { path: "/admin/courses", label: "Kurslar nazorati", icon: BookOpen },
        { path: "/admin/moderation", label: "Moderatsiya", icon: Shield },
        { path: "/admin/settings", label: "Tizim sozlamalari", icon: Settings },
      ];
    }
    if (roles.includes("teacher")) {
      return [
        { group: "📚 ASOSIY", links: [
          { path: "/teacher", label: "Dashboard", icon: LayoutDashboard },
          { path: "/teacher/courses", label: "Kurslar", icon: BookOpen },
          { path: "/teacher/students", label: "Talabalar", icon: Users },
          { path: "/teacher/assignments", label: "Vazifalar & Refleksiya", icon: ClipboardList },
        ]},
        { group: "🧠 METAKOGNITIV BLOK", links: [
          { path: "/teacher/reports", label: "Tahlil (Analytics)", icon: BarChart },
          { path: "/teacher/monitoring", label: "Progress monitoring", icon: Activity },
          { path: "/teacher/self-assessments", label: "Self-assessment natijalari", icon: Brain },
        ]}
      ];
    }
    // O'quvchi
    return [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/courses", label: "Barcha kurslar", icon: BookOpen },
      { path: "/student/my-courses", label: "Mening kurslarim", icon: GraduationCap },
      { path: "/student/results", label: "Mening natijalarim", icon: TrendingUp },
      { path: "/student/notifications", label: "Muloqot va Xabarlar", icon: MessageSquare },
    ];
  };

  const navLinks = getNavLinks();

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-2">
      <div className="px-4 py-5 flex items-center gap-2.5 bg-card">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold font-serif text-foreground tracking-tight">MetaEdu</span>
      </div>
      
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {roles.includes("admin") ? "Admin Paneli" : roles.includes("teacher") ? "O'qituvchi Paneli" : "Talaba Paneli"}
      </div>

      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        {navLinks.map((item, idx) => {
          if ('group' in item) {
            return (
              <div key={idx} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2 border-b border-muted/50 pb-1">
                  {item.group}
                </h4>
                {item.links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black uppercase tracking-tight transition-all duration-300 ${
                      isActive(link.path)
                        ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm"
                        : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border-l-4 border-transparent"
                    }`}
                  >
                    <link.icon className={`h-4 w-4 transition-transform duration-300 ${isActive(link.path) ? "scale-110" : "group-hover:scale-110"}`} />
                    {link.label}
                  </Link>
                ))}
              </div>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-black uppercase tracking-tight transition-all duration-300 ${
                isActive(item.path)
                  ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border-l-4 border-transparent"
              }`}
            >
              <item.icon className={`h-5 w-5 transition-transform duration-300 ${isActive(item.path) ? "scale-110" : "group-hover:scale-110"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex flex-col items-start text-left truncate">
                <span className="text-sm font-medium truncate">{profile?.full_name || "Foydalanuvchi"}</span>
                <span className="text-xs text-muted-foreground capitalize">{roles[0] || "Student"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="mr-2 h-4 w-4" /> Profil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Chiqish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 border-r bg-card shadow-sm">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-serif">MetaEdu</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 max-w-[80%] bg-card h-full flex flex-col shadow-xl">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-2 z-50" 
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
