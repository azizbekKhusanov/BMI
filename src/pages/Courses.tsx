import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, Users, GraduationCap, Sparkles, Filter } from "lucide-react";
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
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        teacher:profiles (full_name)
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Kurslarni yuklashda xatolik:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    }
      
    setCourses(data || []);
    setLoading(false);
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
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
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
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#1e293b] font-serif tracking-tight flex items-center gap-3 uppercase">
                Kurslar Katalogi
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                O'zingiz uchun mos keladigan metakognitiv kursni tanlang
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 bg-white shadow-sm hover:bg-slate-50 gap-2 font-bold text-[10px] uppercase tracking-widest text-slate-500">
              <Filter className="h-4 w-4" /> Filtrlash
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl mx-auto w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            placeholder="Qiziqtirgan kursingizni qidiring..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-16 pl-16 pr-6 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-sm font-medium"
          />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 space-y-6">
            <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto">
              <BookOpen className="h-10 w-10 text-slate-200" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-[#1e293b] uppercase">Kurslar Topilmadi</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Qidiruv natijasida hech narsa chiqmadi</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Card key={course.id} className="border-none shadow-md rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white flex flex-col h-full">
                <div className="h-52 overflow-hidden relative">
                  <img 
                    src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={course.title} 
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 backdrop-blur-md text-indigo-600 border-none px-3 py-1 font-bold text-[10px] uppercase shadow-sm">
                      Premium
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col flex-1 gap-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">O'quv kursi</span>
                  </div>
                  <h3 className="text-xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">
                    {course.description}
                  </p>
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-tight truncate">
                        {course.teacher?.full_name || "MetaEdu Ustoz"}
                      </p>
                    </div>
                    {enrolledIds.includes(course.id) ? (
                      <Button asChild className="w-full rounded-2xl h-14 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs tracking-widest uppercase shadow-none border-none transition-all">
                        <Link to={`/student/courses/${course.id}`}>O'rganishda Davom Etish</Link>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleEnroll(course.id)}
                        className="w-full rounded-2xl h-14 bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs tracking-widest uppercase shadow-lg shadow-indigo-200 transition-all"
                      >
                        Kursga Yozilish
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
