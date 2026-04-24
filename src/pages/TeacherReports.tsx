import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { TrendingUp, Users, BookOpen, Award, CheckCircle2, AlertCircle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

const TeacherReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    avgProgress: 0,
    completionRate: 0,
    totalCourses: 0
  });

  useEffect(() => {
    if (user) fetchReportData();
  }, [user]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: courses } = await supabase.from("courses").select("id, title").eq("teacher_id", user?.id);
      
      const reportStats: any[] = [];
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
  };

  return (
    <Layout>
      <div className="container py-8 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight">Hisobotlar va Statistika</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Kurslaringiz va o'quvchilaringizning natijalari tahlili.</p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">Jonli Statistika</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Jami O'quvchilar</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> {summary.totalStudents}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">O'rtacha Progress</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> {summary.avgProgress}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Tugallash Ko'rsatkichi</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-500" /> {summary.completionRate}%
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Jami Kurslar</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-orange-500" /> {summary.totalCourses}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Enrollment Bar Chart */}
          <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm border">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Kurslar bo'yicha Enrollment
              </CardTitle>
              <CardDescription>Har bir kursga bo'lgan qiziqish va yozilganlar soni.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} hide />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                      {courseData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Ma'lumotlar mavjud emas</div>
              )}
            </CardContent>
          </Card>

          {/* Progress Chart */}
          <Card className="border-none shadow-xl bg-card/40 backdrop-blur-sm border">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" /> O'zlashtirish Darajasi (%)
              </CardTitle>
              <CardDescription>O'quvchilarning kurslardagi o'rtacha progressi.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : courseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={100} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="progress" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Ma'lumotlar mavjud emas</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-none shadow-md bg-primary/5">
            <CardContent className="p-6 flex gap-4">
              <Award className="h-10 w-10 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Top Kurs</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sizning <strong>"{courseData.sort((a,b) => b.students - a.students)[0]?.name || '---'}"</strong> kursingiz eng ko'p talabalarga ega.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-orange-50">
            <CardContent className="p-6 flex gap-4">
              <AlertCircle className="h-10 w-10 text-orange-500 shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Diqqat Qiling</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Kurslardagi o'rtacha progressni oshirish uchun test savollarini ko'paytirishni maslahat beramiz.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherReports;

