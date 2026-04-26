import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Clock, Activity, ArrowRight, Star, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCallback } from "react";

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_published: boolean;
  teacher_name?: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  courses?: Course;
}

const StudentMyCourses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Get enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id);
      
      if (enrollError) throw enrollError;

      if (enrollData && enrollData.length > 0) {
        const courseIds = enrollData.map(e => e.course_id);
        
        // 2. Get courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .in("id", courseIds);
        
        if (coursesError) throw coursesError;

        // 3. Get teacher profiles separately to avoid complex join issues
        const teacherIds = [...new Set(coursesData?.map(c => c.teacher_id) || [])];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", teacherIds);

        const mappedEnrollments = enrollData.map(enroll => {
          const course = coursesData?.find(c => c.id === enroll.course_id);
          const teacher = profilesData?.find(p => p.user_id === course?.teacher_id);
          
          return {
            ...enroll,
            courses: course ? {
              ...course,
              teacher_name: teacher?.full_name || "Noma'lum ustoz"
            } : undefined
          } as Enrollment;
        });

        // Only show courses that are published (or all for debugging if needed)
        setEnrollments(mappedEnrollments.filter(e => e.courses && e.courses.is_published));
      } else {
        setEnrollments([]);
      }
    } catch (err) {
      console.error("MyCourses fetch error:", err);
      toast.error("Kurslarni yuklashda muammo bo'ldi");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section - Vibrant Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-10 lg:p-14 shadow-lg shadow-blue-100">
           <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
              <Sparkles className="w-full h-full text-white" />
           </div>
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                 <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">O'quvchi Paneli</Badge>
                 <h1 className="text-4xl lg:text-5xl font-bold font-serif leading-tight text-white uppercase tracking-tight">
                    Mening <span className="text-blue-100">kurslarim</span>
                 </h1>
                 <p className="text-blue-50 text-sm lg:text-base font-medium leading-relaxed max-w-xl">
                    Siz hozirda o'rganayotgan va tugatgan kurslar tarixi.
                 </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white text-center min-w-[160px]">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Jami kurslar</p>
                 <p className="text-4xl font-bold font-serif">{enrollments.length}</p>
              </div>
           </div>
        </div>

        {loading ? (
          <div className="grid gap-8">
            {[1, 2].map(i => (
              <div key={i} className="h-48 rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-slate-200">
            <CardContent className="space-y-6">
              <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-[#1e293b] uppercase">Kurslar Topilmadi</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Siz hali birorta kursga yozilmagansiz</p>
              </div>
              <Button asChild className="rounded-2xl h-14 px-10 bg-[#1e293b] hover:bg-[#334155] font-black text-[10px] tracking-widest uppercase shadow-lg transition-all">
                <Link to="/courses">Kurslarni Ko'rish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-500 bg-white">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-72 h-52 lg:h-auto overflow-hidden relative">
                    <img 
                      src={enrollment.courses?.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={enrollment.courses?.title} 
                    />
                  </div>
                  <CardContent className="p-8 lg:p-10 flex-1 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Activity className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">O'rganishda</span>
                      </div>
                      <h3 className="text-2xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight uppercase tracking-tight">
                        {enrollment.courses?.title}
                      </h3>
                      {enrollment.courses?.teacher_name && (
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded-full bg-indigo-50 flex items-center justify-center">
                              <GraduationCap className="h-3 w-3 text-indigo-600" />
                           </div>
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{enrollment.courses.teacher_name}</span>
                        </div>
                      )}
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 max-w-2xl">
                        {enrollment.courses?.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kursni o'zlashtirish</p>
                          <p className="text-xs font-black text-indigo-600">{Math.round(enrollment.progress)}%</p>
                        </div>
                        <Progress value={Number(enrollment.progress)} className="h-1.5 bg-slate-50" />
                      </div>
                      <div className="flex items-center justify-end gap-6">
                        <Button asChild className="rounded-2xl h-14 px-8 bg-[#1e293b] hover:bg-[#334155] font-black text-[10px] tracking-widest uppercase shadow-lg transition-all gap-2 group/btn w-full md:w-auto">
                          <Link to={`/courses/${enrollment.course_id}`}>
                            Davom Ettirish <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentMyCourses;
