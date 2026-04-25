import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  BookOpen, LayoutDashboard, LogOut, User, Menu, X, GraduationCap, 
  TrendingUp, Settings, ClipboardList, Brain, Activity, MessageSquare,
  BarChart, Users
} from "lucide-react";
import { useState } from "react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    // Exact match
    if (location.pathname === path) return true;
    
    // Parent section match (e.g. /teacher/courses/1 -> /teacher/courses)
    if (path !== "/" && path !== "/dashboard" && path !== "/teacher" && path !== "/admin" && location.pathname.startsWith(path)) return true;
    
    // Special case for Lessons: highlight "Courses" when viewing a lesson
    if (location.pathname.startsWith("/lessons/")) {
      if (isTeacher && path === "/teacher/courses") return true;
      if (!isTeacher && !isAdmin && path === "/courses") return true;
    }
    
    return false;
  };

  const isTeacher = roles.includes("teacher");
  const isAdmin = roles.includes("admin");

  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { group: "🛠 ADMIN PANEL", links: [
          { path: "/admin", label: "TIZIM HOLATI", icon: LayoutDashboard },
          { path: "/admin/users", label: "FOYDALANUVCHILAR", icon: Users },
          { path: "/admin/courses", label: "KURSLAR NAZORATI", icon: BookOpen },
          { path: "/admin/settings", label: "SOZLAMALAR", icon: Settings },
        ]}
      ];
    }
    if (isTeacher) {
      return [
        { group: "🍃 ASOSIY", links: [
          { path: "/teacher", label: "DASHBOARD", icon: LayoutDashboard },
          { path: "/teacher/courses", label: "KURSLAR", icon: BookOpen },
          { path: "/teacher/students", label: "TALABALAR", icon: Users },
          { path: "/teacher/assignments", label: "VAZIFALAR & REFLEKSIYA", icon: ClipboardList },
        ]},
        { group: "🧠 METAKOGNITIV BLOK", links: [
          { path: "/teacher/reports", label: "TAHLIL (ANALYTICS)", icon: BarChart },
          { path: "/teacher/monitoring", label: "PROGRESS MONITORING", icon: Activity },
          { path: "/teacher/self-assessments", label: "SELF-ASSESSMENT NATIJALARI", icon: Brain },
        ]}
      ];
    }
    // Student Links
    return [
      { group: "🍃 ASOSIY", links: [
        { path: "/dashboard", label: "DASHBOARD", icon: LayoutDashboard },
        { path: "/courses", label: "BARCHA KURSLAR", icon: BookOpen },
        { path: "/student/my-courses", label: "MENING KURSLARIM", icon: GraduationCap },
      ]},
      { group: "🧠 METAKOGNITIV BLOK", links: [
        { path: "/student/metacognition", label: "METAKOGNITIV TAHLIL", icon: Brain },
        { path: "/student/results", label: "MENING NATIJALARIM", icon: TrendingUp },
        { path: "/student/notifications", label: "MULOQOT VA XABARLAR", icon: MessageSquare },
      ]}
    ];
  };

  const navLinks = getNavLinks();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 shadow-sm">
      {/* Logo Area */}
      <div className="px-6 py-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1e293b] shadow-xl shadow-slate-200">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <span className="text-2xl font-bold font-serif text-[#1e293b] tracking-tight">MetaEdu</span>
      </div>
      
      {/* Role Label - Dynamic based on roles */}
      <div className="px-7 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
        {isAdmin ? "Admin Paneli" : isTeacher ? "O'qituvchi Paneli" : "Talaba Paneli"}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-4 overflow-y-auto custom-scrollbar">
        {navLinks.map((item, idx) => (
          <div key={idx} className={`${idx > 0 ? "pt-5" : "pt-1"} space-y-2`}>
            <div className="px-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] font-sans">
              {item.group.includes(' ') ? item.group.split(' ')[1] : item.group}
            </div>
            <div className="space-y-0.5">
              {item.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isActive(link.path)
                      ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600 shadow-sm shadow-indigo-100/50"
                      : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600 border-l-4 border-transparent"
                  }`}
                >
                  <link.icon className={`h-4.5 w-4.5 ${isActive(link.path) ? "text-indigo-600" : "text-slate-300"}`} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Area */}
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-[1.25rem] bg-slate-50/80 border border-slate-100/50 transition-all cursor-pointer group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50">
          <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-sm">
            {profile?.full_name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-extrabold text-slate-700 truncate tracking-tight">{profile?.full_name || "Azizbek Xusanov"}</span>
            <span className="text-[10px] text-slate-400 font-bold capitalize">
              {isTeacher ? "Teacher" : isAdmin ? "Admin" : "Student"}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto rounded-xl h-8 w-8 hover:bg-white hover:shadow-sm">
                <Settings className="h-4 w-4 text-slate-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 shadow-2xl p-2">
              <DropdownMenuItem onClick={() => navigate("/profile")} className="rounded-xl py-3 cursor-pointer text-xs font-bold text-slate-600">
                <User className="mr-2 h-4 w-4" /> PROFIL
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2 bg-slate-50" />
              <DropdownMenuItem onClick={signOut} className="rounded-xl py-3 cursor-pointer text-xs font-bold text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" /> CHIQISH
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#fbfcfd]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[265px] flex-col fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[265px] min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md flex items-center justify-between h-16 px-6">
          <Link to={isTeacher ? "/teacher" : "/dashboard"} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e293b]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold font-serif text-[#1e293b]">MetaEdu</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="rounded-xl">
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-72 max-w-[85%] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
