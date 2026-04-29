import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Trophy, Target, Search, 
  RefreshCcw, Activity, Sparkles, Clock, PlayCircle, MoreVertical
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category?: string;
}

interface Test {
  id: string;
  question: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  last_accessed?: string;
  courses?: Course;
}

interface TestResult {
  id: string;
  test_id: string;
  user_id: string;
  is_correct: boolean;
  answer: string;
  created_at: string;
  tests?: Test;
}

const Dashboard = () => {
  const { user, profile, roles } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recentResults, setRecentResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roles && roles.length > 0) {
      if (roles.includes("teacher")) {
        navigate("/teacher", { replace: true });
      } else if (roles.includes("admin")) {
        navigate("/admin", { replace: true });
      }
    }
  }, [roles, navigate]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id);
      
      if (enrollError) throw enrollError;

      if (enrollData && enrollData.length > 0) {
        const courseIds = enrollData.map(e => e.course_id);
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .in("id", courseIds);
        
        const mappedEnrollments = enrollData.map(enroll => ({
          ...enroll,
          courses: coursesData?.find(c => c.id === enroll.course_id)
        })) as Enrollment[];
        setEnrollments(mappedEnrollments);
      }

      // 2. Fetch recent test results
      const { data: resultsData, error: resultsError } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (resultsError) throw resultsError;

      if (resultsData && resultsData.length > 0) {
        const testIds = resultsData.map(r => r.test_id);
        const { data: testsData } = await supabase
          .from("tests")
          .select("id, question")
          .in("id", testIds);
        
        const mappedResults = resultsData.map(res => ({
          ...res,
          tests: testsData?.find(t => t.id === res.test_id)
        })) as TestResult[];
        setRecentResults(mappedResults);
      }
    } catch (error) {
      console.error("Dashboard yuklashda xatolik:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + Number(e.progress), 0) / enrollments.length)
    : 0;

  const enrollmentsContent = enrollments.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
       <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
         <Sparkles className="h-8 w-8 text-slate-400" />
       </div>
       <h3 className="text-xl font-bold text-slate-900 mb-2">Hozircha kurslar yo'q</h3>
       <p className="text-slate-500 mb-6">Yangi kurslarni kashf eting va o'qishni boshlang.</p>
       <Link to="/student/courses">
         <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 font-semibold">
           Katalogni ochish
         </Button>
       </Link>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col bg-white">
          <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
             {enrollment.courses?.image_url ? (
               <img src={enrollment.courses.image_url} alt={enrollment.courses.title} className="absolute inset-0 w-full h-full object-cover" />
             ) : (
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-40" />
             )}
             <Badge className="absolute top-4 left-4 bg-white/90 text-indigo-600 hover:bg-white border-none font-bold rounded-full">
               {enrollment.courses?.category || "Fan"}
             </Badge>
          </div>
          
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-slate-900 line-clamp-2 pr-4 group-hover:text-indigo-600 transition-colors">{enrollment.courses?.title}</h3>
              <button className="text-slate-400 hover:text-slate-600 shrink-0"><MoreVertical className="h-5 w-5" /></button>
            </div>
            
            <div className="mt-auto space-y-4 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">O'zlashtirish</span>
                  <span className="text-indigo-600">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
              </div>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock className="h-3.5 w-3.5" /> Oxirgi faollik: {enrollment.last_accessed ? new Date(enrollment.last_accessed).toLocaleDateString() : "Bugun"}
              </div>
              
              <Link to={`/student/courses/${enrollment.course_id}`}>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold h-11 mt-2 shadow-sm transition-all">
                  <PlayCircle className="mr-2 h-5 w-5" /> Davom ettirish
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Xush kelibsiz, <span className="text-indigo-600">{profile?.full_name?.split(' ')[0] || "O'quvchi"}!</span>
          </h1>
          <p className="text-slate-600">Sizning o'quv jarayoningiz haqida qisqacha ma'lumotlar.</p>
        </div>
        
        <Button onClick={fetchDashboardData} variant="outline" className="h-11 px-6 rounded-full bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-semibold shadow-sm">
          <RefreshCcw className="h-4 w-4 mr-2" /> Yangilash
        </Button>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden relative">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl" />
              <CardContent className="p-6 relative z-10 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Mening Kurslarim</p>
                  <p className="text-4xl font-bold text-slate-900">{enrollments.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden relative">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full -mr-10 -mt-10 blur-2xl" />
              <CardContent className="p-6 relative z-10 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">O'rtacha Progress</p>
                  <p className="text-4xl font-bold text-slate-900">{avgProgress}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden relative">
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-50 rounded-full -mr-10 -mt-10 blur-2xl" />
              <CardContent className="p-6 relative z-10 flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Test Natijalari</p>
                  <p className="text-4xl font-bold text-slate-900">{recentResults.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mt-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Faol Kurslaringiz</h2>
            <Link to="/student/courses">
              <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold rounded-full px-6">
                Barcha kurslarni ko'rish
              </Button>
            </Link>
          </div>

          {enrollmentsContent}

        </div>
      )}
    </>
  );
};

export default Dashboard;
