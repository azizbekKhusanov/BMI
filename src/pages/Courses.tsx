import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, Users, GraduationCap, Sparkles, Filter, ArrowRight, Star, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (user) fetchEnrollments();
  }, [user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // 1. Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      if (coursesData && coursesData.length > 0) {
        // 2. Fetch profiles and enrollment counts in parallel
        const teacherIds = [...new Set(coursesData.map(c => c.teacher_id))].filter(Boolean);
        
        const [profilesRes, enrollmentsRes, lessonsRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name").in("user_id", teacherIds),
          supabase.from("enrollments").select("course_id"),
          supabase.from("lessons").select("course_id")
        ]);

        const profiles = profilesRes.data || [];
        const allEnrollments = enrollmentsRes.data || [];
        const allLessons = lessonsRes.data || [];

        const mappedCourses = coursesData.map(course => {
          const studentCount = allEnrollments.filter(e => e.course_id === course.id).length;
          const lessonCount = allLessons.filter(l => l.course_id === course.id).length;
          return {
            ...course,
            studentCount,
            lessonCount,
            teacher: profiles.find(p => p.user_id === course.teacher_id) || { full_name: "MetaEdu Ustoz" }
          };
        });
        
        setCourses(mappedCourses);
      } else {
        setCourses([]);
      }
    } catch (error: any) {
      console.error("Kurslarni yuklashda xatolik:", error);
      setCourses([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase.from("enrollments").select("course_id").eq("user_id", user.id);
    setEnrolledIds(data?.map((e) => e.course_id) || []);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast.error("Iltimos, avval tizimga kiring");
      return;
    }
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId, progress: 0 });
    if (error) {
      toast.error("Kursga yozilishda xatolik");
    } else {
      toast.success("Kursga muvaffaqiyatli yozildingiz!");
      setEnrolledIds([...enrolledIds, courseId]);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Hero Section - Thinner and Vibrant Blue */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 p-10 lg:p-14 shadow-lg shadow-blue-100">
           <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
              <Sparkles className="w-full h-full text-white" />
           </div>
           <div className="relative z-10 max-w-3xl space-y-4">
              <Badge className="bg-white/20 text-white border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Metakognitiv Ta'lim</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold font-serif leading-tight text-white uppercase tracking-tight">
                Barcha <span className="text-blue-100">kurslar</span>
              </h1>
              <p className="text-blue-50 text-sm lg:text-base font-medium leading-relaxed max-w-xl">
                O'zlashtirish samaradorligini AI va metakognitiv yondashuv orqali oshiring.
              </p>
           </div>
        </div>

        {/* Search & Filter Bar - Compact */}
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Qidiring..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-14 pr-6 rounded-2xl border-slate-100 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 bg-white shadow-sm gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
            <Filter className="h-4 w-4" /> Filtr
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem]">
            <CardContent className="space-y-6">
              <div className="h-20 w-20 rounded-full bg-white shadow-lg flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-[#1e293b] uppercase">Kurslar Topilmadi</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Qidiruv natijasida hech narsa chiqmadi</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => {
              const isEnrolled = enrolledIds.includes(course.id);
              const CardWrapper = isEnrolled ? Link : 'div';
              const wrapperProps = isEnrolled ? { to: `/courses/${course.id}` } : {};

              return (
                <CardWrapper key={course.id} {...wrapperProps} className={isEnrolled ? "block group/card" : ""}>
                  <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-700 bg-white flex flex-col h-full hover:-translate-y-1">
                    <div className="h-52 overflow-hidden relative">
                      <img 
                        src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        alt={course.title} 
                      />
                      <div className="absolute top-5 right-5">
                        <Badge className="bg-white/95 backdrop-blur-md text-indigo-600 border-none px-3 py-1 font-black text-[9px] uppercase shadow-lg tracking-widest rounded-full">
                          {isEnrolled ? "O'RGANISHDA" : "BEPUL"}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-8 flex flex-col flex-1 gap-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-500">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">O'quv kursi</span>
                        </div>
                        <h3 className="text-xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2 uppercase tracking-tight">
                          {course.title}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-auto space-y-5">
                        <div className="flex items-center justify-between py-3 border-y border-slate-50">
                          <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-slate-300" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{course.studentCount || 0} Talaba</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 text-slate-300" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{course.lessonCount || 0} Dars</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                              <GraduationCap className="h-4.5 w-4.5 text-slate-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">O'qituvchi</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate">{course.teacher?.full_name || "MetaEdu Ustoz"}</span>
                          </div>
                        </div>

                        {isEnrolled ? (
                          <div className="w-full rounded-2xl h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-2">
                            O'rganish <ArrowRight className="h-3.5 w-3.5 group-hover/card:translate-x-1 transition-transform" />
                          </div>
                        ) : (
                          <Button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEnroll(course.id);
                            }}
                            className="w-full rounded-2xl h-14 bg-[#1e293b] hover:bg-[#334155] text-white font-black text-[10px] tracking-[0.1em] uppercase shadow-lg shadow-indigo-100/50 transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            Yozilish <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CardWrapper>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
