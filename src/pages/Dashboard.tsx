import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, RefreshCcw, Activity, Sparkles, Clock, PlayCircle, MoreVertical,
  ChevronRight, BarChart3, GraduationCap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

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

  useEffect(() => {
    if (roles && roles.length > 0) {
      if (roles.includes("teacher")) {
        navigate("/teacher", { replace: true });
      } else if (roles.includes("admin")) {
        navigate("/admin", { replace: true });
      }
    }
  }, [roles, navigate]);

  const { data: dashboardData, isLoading: loading, refetch: fetchDashboardData } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return { enrollments: [], recentResults: [] };
      const [enrollRes, resultsRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("*, courses(*)")
          .eq("user_id", user.id),
        supabase
          .from("test_results")
          .select("*, tests(id, question)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      if (enrollRes.error) throw enrollRes.error;
      if (resultsRes.error) throw resultsRes.error;

      return {
        enrollments: (enrollRes.data as Enrollment[]) || [],
        recentResults: (resultsRes.data as TestResult[]) || []
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const enrollments = dashboardData?.enrollments || [];
  const recentResults = dashboardData?.recentResults || [];
  const initialLoad = loading && !dashboardData;

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + Number(e.progress), 0) / enrollments.length)
    : 0;

  const enrollmentsContent = enrollments.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
       <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
         <Sparkles className="h-6 w-6 text-slate-400" />
       </div>
       <h3 className="text-lg font-bold text-slate-900 mb-1">Kurslar topilmadi</h3>
       <p className="text-slate-500 mb-6 text-sm">O'rganishni boshlash uchun kursga yoziling.</p>
       <Link to="/student/courses">
         <Button className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-lg px-8 h-11 font-bold transition-all shadow-md shadow-blue-50">
           Kurslar katalogi
         </Button>
       </Link>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="rounded-xl border-slate-200 shadow-none overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all flex flex-col bg-white">
          <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
             <ImageWithFallback 
               src={enrollment.courses?.image_url || undefined} 
               alt={enrollment.courses?.title || "Kurs"} 
               containerClassName="absolute inset-0 w-full h-full"
               className="w-full h-full object-cover"
               fallback={<div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100" />}
             />
          </div>
          
          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-base font-bold text-slate-900 line-clamp-2 pr-4">{enrollment.courses?.title}</h3>
              <button className="text-slate-300 hover:text-slate-600 shrink-0"><MoreVertical className="h-4 w-4" /></button>
            </div>
            
            <div className="mt-auto space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Progress</span>
                  <span className="text-[#0056d2]">{enrollment.progress}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-1.5 bg-slate-100 [&>div]:bg-[#0056d2] rounded-full" />
              </div>
              
              <Link to={`/student/courses/${enrollment.course_id}`}>
                <Button className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white rounded-lg font-bold h-10 transition-all">
                  Davom ettirish
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in pb-12">
      
      {/* Horizontal Compact Stats Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Xush kelibsiz, <span className="text-[#0056d2]">{profile?.full_name?.split(' ')[0] || "O'quvchi"}!</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Sizning o'quv jarayoningiz natijalari.</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:gap-12 lg:gap-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#0056d2] flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Kurslar</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{enrollments.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Progress</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{avgProgress}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Testlar</p>
              <p className="text-xl font-bold text-slate-900 leading-none">{recentResults.length}</p>
            </div>
          </div>

          <div className="hidden sm:block">
            <Button onClick={() => fetchDashboardData()} variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-slate-50 text-slate-400">
               <RefreshCcw className={`h-4 w-4 ${loading && !initialLoad ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faol Kurslaringiz</h2>
          <Link to="/student/courses">
            <Button variant="ghost" className="text-[#0056d2] hover:text-[#00419e] hover:bg-blue-50 font-bold px-4 h-9 text-sm group">
              Barchasi <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {initialLoad && loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : (
          enrollmentsContent
        )}
      </div>
    </div>
  );
};

export default Dashboard;
