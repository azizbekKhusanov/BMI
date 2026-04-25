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
        
        const [profilesRes, enrollmentsRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name").in("user_id", teacherIds),
          supabase.from("enrollments").select("course_id")
        ]);

        const profiles = profilesRes.data || [];
        const allEnrollments = enrollmentsRes.data || [];

        const mappedCourses = coursesData.map(course => {
          const studentCount = allEnrollments.filter(e => e.course_id === course.id).length;
          return {
            ...course,
            studentCount,
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
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[3rem] bg-[#1e293b] p-12 lg:p-20 text-white shadow-2xl">
           <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
              <Sparkles className="w-full h-full text-white" />
           </div>
           <div className="relative z-10 max-w-3xl space-y-6">
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Metakognitiv Ta'lim</Badge>
              <h1 className="text-5xl lg:text-7xl font-bold font-serif leading-tight uppercase tracking-tight">
                Kurslar <span className="text-indigo-400">Katalogi</span>
              </h1>
              <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed">
                O'zlashtirish samaradorligini AI va metakognitiv yondashuv orqali oshiring. O'zingizga mos kursni tanlang va bugunoq boshlang.
              </p>
           </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Qiziqtirgan kursingizni qidiring..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-20 pl-20 pr-8 rounded-[2.5rem] border-none bg-white shadow-xl focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-lg font-medium"
            />
          </div>
          <Button variant="outline" className="h-20 px-10 rounded-[2.5rem] border-none bg-white shadow-xl gap-3 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95">
            <Filter className="h-5 w-5" /> Filtrlar
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[450px] rounded-[3rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-2 py-40 text-center bg-slate-50/50 rounded-[4rem]">
            <CardContent className="space-y-6">
              <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-[#1e293b] uppercase">Kurslar Topilmadi</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Qidiruv natijasida hech narsa chiqmadi</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Card key={course.id} className="border-none shadow-xl rounded-[3rem] overflow-hidden group hover:shadow-2xl transition-all duration-700 bg-white flex flex-col h-full hover:-translate-y-2">
                <div className="h-60 overflow-hidden relative">
                  <img 
                    src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={course.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-white/90 backdrop-blur-md text-indigo-600 border-none px-4 py-1.5 font-black text-[10px] uppercase shadow-xl tracking-widest rounded-full">
                      {enrolledIds.includes(course.id) ? "O'RORGANISHDA" : "BEPUL"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-10 flex flex-col flex-1 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">O'z tezligingizda</span>
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2 uppercase tracking-tight">
                      {course.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-6">
                    <div className="flex items-center justify-between py-4 border-y border-slate-50">
                       <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-300" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{course.studentCount || 0} Talaba</span>
                       </div>
                       <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-slate-700 uppercase">5.0</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="h-5 w-5 text-slate-400" />
                       </div>
                       <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O'qituvchi</span>
                          <span className="text-xs font-bold text-slate-700 truncate">{course.teacher?.full_name || "MetaEdu Ustoz"}</span>
                       </div>
                    </div>

                    {enrolledIds.includes(course.id) ? (
                      <Button asChild className="w-full rounded-[2rem] h-16 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-xs tracking-[0.2em] uppercase shadow-none border-none transition-all group/btn">
                        <Link to={`/student/courses/${course.id}`} className="flex items-center justify-center gap-2">
                          O'rganishda Davom Etish <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleEnroll(course.id)}
                        className="w-full rounded-[2rem] h-16 bg-[#1e293b] hover:bg-[#334155] text-white font-black text-xs tracking-[0.2em] uppercase shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        Kursga Yozilish <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
