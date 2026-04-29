import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Users, TrendingUp, Plus, ChevronRight, Clock, MoreVertical,
  Calendar, Activity, ArrowUpRight, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const DONUT_COLORS = ["#0056d2", "#00419e", "#e1e7ff"];

const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesCount: 0,
    studentsCount: 0,
    pendingAssignments: 0,
    avgProgress: 0
  });
  
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [donutData, setDonutData] = useState([
    { name: "Yuqori", value: 0 },
    { name: "O'rtacha", value: 0 },
    { name: "Past", value: 0 },
  ]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: 'exact', head: true }).eq("teacher_id", user.id),
        supabase.from("courses").select("id").eq("teacher_id", user.id)
      ]);

      const courseIds = enrollmentsRes.data?.map(c => c.id) || [];
      
      let studentsCount = 0;
      let avgProgress = 0;
      let yuqori = 0, ortacha = 0, past = 0;
      
      if (courseIds.length > 0) {
        const { data: enrolls } = await supabase
          .from("enrollments")
          .select("progress")
          .in("course_id", courseIds);
        
        studentsCount = enrolls?.length || 0;
        
        if (studentsCount > 0) {
          avgProgress = Math.round(enrolls!.reduce((acc, curr) => acc + curr.progress, 0) / studentsCount);
          
          enrolls!.forEach(e => {
            if (e.progress >= 80) yuqori++;
            else if (e.progress >= 40) ortacha++;
            else past++;
          });
        }
      }

      setDonutData([
        { name: "Yuqori", value: yuqori },
        { name: "O'rtacha", value: ortacha },
        { name: "Past", value: past },
      ]);

      // Fetch pending self assessments or test results
      if (courseIds.length > 0) {
        const { data: recentTests } = await supabase
          .from("test_results")
          .select(`
            id, created_at, score,
            profiles(full_name, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(4);
          
        setRecentActivities(recentTests || []);
      }

      setStats({
        coursesCount: coursesRes.count || 0,
        studentsCount,
        pendingAssignments: pendingTasks.length,
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
      <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
  );

  return (
      <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#0056d2] font-semibold text-xs uppercase tracking-wide mb-2">
              <Activity className="h-4 w-4" /> O'qituvchi Paneli
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Xush kelibsiz, {profile?.full_name?.split(' ')[0] || 'Ustoz'}!</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/teacher/courses">
              <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 font-medium rounded-lg h-10 px-6 transition-all">
                <BookOpen className="mr-2 h-4 w-4" /> Barcha kurslar
              </Button>
            </Link>
            <Link to="/teacher/courses">
              <Button className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-lg h-10 px-6 font-medium shadow-sm transition-all">
                <Plus className="mr-2 h-4 w-4" /> Yangi kurs
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Faol kurslar", value: stats.coursesCount, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Jami talabalar", value: stats.studentsCount.toLocaleString(), icon: Users, color: "text-[#0056d2]", bg: "bg-blue-50" },
            { label: "O'rtacha Progress", value: `${stats.avgProgress}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Reyting", value: "4.9", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
          ].map((s, i) => (
            <Card key={i} className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white p-2">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{s.value}</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#0056d2]" /> Tekshirilishi kutilayotganlar
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {pendingTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">
                    Hozircha kutilayotgan topshiriqlar yo'q
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left font-medium text-slate-500 px-6 py-3 uppercase text-xs tracking-wide">Talaba</th>
                          <th className="text-left font-medium text-slate-500 px-6 py-3 uppercase text-xs tracking-wide">Vazifa</th>
                          <th className="text-left font-medium text-slate-500 px-6 py-3 uppercase text-xs tracking-wide">Sana</th>
                          <th className="text-right px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pendingTasks.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-blue-50 text-[#0056d2] font-bold text-xs">{row.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="font-semibold text-slate-900">{row.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">{row.task}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <Calendar className="h-4 w-4" /> {row.date}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" className="text-[#0056d2] font-medium text-xs rounded-lg h-8">
                                Tekshirish <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-6">
              <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#0056d2]" /> So'nggi faoliyat
                  </CardTitle>
                </div>
                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#0056d2] cursor-pointer transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm font-medium py-4">
                    Faoliyat mavjud emas
                  </div>
                ) : (
                  recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={activity.profiles?.avatar_url} />
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">{activity.profiles?.full_name?.[0] || 'T'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{activity.profiles?.full_name || 'Talaba'}</h4>
                          <p className="text-xs text-slate-500">Testni yakunladi: {activity.score}% natija</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-400">{new Date(activity.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">Tezkor amallar</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                <Link to="/teacher/courses">
                  <Button className="w-full justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 h-10 rounded-lg font-medium transition-all mb-3">
                    <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Yangi kurs</span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
                </Link>
                <Link to="/teacher/students">
                  <Button className="w-full justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 h-10 rounded-lg font-medium transition-all">
                    <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Talabalar</span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-6">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-lg font-bold text-slate-900">O'zlashtirish tahlili</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                   {donutData.map((d, i) => (
                     <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide text-center">{d.name}</span>
                        <span className="text-sm font-bold text-slate-900">{d.value}</span>
                     </div>
                   ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
};

export default TeacherDashboard;
