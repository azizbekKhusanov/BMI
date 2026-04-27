import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from "recharts";
import { 
  TrendingUp, Users, BookOpen, Award, CheckCircle2, 
  AlertCircle, BarChart3, PieChart as PieChartIcon, 
  Sparkles, Download, Calendar, Filter, Zap, Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

interface CourseReport {
  name: string;
  students: number;
  progress: number;
  completed: number;
}

const TeacherReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseReport[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    avgProgress: 0,
    completionRate: 0,
    totalCourses: 0
  });

  const fetchReportData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: courses } = await supabase.from("courses").select("id, title").eq("teacher_id", user.id);
      
      const reportStats: CourseReport[] = [];
      let totalS = 0;
      let totalP = 0;
      let completedCount = 0;
      let totalE = 0;

      for (const course of courses || []) {
        const { data: enrollments } = await supabase.from("enrollments").select("progress").eq("course_id", course.id);
        const count = enrollments?.length || 0;
        const avgP = count > 0 ? enrollments.reduce((sum, e) => sum + (Number(e.progress) || 0), 0) / count : 0;
        const completed = enrollments?.filter(e => Number(e.progress) >= 90).length || 0;

        reportStats.push({
          name: course.title,
          students: count,
          progress: Math.round(avgP),
          completed: completed
        });

        totalS += count;
        totalP += avgP * count;
        completedCount += completed;
        totalE += count;
      }

      setCourseData(reportStats);
      setSummary({
        totalStudents: totalS,
        avgProgress: totalE > 0 ? Math.round(totalP / totalE) : 0,
        completionRate: totalE > 0 ? Math.round((completedCount / totalE) * 100) : 0,
        totalCourses: courses?.length || 0
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-10 px-6 lg:px-12 space-y-12 animate-fade-in">
        
        {/* Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <BarChart3 className="h-6 w-6" />
                 </div>
                 <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 bg-white">
                    Live Analytics Hub
                 </Badge>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase italic tracking-tight leading-none">
                 Hisobotlar & <span className="text-primary">Statistika</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-lg max-w-2xl leading-relaxed">
                 Kurslaringiz samaradorligi va o'quvchilaringizning o'zlashtirish darajasini chuqur tahlil qiling.
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="h-16 px-8 rounded-[2rem] border-slate-100 bg-white shadow-xl hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest gap-3"
              >
                <Calendar className="h-5 w-5 text-primary" /> Last 30 Days
              </Button>
              <Button className="h-16 px-10 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] transition-all gap-3">
                <Download className="h-5 w-5 text-primary" /> Export Data
              </Button>
           </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "Jami O'quvchilar", value: summary.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
             { label: "O'rtacha Progress", value: `${summary.avgProgress}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
             { label: "Tugallash Rejasi", value: `${summary.completionRate}%`, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5" },
             { label: "Faol Kurslar", value: summary.totalCourses, icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50" }
           ].map((stat, i) => (
             <motion.div key={i} whileHover={{ y: -5 }} className="group">
               <Card className="border-none shadow-xl bg-white rounded-[2.5rem] p-8 relative overflow-hidden group-hover:shadow-2xl transition-all duration-500">
                  <div className={`absolute top-0 right-0 h-24 w-24 ${stat.bg} rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-700`} />
                  <div className="relative z-10 flex flex-col gap-4">
                     <div className={`h-14 w-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-7 w-7" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 italic">{stat.label}</p>
                        <p className="text-4xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</p>
                     </div>
                  </div>
               </Card>
             </motion.div>
           ))}
        </div>

        {/* Advanced Charts Grid */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Detailed Course Enrollment */}
          <Card className="border-none shadow-2xl bg-white rounded-[4rem] p-10 overflow-hidden relative">
            <div className="flex flex-col gap-2 mb-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-4">
                     <Users className="h-6 w-6 text-blue-500" /> Kurslar Qiziqishi
                  </h3>
                  <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 text-[9px] font-black uppercase">Live Data</Badge>
               </div>
               <p className="text-slate-400 font-medium italic text-sm">Talabalar soni bo'yicha kurslar taqsimoti.</p>
            </div>
            <div className="h-[400px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-[3rem]" />
              ) : courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={courseData}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} dy={10} hide={courseData.length > 5} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', background: '#1e293b', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorStudents)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                   <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><BarChart3 className="h-10 w-10" /></div>
                   <p className="text-slate-400 font-bold italic">Ma'lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          </Card>

          {/* Academic Mastery Tracking */}
          <Card className="border-none shadow-2xl bg-white rounded-[4rem] p-10 overflow-hidden relative">
            <div className="flex flex-col gap-2 mb-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-4">
                     <Target className="h-6 w-6 text-emerald-500" /> Mastery Darajasi
                  </h3>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 text-[9px] font-black uppercase">KPI Target: 80%</Badge>
               </div>
               <p className="text-slate-400 font-medium italic text-sm">Kurslar bo'yicha o'rtacha o'zlashtirish ko'rsatkichi.</p>
            </div>
            <div className="h-[400px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-[3rem]" />
              ) : courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData} layout="vertical" barGap={20}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={100} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }} />
                    <Bar dataKey="progress" radius={[0, 20, 20, 0]} barSize={24}>
                       {courseData.map((_entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                   <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200"><Zap className="h-10 w-10" /></div>
                   <p className="text-slate-400 font-bold italic">Ma'lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* AI Insight & Recommendations */}
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card className="border-none shadow-2xl bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 h-40 w-40 bg-primary/20 rounded-full blur-3xl -translate-y-20 translate-x-10" />
              <div className="relative z-10 flex gap-8">
                <div className="h-20 w-20 rounded-[2rem] bg-white/10 backdrop-blur-xl flex items-center justify-center text-primary shadow-2xl shrink-0">
                   <Sparkles className="h-10 w-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black uppercase italic tracking-tight">AI Tavsiyasi</h3>
                  <p className="text-slate-400 font-medium italic text-lg leading-relaxed">
                    Sizning <strong>"{courseData.sort((a,b) => b.students - a.students)[0]?.name || '---'}"</strong> kursingiz eng yuqori dinamikaga ega. Ushbu kursning metakognitiv savollarini boshqa kurslarga ham tatbiq etishni maslahat beramiz.
                  </p>
                  <Button variant="link" className="text-primary p-0 h-auto font-black uppercase text-xs tracking-widest gap-2">View Full Insight <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.01 }}>
            <Card className="border-none shadow-2xl bg-white rounded-[3.5rem] p-10 relative overflow-hidden h-full border border-orange-50">
              <div className="relative z-10 flex gap-8">
                <div className="h-20 w-20 rounded-[2rem] bg-orange-50 flex items-center justify-center text-orange-500 shadow-xl shrink-0">
                   <AlertCircle className="h-10 w-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Diqqat Qiling</h3>
                  <p className="text-slate-400 font-medium italic text-lg leading-relaxed">
                    Tugallash ko'rsatkichi 80% dan past bo'lgan kurslar aniqlandi. O'quvchilarga motivatsion bildirishnomalar yuborish orqali faollikni oshirish mumkin.
                  </p>
                  <Button variant="link" className="text-orange-500 p-0 h-auto font-black uppercase text-xs tracking-widest gap-2">Take Action Now <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherReports;

