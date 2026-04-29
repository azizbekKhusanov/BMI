import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from "recharts";
import { 
  TrendingUp, Users, BookOpen, CheckCircle2, 
  AlertCircle, BarChart3, Sparkles, Download, Calendar, Zap, Target
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLORS = ["#0056d2", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899"];

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
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 space-y-8 pb-20">
        
        {/* Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0056d2] flex items-center justify-center shadow-sm">
                    <BarChart3 className="h-5 w-5" />
                 </div>
                 <Badge className="bg-blue-50 text-[#0056d2] border-none font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded">
                    Jonli Analitika
                 </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                 Hisobotlar & Statistika
              </h1>
              <p className="text-slate-500 font-medium text-sm max-w-xl">
                 Kurslaringiz samaradorligi va o'quvchilaringizning o'zlashtirish darajasini chuqur tahlil qiling.
              </p>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                className="h-10 px-4 rounded-lg bg-white border border-slate-200 shadow-sm font-medium text-sm text-slate-700 gap-2 hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4 text-[#0056d2]" /> Oxirgi 30 kun
              </Button>
              <Button className="h-10 px-6 rounded-lg bg-[#0056d2] text-white font-medium text-sm shadow-sm hover:bg-[#00419e] gap-2">
                <Download className="h-4 w-4" /> Eksport qilish
              </Button>
           </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: "Jami O'quvchilar", value: summary.totalStudents, icon: Users, color: "text-[#0056d2]", bg: "bg-blue-50" },
             { label: "O'rtacha Progress", value: `${summary.avgProgress}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Tugallash darajasi", value: `${summary.completionRate}%`, icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-50" },
             { label: "Faol Kurslar", value: summary.totalCourses, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-50" }
           ].map((stat, i) => (
             <Card key={i} className="border border-slate-200 shadow-sm bg-white rounded-xl p-6 relative overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative z-10 flex flex-col gap-3">
                   <div className={`h-12 w-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
                   </div>
                </div>
             </Card>
           ))}
        </div>

        {/* Advanced Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Detailed Course Enrollment */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-6 overflow-hidden relative">
            <div className="flex flex-col gap-1 mb-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                     <Users className="h-5 w-5 text-[#0056d2]" /> Kurslar Qiziqishi
                  </h3>
                  <Badge className="bg-blue-50 text-[#0056d2] border-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded">Jonli ma'lumotlar</Badge>
               </div>
               <p className="text-slate-500 font-medium text-xs">Talabalar soni bo'yicha kurslar taqsimoti.</p>
            </div>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={courseData}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0056d2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0056d2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontWeight: '500'}} dy={10} hide={courseData.length > 5} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontWeight: '500'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: '#fff', color: '#0f172a' }}
                      itemStyle={{ color: '#0056d2', fontSize: '12px', fontWeight: '600' }}
                    />
                    <Area type="monotone" dataKey="students" stroke="#0056d2" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                   <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><BarChart3 className="h-6 w-6" /></div>
                   <p className="text-slate-500 font-medium text-sm">Ma'lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          </Card>

          {/* Academic Mastery Tracking */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-6 overflow-hidden relative">
            <div className="flex flex-col gap-1 mb-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                     <Target className="h-5 w-5 text-emerald-600" /> Mastery Darajasi
                  </h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded">Maqsadli: 80%</Badge>
               </div>
               <p className="text-slate-500 font-medium text-xs">Kurslar bo'yicha o'rtacha o'zlashtirish ko'rsatkichi.</p>
            </div>
            <div className="h-[300px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData} layout="vertical" barGap={10}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={90} tickLine={false} axisLine={false} tick={{fill: '#64748b', fontWeight: '500'}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={16}>
                       {courseData.map((_entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                   <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><Zap className="h-6 w-6" /></div>
                   <p className="text-slate-500 font-medium text-sm">Ma'lumotlar mavjud emas</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* AI Insight & Recommendations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden h-full">
            <div className="relative z-10 flex gap-6">
              <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center text-blue-400 shrink-0">
                 <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold">AI Tavsiyasi</h3>
                <p className="text-slate-300 font-medium text-sm leading-relaxed">
                  Sizning <strong>"{courseData.sort((a,b) => b.students - a.students)[0]?.name || '---'}"</strong> kursingiz eng yuqori dinamikaga ega. Ushbu kursning metakognitiv savollarini boshqa kurslarga ham tatbiq etishni maslahat beramiz.
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="border border-orange-200 shadow-sm bg-orange-50/50 rounded-xl p-8 relative overflow-hidden h-full">
            <div className="relative z-10 flex gap-6">
              <div className="h-14 w-14 rounded-lg bg-white flex items-center justify-center text-orange-500 shadow-sm border border-orange-100 shrink-0">
                 <AlertCircle className="h-7 w-7" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">Diqqat Qiling</h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  Tugallash ko'rsatkichi past bo'lgan kurslar aniqlandi. O'quvchilarga motivatsion bildirishnomalar yuborish orqali faollikni oshirish mumkin.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
  );
};

export default TeacherReports;
