import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, LayoutDashboard, LogOut, User, Menu, X, GraduationCap, 
  TrendingUp, Settings, ClipboardList, Brain, Activity, MessageSquare,
  BarChart, Users, ChevronRight, Sparkles, ShieldCheck, Zap,
  Search, Bell
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AICoach from "./AICoach";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  roles: string[] | null;
  signOut: () => void;
  authLoading: boolean;
  setMobileOpen: (v: boolean) => void;
}

const SidebarContent = ({ profile, roles, signOut, authLoading, setMobileOpen }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isTeacher = roles?.includes("teacher") || false;
  const isAdmin = roles?.includes("admin") || false;

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    if (path !== "/" && path !== "/student/dashboard" && path !== "/teacher" && path !== "/admin" && location.pathname.startsWith(path)) return true;
    if (location.pathname.startsWith("/lessons/")) {
      if (isTeacher && path === "/teacher/courses") return true;
      if (!isTeacher && !isAdmin && path === "/student/courses") return true;
    }
    return false;
  };

  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { group: "SYSTEM ADMIN", links: [
          { path: "/admin", label: "Tizim Holati", icon: LayoutDashboard },
          { path: "/admin/users", label: "Foydalanuvchilar", icon: Users },
          { path: "/admin/courses", label: "Kurslar Nazorati", icon: BookOpen },
          { path: "/admin/settings", label: "Sozlamalar", icon: Settings },
        ]}
      ];
    }
    if (isTeacher) {
      return [
        { group: "MAIN HUB", links: [
          { path: "/teacher", label: "Dashboard", icon: LayoutDashboard },
          { path: "/teacher/courses", label: "Kurslar", icon: BookOpen },
          { path: "/teacher/students", label: "Talabalar", icon: Users },
          { path: "/teacher/assignments", label: "Vazifalar", icon: ClipboardList },
          { path: "/teacher/messages", label: "Xabarlar", icon: MessageSquare },
        ]},
        { group: "NEURAL ANALYTICS", links: [
          { path: "/teacher/reports", label: "Analytics", icon: BarChart },
          { path: "/teacher/monitoring", label: "Monitoring", icon: Activity },
          { path: "/teacher/self-assessments", label: "Assessments", icon: Brain },
        ]}
      ];
    }
    return [
      { group: "LEARNING HUB", links: [
        { path: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/student/courses", label: "Barcha Kurslar", icon: BookOpen },
        { path: "/student/my-courses", label: "Mening Kurslarim", icon: GraduationCap },
      ]},
      { group: "KNOWLEDGE MATRIX", links: [
        { path: "/student/metacognition", label: "Metakognitiv tahlil", icon: Brain },
        { path: "/student/results", label: "Natijalarim", icon: TrendingUp },
        { path: "/student/notifications", label: "Xabarlar", icon: MessageSquare },
        { path: "/student/settings", label: "Sozlamalar", icon: Settings },
      ]}
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-900">
      {/* Logo Area */}
      <div className="px-6 py-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0056d2] text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">MetaEdu</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar py-2">
        {authLoading ? (
          <div className="space-y-4 px-4">
            <div className="h-4 w-20 bg-slate-100 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-full bg-slate-50 rounded-md animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          navLinks.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                {item.group}
              </div>
              <div className="space-y-1">
                {item.links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                      isActive(link.path)
                        ? "bg-blue-50 text-[#0056d2] border-l-4 border-[#0056d2]"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <link.icon className={`h-5 w-5 ${isActive(link.path) ? "text-[#0056d2]" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Profile Section */}
      <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2 py-3">
           <Avatar className="h-9 w-9 border border-slate-200">
             <AvatarImage src={profile?.avatar_url || ""} />
             <AvatarFallback className="bg-blue-100 text-[#0056d2] font-bold text-xs">
               {profile?.full_name?.[0]?.toUpperCase() || "A"}
             </AvatarFallback>
           </Avatar>
           <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold text-slate-900 truncate">{profile?.full_name || "Foydalanuvchi"}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                 {isTeacher ? "O'qituvchi" : isAdmin ? "Admin" : "Talaba"}
              </span>
           </div>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                   <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                 <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer font-medium">
                    <User className="mr-2 h-4 w-4" /> Mening Profilim
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => navigate(isAdmin ? "/admin/settings" : isTeacher ? "/profile" : "/student/settings")} className="cursor-pointer font-medium">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Xavfsizlik
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={signOut} className="cursor-pointer text-rose-500 focus:text-rose-500 font-bold">
                    <LogOut className="mr-2 h-4 w-4" /> Tizimdan Chiqish
                 </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { profile, roles, signOut, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTeacher = roles?.includes("teacher") || false;
  const isAdmin = roles?.includes("admin") || false;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col fixed inset-y-0 z-50">
        <SidebarContent 
          profile={profile}
          roles={roles}
          signOut={signOut}
          authLoading={authLoading}
          setMobileOpen={setMobileOpen}
        />
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-[260px] min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white"><GraduationCap className="h-5 w-5" /></div>
             <span className="text-lg font-bold">MetaEdu</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="md:hidden fixed inset-0 z-[100] flex">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
                onClick={() => setMobileOpen(false)} 
              />
              <motion.aside 
                initial={{ x: "-100%" }} 
                animate={{ x: 0 }} 
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-[80%] max-w-sm bg-white h-full flex flex-col shadow-2xl"
              >
                <div className="absolute top-4 right-4 z-[110]">
                   <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                      <X className="h-6 w-6" />
                   </Button>
                </div>
                <SidebarContent 
                  profile={profile}
                  roles={roles}
                  signOut={signOut}
                  authLoading={authLoading}
                  setMobileOpen={setMobileOpen}
                />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-x-hidden pt-0 md:pt-4 px-4 md:px-8 pb-10">
          <div className="max-w-7xl mx-auto min-h-full flex flex-col">
            
            {/* Global Desktop Topbar */}
            <div className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">
                {isAdmin ? "ADMIN PORTAL" : isTeacher ? "TEACHER PORTAL" : "STUDENT PORTAL"}
              </div>
              <div className="flex-1 max-w-xl mx-12">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Kurslar, mavzular yoki bilimlar bo'yicha qidirish..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-[#0056d2] focus:bg-white outline-none transition-all font-medium"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-[#0056d2] relative transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900 leading-none mb-1">{profile?.full_name || "Foydalanuvchi"}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isAdmin ? "Administrator" : isTeacher ? "O'qituvchi" : "Talaba"}
                    </div>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-blue-50 text-[#0056d2] font-bold text-xs">
                      {profile?.full_name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
      <AICoach />
    </div>
  );
};

export default Layout;
