import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Users, TrendingUp, Plus, Search, Bell, 
  Star, ChevronRight, CheckCircle2, Clock, MoreVertical,
  Calendar, Info, Activity, ArrowUpRight, GraduationCap, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const DONUT_COLORS = ["#0056d2", "#00419e", "#e1e7ff"];
const DONUT_DATA = [
  { name: "Yuqori", value: 45 },
  { name: "O'rtacha", value: 35 },
  { name: "Past", value: 20 },
];

const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesCount: 0,
    studentsCount: 0,
    pendingAssignments: 0,
    avgProgress: 0
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch actual counts
      const [coursesRes, enrollmentsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: 'exact', head: true }).eq("teacher_id", user.id),
        supabase.from("courses").select("id").eq("teacher_id", user.id)
      ]);

      const courseIds = enrollmentsRes.data?.map(c => c.id) || [];
      
      let studentsCount = 0;
      let avgProgress = 0;
      
      if (courseIds.length > 0) {
        const { data: enrolls } = await supabase
          .from("enrollments")
          .select("progress")
          .in("course_id", courseIds);
        
        studentsCount = enrolls?.length || 0;
        avgProgress = studentsCount > 0 
          ? Math.round(enrolls!.reduce((acc, curr) => acc + curr.progress, 0) / studentsCount) 
          : 0;
      }

      setStats({
        coursesCount: coursesRes.count || 0,
        studentsCount,
        pendingAssignments: 3, // Mocked for now until assignments table is ready
        avgProgress
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return (
      <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
  );


  return (
      <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-10 animate-fade-in pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0056d2] font-black text-[10px] uppercase tracking-[0.2em] mb-2">
              <Activity className="h-3 w-3" /> O'qituvchi Portali
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Xush kelibsiz, {profile?.full_name?.split(' ')[0] || 'Ustoz'}!</h1>
            <p className="text-slate-500 font-medium">Bugun sizning kurslaringizda <span className="text-[#0056d2] font-bold">{stats.studentsCount} ta</span> faol talaba bilim olmoqda.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/teacher/courses">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl px-6 h-12 transition-all">
                <BookOpen className="mr-2 h-4 w-4" /> Barcha kurslar
              </Button>
            </Link>
            <Link to="/teacher/courses">
              <Button className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-blue-100 transition-all">
                <Plus className="mr-2 h-4 w-4" /> Yangi kurs yaratish
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Faol kurslar", value: stats.coursesCount, sub: "Nashr etilgan", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Jami talabalar", value: stats.studentsCount.toLocaleString(), sub: "Platforma a'zolari", icon: Users, color: "text-[#0056d2]", bg: "bg-blue-50" },
            { label: "O'rtacha Progress", value: `${stats.avgProgress}%`, sub: "O'zlashtirish darajasi", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Reyting", value: "4.9", sub: "856 ta fikrlar", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all group bg-white p-2">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`h-14 w-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} transition-transform group-hover:scale-110 duration-500`}>
                      <s.icon className="h-7 w-7" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#0056d2] transition-colors">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-1">{s.value}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color.replace('text', 'bg')} opacity-60`} style={{ width: '70%' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#0056d2]" /> Tekshirilishi kutilayotganlar
                  </CardTitle>
                  <p className="text-sm text-slate-400 font-medium mt-1">Yangi yuborilgan topshiriqlar va hisobotlar</p>
                </div>
                <Badge className="bg-blue-50 text-[#0056d2] border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full">
                  3 ta kutilmoqda
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="text-left font-black text-slate-400 px-8 py-5 uppercase text-[10px] tracking-[0.1em]">Talaba</th>
                        <th className="text-left font-black text-slate-400 px-8 py-5 uppercase text-[10px] tracking-[0.1em]">Vazifa</th>
                        <th className="text-left font-black text-slate-400 px-8 py-5 uppercase text-[10px] tracking-[0.1em]">Sana</th>
                        <th className="text-right px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { name: "Doston Baxtiyorov", task: "Amaliy ish #3", course: "AI ASOSLARI", date: "Bugun, 10:45", status: "Yangi" },
                        { name: "Laylo Rahmonova", task: "Esse: Metakognitsiya", course: "PSIXOLOGIYA", date: "Kecha, 18:20", status: "Kutilmoqda" },
                        { name: "Aziz Toshpulatov", task: "Loyiha hisoboti", course: "DATA SCIENCE", date: "2 kun avval", status: "Kutilmoqda" },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-blue-50 text-[#0056d2] font-black text-xs">{row.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-bold text-slate-900">{row.name}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.course}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-700">{row.task}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-tight">
                              <Calendar className="h-3.5 w-3.5" /> {row.date}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Button variant="ghost" className="text-[#0056d2] hover:text-[#00419e] hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest gap-2 rounded-xl">
                              Tekshirish <ChevronRight className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-slate-50/30 border-t border-slate-50 text-center">
                  <button className="text-[11px] font-black text-slate-400 hover:text-[#0056d2] uppercase tracking-[0.2em] transition-colors">
                    Barcha topshiriqlarni ko'rish
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
              <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#0056d2]" /> So'nggi faoliyat
                  </CardTitle>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#0056d2] cursor-pointer transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {[
                  { name: "Jasur Aliyev", action: "Kognitiv testni yakunladi", time: "5 DAQIQA AVVAL", avatar: "JA", online: true },
                  { name: "Malika Sobirova", action: "2-modul darsini ko'rmoqda", time: "12 DAQIQA AVVAL", avatar: "MS", online: true },
                  { name: "Sardor Karimov", action: "Yangi savol qoldirdi", time: "2 SOAT AVVAL", avatar: "SK", online: false },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-black text-xs">{activity.avatar}</AvatarFallback>
                        </Avatar>
                        {activity.online && <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{activity.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest group-hover:text-[#0056d2] transition-colors">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-none bg-[#0056d2] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="p-8 relative z-10">
                <CardTitle className="text-lg font-black uppercase tracking-widest italic">Tezkor amallar</CardTitle>
                <p className="text-blue-100 text-xs font-medium mt-1">Boshqaruv markazi</p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4 relative z-10">
                <Button className="w-full justify-between bg-white/10 hover:bg-white/20 border-none text-white h-14 rounded-2xl font-bold transition-all">
                  <span className="flex items-center gap-3"><Plus className="h-5 w-5" /> Yangi kurs</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Button>
                <Button className="w-full justify-between bg-white/10 hover:bg-white/20 border-none text-white h-14 rounded-2xl font-bold transition-all">
                  <span className="flex items-center gap-3"><Users className="h-5 w-5" /> Talabalar</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Button>
                
                <div className="mt-8 p-6 bg-black/10 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                  <div className="flex gap-4 items-start">
                    <div className="p-2 bg-white/10 rounded-xl text-blue-200">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-tight">AI Analiz: Talabalar faolligi 12% ga oshdi.</h4>
                      <button className="text-[10px] font-black uppercase tracking-widest text-blue-300 mt-3 hover:text-white transition-colors">Hisobotni ko'rish</button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white p-8">
              <CardHeader className="p-0 mb-8">
                <CardTitle className="text-lg font-black text-slate-900 uppercase italic tracking-tight">O'zlashtirish</CardTitle>
                <p className="text-sm text-slate-400 font-medium mt-1">Natijalar taqsimoti</p>
              </CardHeader>
              <CardContent className="p-0 space-y-8">
                <div className="h-56 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={DONUT_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {DONUT_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900">74%</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O'rtacha</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                   {DONUT_DATA.map((d, i) => (
                     <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50/50">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter text-center leading-none">{d.name}</span>
                        <span className="text-xs font-black text-slate-900">{d.value}%</span>
                     </div>
                   ))}
                </div>

                <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                  <div className="flex gap-3">
                    <Info className="h-4 w-4 text-[#0056d2] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">
                      "O'rtacha natija ko'rsatgan talabalarga qo'shimcha metakognitiv mashqlar tavsiya eting."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default TeacherDashboard;

