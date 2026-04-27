import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, BookOpen, GraduationCap, Shield, 
  Settings, Activity, Search, Filter, 
  MoreVertical, CheckCircle2, AlertCircle,
  TrendingUp, Download, Bell, UserPlus,
  Zap, ArrowUpRight, Microscope, Layers
} from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

interface AdminCourse {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
  teacher_id: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, coursesRes, enrollmentsRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("courses").select("*"),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*"),
      ]);

      const profilesWithRoles = (profilesRes.data || []).map((p) => ({
        ...p,
        roles: (rolesRes.data || []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
      })) as AdminUser[];

      setUsers(profilesWithRoles);
      setCourses((coursesRes.data as AdminCourse[]) || []);
      setStats({
        users: profilesRes.data?.length || 0,
        courses: coursesRes.data?.length || 0,
        enrollments: enrollmentsRes.count || 0,
      });
    } catch (err) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("user_roles").insert({ user_id: userId, role: newRole as "admin" | "teacher" | "student" });
      toast.success("Rol muvaffaqiyatli o'zgartirildi");
      fetchData();
    } catch (err) {
      toast.error("Rol o'zgartirishda xatolik");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatPanel = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card className="border-none shadow-[0_30px_60px_rgba(0,0,0,0.02)] bg-white rounded-[3.5rem] p-10 space-y-8 group hover:bg-slate-950 transition-all duration-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
      <div className="flex items-center justify-between relative z-10">
        <div className={`h-16 w-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center ${color} group-hover:bg-white/10 group-hover:rotate-12 transition-all duration-500`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-50 px-4 py-2 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-all">
          <TrendingUp className="h-4 w-4" /> {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic group-hover:text-slate-500 mb-2">{title}</p>
        <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter group-hover:text-white transition-colors">{value}</h3>
        <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest group-hover:text-slate-500">System Monitoring Active</p>
      </div>
    </Card>
  );

  return (
    <Layout>
      <div className="flex flex-col gap-16 animate-fade-in pb-40 max-w-[1700px] mx-auto px-6 lg:px-12">
        
        {/* Cinematic Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 py-10 border-b border-slate-100/50">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge className="bg-slate-950 text-white border-none px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em] italic">System Core v4.2</Badge>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">
                <div className="h-2 w-2 rounded-full bg-emerald-500" /> Live Neural Sync
              </div>
            </div>
            <h1 className="text-6xl md:text-9xl font-black text-slate-950 leading-[0.85] tracking-tighter uppercase italic">
               Platform <br />
               <span className="text-primary italic">Control.</span>
            </h1>
          </div>
          
          <div className="flex flex-col items-end gap-6">
             <div className="flex items-center gap-8 pr-8 border-r border-slate-100">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic mb-1">Active Nodes</p>
                   <p className="text-2xl font-black text-slate-900 italic tracking-tighter">842 <span className="text-emerald-500 text-sm ml-2">Live</span></p>
                </div>
                <div className="flex items-center gap-4">
                   <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary transition-all">
                      <Bell className="h-6 w-6" />
                   </Button>
                   <Avatar className="h-14 w-14 rounded-2xl border-4 border-white shadow-2xl">
                      <AvatarImage src="/admin-avatar.png" />
                      <AvatarFallback className="bg-slate-950 text-white font-black text-xs">AD</AvatarFallback>
                   </Avatar>
                </div>
             </div>
             <div className="flex gap-4">
                <Button variant="outline" className="h-16 px-10 rounded-2xl border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 gap-3">
                   <Download className="h-4 w-4" /> Export Logs
                </Button>
                <Button className="h-16 px-10 rounded-2xl bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-primary transition-all gap-3 group">
                   <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" /> Add User
                </Button>
             </div>
          </div>
        </div>

        {/* Global Statistics Hub */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
           <StatPanel title="Jami Foydalanuvchilar" value={stats.users} icon={Users} trend="+12.5%" color="text-primary" />
           <StatPanel title="Faol Kurslar" value={stats.courses} icon={BookOpen} trend="+4.2%" color="text-blue-500" />
           <StatPanel title="Umumiy Yozilishlar" value={stats.enrollments} icon={GraduationCap} trend="+22.1%" color="text-emerald-500" />
           <StatPanel title="Server Status" value="99.9%" icon={Activity} trend="Stable" color="text-amber-500" />
        </div>

        {/* Dynamic Management Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* User Management Section */}
          <Card className="lg:col-span-8 border-none shadow-[0_50px_100px_rgba(0,0,0,0.03)] bg-white rounded-[5rem] p-16 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-16 opacity-[0.02] pointer-events-none">
               <Shield className="h-96 w-96 text-slate-900" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16 relative z-10">
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase">Foydalanuvchilar Boshqaruvi</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Global Access Control List</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <input type="text" placeholder="Qidiruv..." className="pl-12 pr-6 h-14 w-64 bg-slate-50 rounded-2xl text-[11px] font-bold border-none focus:bg-white focus:shadow-xl transition-all" />
                 </div>
                 <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-slate-100"><Filter className="h-5 w-5 text-slate-400" /></Button>
              </div>
            </div>

            <div className="overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Identity</th>
                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">System Access</th>
                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Node Selection</th>
                    <th className="text-right py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <motion.tr 
                      key={u.id} 
                      whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                      className="group transition-colors"
                    >
                      <td className="py-8 px-4">
                        <div className="flex items-center gap-4">
                           <Avatar className="h-12 w-12 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="bg-slate-100 text-slate-400 font-black uppercase text-[10px]">{u.full_name?.[0]}</AvatarFallback>
                           </Avatar>
                           <div>
                              <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1">{u.full_name || "Noma'lum"}</p>
                              <p className="text-[10px] font-bold text-slate-400 italic">User ID: {u.user_id.slice(0, 8)}...</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-8 px-4">
                        <Badge className={`px-4 py-1.5 rounded-full border-none font-black text-[9px] uppercase tracking-widest shadow-sm ${
                          u.roles?.[0] === 'admin' ? 'bg-rose-500 text-white shadow-rose-200' :
                          u.roles?.[0] === 'teacher' ? 'bg-primary text-white shadow-primary-200' :
                          'bg-emerald-500 text-white shadow-emerald-200'
                        }`}>
                          <Shield className="h-3 w-3 mr-2" /> {u.roles?.[0] || "student"}
                        </Badge>
                      </td>
                      <td className="py-8 px-4">
                        <Select defaultValue={u.roles?.[0] || "student"} onValueChange={(v) => changeRole(u.user_id, v)}>
                          <SelectTrigger className="w-36 h-12 rounded-xl bg-slate-50 border-none font-black text-[10px] uppercase tracking-widest italic group-hover:bg-white group-hover:shadow-lg transition-all">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                            <SelectItem value="student" className="rounded-xl font-bold italic py-3">Talaba</SelectItem>
                            <SelectItem value="teacher" className="rounded-xl font-bold italic py-3">O'qituvchi</SelectItem>
                            <SelectItem value="admin" className="rounded-xl font-bold italic py-3">Admin Panel</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-8 px-4 text-right">
                         <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-slate-950 transition-colors">
                            <MoreVertical className="h-5 w-5" />
                         </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Platform Performance & System Health */}
          <div className="lg:col-span-4 space-y-12">
             <Card className="border-none shadow-[0_50px_100px_rgba(0,0,0,0.03)] bg-slate-950 text-white rounded-[5rem] p-16 flex flex-col items-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32 transition-all duration-[2s] group-hover:bg-primary/30" />
                
                <div className="space-y-4 mb-16 w-full relative z-10">
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none uppercase">Security Node</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">System Integrity Verified</p>
                </div>
                
                <div className="relative h-64 w-64 flex items-center justify-center relative z-10">
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="absolute inset-0 rounded-full border-[10px] border-white/5 border-t-primary shadow-[0_0_50px_rgba(139,92,246,0.3)]" 
                   />
                   <div className="text-center">
                      <p className="text-7xl font-black italic tracking-tighter leading-none uppercase">OK</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-3 italic">Status</p>
                   </div>
                </div>

                <div className="w-full space-y-6 mt-16 relative z-10">
                   {[
                     { label: "SSL Encryption", val: "Active", col: "text-emerald-400" },
                     { label: "Database Sync", val: "Optimal", col: "text-primary" },
                     { label: "AI Neural Hub", val: "Connected", col: "text-blue-400" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/5">
                        <p className="text-[11px] font-black uppercase italic tracking-tighter text-slate-400">{item.label}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${item.col}`}>{item.val}</p>
                     </div>
                   ))}
                </div>
             </Card>

             <Card className="border-none shadow-2xl bg-white rounded-[4rem] p-12 space-y-8">
                <div className="flex items-center gap-6">
                   <div className="h-16 w-16 rounded-[1.5rem] bg-amber-50 text-amber-500 flex items-center justify-center shadow-xl">
                      <AlertCircle className="h-8 w-8" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1">Tizim Bildirishnomasi</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Global Admin Alert</p>
                   </div>
                </div>
                <p className="text-base font-medium text-slate-500 italic leading-relaxed">
                   Platformadagi kurslar soni 50 tadan oshdi. Bazani optimallashtirish va keshni tozalash tavsiya etiladi.
                </p>
                <Button className="w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl gap-4 group">
                   Diagnostikani Boshlash <Zap className="h-4 w-4 group-hover:scale-125 transition-transform" />
                </Button>
             </Card>
          </div>
        </div>

        {/* Global Course Monitoring Table */}
        <Card className="border-none shadow-[0_50px_100px_rgba(0,0,0,0.03)] bg-white rounded-[5rem] p-16">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
              <div className="space-y-4">
                 <h3 className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none uppercase">Kurslar Monitoringi</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Content Delivery Network Health</p>
              </div>
              <div className="flex gap-4">
                 <Button variant="ghost" className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-slate-400 hover:text-slate-900">Nashr qilinganlar</Button>
                 <Button variant="ghost" className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest italic text-slate-400 hover:text-slate-900">Qoralama</Button>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Course Catalog</th>
                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Verification Status</th>
                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Deployment Date</th>
                    <th className="text-right py-6 px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {courses.map((c) => (
                    <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="py-10 px-4">
                         <div className="flex items-center gap-6">
                            <div className="h-16 w-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-md">
                               <img src={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=150&fit=crop`} alt="" className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                            </div>
                            <p className="text-lg font-black text-slate-950 uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">{c.title}</p>
                         </div>
                      </td>
                      <td className="py-10 px-4">
                        <div className="flex items-center gap-3">
                           <div className={`h-2 w-2 rounded-full ${c.is_published ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"}`} />
                           <span className={`text-[10px] font-black uppercase tracking-widest italic ${c.is_published ? "text-emerald-500" : "text-amber-500"}`}>
                             {c.is_published ? "Muvaffaqiyatli Nashr" : "Tekshiruv Kutilmoqda"}
                           </span>
                        </div>
                      </td>
                      <td className="py-10 px-4">
                         <p className="text-sm font-bold text-slate-400 italic">{new Date(c.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </td>
                      <td className="py-10 px-4 text-right">
                         <Button variant="ghost" size="sm" className="h-12 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest italic text-primary hover:bg-primary/5 gap-3">
                            Tahlil <ArrowUpRight className="h-4 w-4" />
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </Card>

        {/* System Logs Footer Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {[
             { title: "Network Load", val: "42%", icon: Zap, color: "text-blue-500" },
             { title: "Memory Allocation", val: "2.4 GB", icon: Microscope, color: "text-violet-500" },
             { title: "Process Nodes", val: "Active", icon: Layers, color: "text-emerald-500" }
           ].map((log, i) => (
             <div key={i} className="flex items-center justify-between p-10 bg-white rounded-[3rem] shadow-xl border border-slate-50 group hover:-translate-y-2 transition-all duration-500">
                <div className="flex items-center gap-6">
                   <div className={`h-14 w-14 rounded-2xl bg-slate-50 ${log.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <log.icon className="h-7 w-7" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">{log.title}</p>
                      <p className="text-2xl font-black text-slate-900 italic tracking-tighter leading-none">{log.val}</p>
                   </div>
                </div>
                <div className="h-10 w-1 bg-slate-50 rounded-full group-hover:bg-primary transition-colors" />
             </div>
           ))}
        </div>

      </div>
    </Layout>
  );
};

export default AdminDashboard;
