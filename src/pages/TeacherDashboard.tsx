import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Users, TrendingUp, Plus, ArrowRight, GraduationCap, 
  Activity, Award, AlertCircle, BarChart3, PieChart as PieChartIcon,
  ChevronRight, Calendar, UserCheck, UserMinus, Brain, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    coursesCount: 0,
    studentsCount: 0,
    averageProgress: 0,
    activeToday: 0
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [courseProgressData, setCourseProgressData] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [slowStudents, setSlowStudents] = useState<any[]>([]);
  const [difficultLessons, setDifficultLessons] = useState<any[]>([]);

  const [quickActionType, setQuickActionType] = useState<"lesson" | "test" | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      console.log("Fetching dashboard data for user:", user.id);
      
      // 1. Kurslarni olish
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", user.id);
      
      if (coursesError) throw coursesError;
      
      const myCourses = coursesData || [];
      const courseIds = myCourses.map(c => c.id);
      setCourses(myCourses);
      console.log("Teacher courses found:", myCourses.length);

      if (myCourses.length === 0) {
        setStats({ coursesCount: 0, studentsCount: 0, averageProgress: 0, activeToday: 0 });
        setLoading(false);
        return;
      }

      // 2. Jami o'quvchilar va O'rtacha progress (Kurs ID lari orqali filtrlash)
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("user_id, course_id, progress, created_at")
        .in("course_id", courseIds);

      if (enrollError) console.error("Enrollment error:", enrollError);
      const safeEnrollments = enrollments || [];
      console.log("Enrollments found:", safeEnrollments.length);

      // 3. O'quvchilar profillarini alohida olish (Join xatoligidan qochish uchun)
      const uniqueUserIds = [...new Set(safeEnrollments.map(e => e.user_id))];
      let studentProfiles: any[] = [];
      if (uniqueUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", uniqueUserIds);
        studentProfiles = profilesData || [];
      }

      // Ma'lumotlarni birlashtirish
      const enrichedEnrollments = safeEnrollments.map(e => ({
        ...e,
        profiles: studentProfiles.find(p => p.user_id === e.user_id),
        courses: myCourses.find(c => c.id === e.course_id)
      }));

      const totalStudents = uniqueUserIds.length;
      const avgProg = safeEnrollments.length > 0 
        ? safeEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / safeEnrollments.length 
        : 0;

      // 4. Faollik (Test natijalari orqali)
      const { data: lessonsData } = await supabase.from("lessons").select("id, title").in("course_id", courseIds);
      const myLessons = lessonsData || [];
      const lessonIds = myLessons.map(l => l.id);
      
      let todayCount = 0;
      let dailyActivityData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return { 
          name: date.toLocaleDateString("uz-UZ", { weekday: 'short' }), 
          date: date.toISOString().split('T')[0],
          count: 0 
        };
      });

      if (lessonIds.length > 0) {
        const { data: testsData } = await supabase.from("tests").select("id").in("lesson_id", lessonIds);
        const testIds = (testsData || []).map(t => t.id);
        
        if (testIds.length > 0) {
          const { data: testResults } = await supabase
            .from("test_results")
            .select("created_at")
            .in("test_id", testIds)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          
          const safeResults = testResults || [];
          const today = new Date().toISOString().split('T')[0];
          todayCount = safeResults.filter(r => r.created_at.startsWith(today)).length;

          dailyActivityData = dailyActivityData.map(day => {
            const count = safeResults.filter(r => r.created_at.startsWith(day.date)).length;
            return { ...day, count };
          });
        }
      }

      setStats({
        coursesCount: myCourses.length,
        studentsCount: totalStudents,
        averageProgress: Math.round(avgProg),
        activeToday: todayCount
      });
      setActivityData(dailyActivityData);

      // 5. Kurslar bo'yicha progress tahlili
      const courseGroups = enrichedEnrollments.reduce((acc: any, curr: any) => {
        const title = curr.courses?.title || "Noma'lum Kurs";
        if (!acc[title]) acc[title] = { name: title, progress: 0, count: 0 };
        acc[title].progress += curr.progress || 0;
        acc[title].count += 1;
        return acc;
      }, {});
      setCourseProgressData(Object.values(courseGroups).map((g: any) => ({
        name: g.name,
        progress: Math.round(g.progress / g.count)
      })));

      // 6. Talabalar tahlili (Top va Slow)
      const sortedStudents = [...enrichedEnrollments].sort((a, b) => (b.progress || 0) - (a.progress || 0));
      setTopStudents(sortedStudents.slice(0, 3));
      setSlowStudents([...enrichedEnrollments].sort((a, b) => (a.progress || 0) - (b.progress || 0)).slice(0, 3));

      // 7. Qiyin darslar tahlili
      if (lessonIds.length > 0) {
        const { data: selfAssessments } = await supabase
          .from("self_assessments")
          .select("rating, lesson_id")
          .in("lesson_id", lessonIds);

        const safeAssessments = selfAssessments || [];
        const lessonStats = safeAssessments.reduce((acc: any, curr: any) => {
          const lesson = myLessons.find(l => l.id === curr.lesson_id);
          const title = lesson?.title || "Dars"; 
          if (!acc[title]) acc[title] = { title, totalRating: 0, count: 0 };
          acc[title].totalRating += curr.rating;
          acc[title].count += 1;
          return acc;
        }, {} as any);
        
        const difficult = Object.values(lessonStats)
          .map((l: any) => ({ title: l.title, avgRating: l.totalRating / l.count }))
          .sort((a, b) => a.avgRating - b.avgRating).slice(0, 3);
        setDifficultLessons(difficult);
      }

    } catch (error) {
      console.error("Dashboard critical error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = () => {
    if (!selectedCourseId) return;
    window.location.href = `/teacher/courses?id=${selectedCourseId}&action=${quickActionType}`;
  };

  return (
    <Layout>
      <div className="container pt-8 pb-32 animate-in fade-in duration-1000 flex flex-col gap-12">
        
        {/* Header Section: Welcome & Context */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/20 rounded-full -ml-24 -mb-24 blur-2xl opacity-30" />
           
           <div className="relative z-10 space-y-4">
              <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                 O'qituvchi Kabineti
              </Badge>
              <div className="space-y-2">
                 <h1 className="text-5xl font-black font-serif tracking-tight leading-tight">
                    Xayrli kun, {profile?.full_name?.split(' ')[0] || "Ustoz"}! <span className="inline-block animate-bounce">👋</span>
                 </h1>
                 <p className="text-indigo-100 text-xl max-w-xl opacity-80 font-medium">
                    Talabalaringiz bugun ajoyib natijalar ko'rsatmoqda. Tizimdagi oxirgi tahlillarni ko'rib chiqing.
                 </p>
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-2 gap-4 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex flex-col justify-center">
                 <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">BUGUN FAOL</span>
                 <span className="text-3xl font-black mt-1">{stats.activeToday} ta</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex flex-col justify-center">
                 <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">O'RT. BALL</span>
                 <span className="text-3xl font-black mt-1">4.8 XP</span>
              </div>
           </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
           
           {/* Quick Actions Bar */}
           <div className="lg:col-span-12">
              <div className="flex flex-col md:flex-row items-center gap-6">
                 <h2 className="text-2xl font-black font-serif shrink-0 flex items-center gap-3">
                    <Activity className="h-7 w-7 text-primary" /> TEZKOR HARAKATLAR
                 </h2>
                 <div className="h-px bg-muted flex-1 hidden md:block" />
              </div>
              <div className="grid gap-6 md:grid-cols-3 mt-8">
                 {/* Action 1: Create Course */}
                 <Card className="group relative border-none shadow-xl hover:shadow-2xl transition-all rounded-[2.5rem] bg-indigo-600 border overflow-hidden cursor-pointer">
                    <Link to="/teacher/courses">
                       <CardContent className="p-8 flex items-center justify-between text-white">
                          <div className="space-y-1">
                             <h3 className="text-xl font-black text-white">Yangi Kurs</h3>
                             <p className="text-indigo-100 text-sm opacity-70">O'quv dasturi yaratish</p>
                          </div>
                          <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                             <Plus className="h-8 w-8 text-white" />
                          </div>
                       </CardContent>
                    </Link>
                 </Card>

                 {/* Action 2: Add Lesson */}
                 <Dialog open={quickActionType === "lesson"} onOpenChange={(open) => setQuickActionType(open ? "lesson" : null)}>
                    <DialogTrigger asChild>
                       <Card className="group relative border-none shadow-xl hover:shadow-2xl transition-all rounded-[2.5rem] bg-emerald-600 border overflow-hidden cursor-pointer">
                          <CardContent className="p-8 flex items-center justify-between text-white">
                             <div className="space-y-1">
                                <h3 className="text-xl font-black text-white">Dars Qo'shish</h3>
                                <p className="text-emerald-100 text-sm opacity-70">Video yoki matn</p>
                             </div>
                             <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <Video className="h-8 w-8 text-white" />
                             </div>
                          </CardContent>
                       </Card>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] p-8 max-w-md">
                       <DialogHeader>
                          <DialogTitle className="text-2xl font-black font-serif">Kursni tanlang</DialogTitle>
                       </DialogHeader>
                       <div className="space-y-6 pt-4 text-left">
                          <Select onValueChange={setSelectedCourseId}>
                             <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none text-lg">
                                <SelectValue placeholder="Kursni tanlang" />
                             </SelectTrigger>
                             <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                             </SelectContent>
                          </Select>
                          <Button onClick={handleQuickAction} className="w-full h-14 rounded-2xl text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-xl">Davom etish</Button>
                       </div>
                    </DialogContent>
                 </Dialog>

                 {/* Action 3: Create Test */}
                 <Dialog open={quickActionType === "test"} onOpenChange={(open) => setQuickActionType(open ? "test" : null)}>
                    <DialogTrigger asChild>
                       <Card className="group relative border-none shadow-xl hover:shadow-2xl transition-all rounded-[2.5rem] bg-orange-600 border overflow-hidden cursor-pointer">
                          <CardContent className="p-8 flex items-center justify-between text-white">
                             <div className="space-y-1">
                                <h3 className="text-xl font-black text-white">Vazifa & Tahlil</h3>
                                <p className="text-orange-100 text-sm opacity-70">Bilim va mulohaza nuqtasi</p>
                             </div>
                             <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <Brain className="h-8 w-8 text-white" />
                             </div>
                          </CardContent>
                       </Card>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] p-8 max-w-md">
                       <DialogHeader>
                          <DialogTitle className="text-2xl font-black font-serif">Kursni tanlang</DialogTitle>
                       </DialogHeader>
                       <div className="space-y-6 pt-4 text-left">
                          <Select onValueChange={setSelectedCourseId}>
                             <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-none text-lg">
                                <SelectValue placeholder="Kursni tanlang" />
                             </SelectTrigger>
                             <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                             </SelectContent>
                          </Select>
                          <Button onClick={handleQuickAction} className="w-full h-14 rounded-2xl text-lg font-bold bg-orange-600 hover:bg-orange-700 shadow-xl">Savol qo'shish</Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
           </div>

           {/* Stats Summary (Mini Cards) */}
           <div className="lg:col-span-12 grid gap-6 md:grid-cols-4">
              {[
                { label: "Jami Kurslar", val: stats.coursesCount, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Jami O'quvchilar", val: stats.studentsCount, icon: Users, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
                { label: "O'rtacha Progress", val: `${stats.averageProgress}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Talabalar Faolligi", val: stats.activeToday, icon: Activity, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
              ].map((s, i) => (
                <div key={i} className={`p-6 rounded-[2.5rem] border ${s.bg} ${s.border} shadow-sm flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-300`}>
                   <div className={`h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center ${s.color} group-hover:shadow-md transition-all`}>
                      <s.icon className="h-8 w-8" />
                   </div>
                   <div>
                      <p className="text-[11px] font-black uppercase text-muted-foreground opacity-60 tracking-widest">{s.label}</p>
                      <p className="text-3xl font-black mt-0.5">{loading ? <Skeleton className="h-8 w-12" /> : s.val}</p>
                   </div>
                </div>
              ))}
           </div>

           {/* Analytics Central Hub */}
           <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden border">
                 <CardHeader className="p-10 pb-4">
                    <div className="flex items-center justify-between">
                       <div>
                          <CardTitle className="text-3xl font-black font-serif">O'quvchilar Faollik Dinamikasi</CardTitle>
                          <CardDescription className="text-base">Haftalik test natijalari tahlili</CardDescription>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="px-6 pb-10">
                    <div className="h-[400px] w-full">
                       {loading ? <Skeleton className="h-full w-full rounded-2xl" /> : (
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={activityData} margin={{ top: 20, right: 30, left: 10, bottom: 35 }}>
                                <defs>
                                   <linearGradient id="colorCountHub" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} />
                                <Tooltip 
                                   contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '16px' }}
                                   itemStyle={{ color: '#4f46e5', fontWeight: '900' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorCountHub)" />
                             </AreaChart>
                          </ResponsiveContainer>
                       )}
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Side Stats & Leaderboard */}
           <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden border">
                 <CardHeader className="p-8 pb-2">
                    <CardTitle className="text-xl font-black font-serif flex items-center gap-2">
                       <Award className="h-6 w-6 text-emerald-500" /> ETALON TALABALAR
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-2 space-y-6">
                    {topStudents.map((s, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-muted/10 rounded-[2rem] border transition-all hover:bg-white hover:shadow-xl group">
                          <div className="flex items-center gap-4">
                             <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                   <AvatarImage src={s.profiles.avatar_url} />
                                   <AvatarFallback className="bg-emerald-100 text-emerald-700 font-black">{s.profiles.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-white">
                                   {i + 1}
                                </div>
                             </div>
                             <span className="font-bold text-slate-700">{s.profiles.full_name.split(' ')[0]}</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-none px-3 font-black">{s.progress}%</Badge>
                       </div>
                    ))}
                    <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground font-black text-xs uppercase" asChild>
                       <Link to="/teacher/students">BARCHASINI KO'RISH <ChevronRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                 </CardContent>
              </Card>

              <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 border">
                 <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
                 <Brain className="h-10 w-10 text-indigo-300 mb-4" />
                 <h3 className="text-2xl font-black mb-2">Metakognitiv Tavsiya</h3>
                 <p className="text-indigo-100 opacity-70 leading-relaxed font-medium">
                    Talabalar darsi ko'rishi hafta o'rtasida sustlashdi. Quizlar orqali qiziqishni oshirishni tavsiya etamiz.
                 </p>
              </div>
           </div>

        </div>

        {/* Difficult Lessons: Deeper analytics */}
        <div className="bg-muted/10 p-10 rounded-[4rem] border-2 border-dashed border-muted-foreground/10">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black font-serif">Diqqat Markazidagilar</h2>
                 <p className="text-muted-foreground text-lg">Metakognitiv tahlil asosida darslar reytingi</p>
              </div>
              <Badge className="bg-orange-50 text-orange-600 border-none px-6 py-2 rounded-2xl text-sm font-black">
                 QIYINLIK DARAJASI YUQORI
              </Badge>
           </div>
           
           <div className="grid gap-8 md:grid-cols-3">
              {difficultLessons.map((l, i) => (
                 <Card key={i} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all">
                    <div className="h-2 bg-indigo-500" />
                    <CardContent className="p-8 space-y-6">
                       <h4 className="text-xl font-black truncate">{l.title}</h4>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase text-muted-foreground opacity-50">Tushunarli darajasi</span>
                             <span className="font-black text-indigo-600">{((l.avgRating / 5) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex gap-2">
                             {Array(5).fill(0).map((_, idx) => (
                                <div key={idx} className={`h-2 flex-1 rounded-full ${idx < Math.round(l.avgRating) ? "bg-indigo-500" : "bg-indigo-100"}`} />
                             ))}
                          </div>
                       </div>
                       <Button variant="outline" className="w-full rounded-2xl h-12 font-bold border-2" asChild>
                          <Link to="/teacher/courses">Materialni ko'rish</Link>
                       </Button>
                    </CardContent>
                 </Card>
              ))}
           </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pb-10 border-t pt-10 px-4 opacity-50">
           <p className="text-xs font-black uppercase tracking-widest">Digital Learning Metacog Analysis System v2.0</p>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
