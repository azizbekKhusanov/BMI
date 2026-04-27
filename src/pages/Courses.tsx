import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Search, Filter, 
  ArrowRight, Star, Clock, 
  Users, LayoutGrid, List, Sparkles, Zap, Palette, Flame, Activity, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  teacher_id: string;
  category?: string;
  studentCount?: number;
  lessonCount?: number;
  teacher?: {
    full_name: string;
    avatar_url?: string;
  };
}

const CATEGORIES = [
  { name: "Barchasi", icon: LayoutGrid },
  { name: "Sun'iy Intellekt", icon: Sparkles },
  { name: "Dasturlash", icon: Zap },
  { name: "Dizayn", icon: Palette },
  { name: "Biznes", icon: Flame }
];

const Courses = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Barchasi");

  const { data: { courses = [], enrolledIds = [] } = {}, isLoading: loading } = useQuery({
    queryKey: ['all-courses', user?.id],
    queryFn: async () => {
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      let enrichedCourses = coursesData || [];
      if (enrichedCourses.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teacherIds = [...new Set(enrichedCourses.map((c: any) => c.teacher_id).filter(Boolean))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", teacherIds);
        const { data: enrollments } = await supabase.from("enrollments").select("course_id");
        const { data: lessons } = await supabase.from("lessons").select("course_id");

        enrichedCourses = enrichedCourses.map(c => {
          const teacher = profiles?.find(p => p.user_id === c.teacher_id);
          const studentCount = enrollments?.filter(e => e.course_id === c.id).length || 0;
          const lessonCount = lessons?.filter(l => l.course_id === c.id).length || 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return { ...c, teacher, studentCount, lessonCount } as any;
        });
      }

      let userEnrolledIds: string[] = [];
      if (user) {
        const { data: userEnrolls } = await supabase.from("enrollments").select("course_id").eq("user_id", user.id);
        if (userEnrolls) userEnrolledIds = userEnrolls.map(e => e.course_id);
      }

      return { courses: enrichedCourses as Course[], enrolledIds: userEnrolledIds };
    },
    staleTime: 5 * 60 * 1000,
  });


  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['all-courses'] });
    }
  };

  const filtered = courses.filter((c) =>
    (c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())) &&
    (activeCategory === "Barchasi" || c.description?.includes(activeCategory) || c.category === activeCategory)
  );

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Barcha Kurslar</h1>
          <p className="text-slate-600">Platformadagi barcha mavjud kurslarni kashf eting.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Kurslarni qidirish..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-[46px] rounded-xl px-6 bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
          <Filter className="h-4 w-4 mr-2" /> Filterlar
        </Button>
      </div>

      <div className="flex overflow-x-auto pb-4 mb-4 gap-3 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeCategory === cat.name 
                ? "bg-indigo-600 text-white" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-96 w-full rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mb-12">
           <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
             <BookOpen className="h-8 w-8 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">Kurslar topilmadi</h3>
           <p className="text-slate-500 mb-6">Boshqa kalit so'z yoki kategoriya bilan urinib ko'ring.</p>
           <Button onClick={() => { setSearch(""); setActiveCategory("Barchasi"); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 font-semibold">
             Barchasini ko'rsatish
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filtered.map((course) => {
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <Card key={course.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col bg-white">
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  {course.image_url ? (
                    <img 
                      src={course.image_url} 
                      alt={course.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-40" />
                  )}
                  <Badge className="absolute top-4 left-4 bg-white/90 text-slate-900 hover:bg-white border-none font-bold rounded-full shadow-sm">
                    {course.category || "Fan"}
                  </Badge>
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.8
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500">
                     <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 12 soat</div>
                     <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {course.studentCount || 0} talaba</div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={course.teacher?.avatar_url} />
                      <AvatarFallback className="bg-slate-100 text-[10px] text-slate-600 font-bold">{course.teacher?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-600">{course.teacher?.full_name}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    {isEnrolled ? (
                      <Link to={`/student/courses/${course.id}`}>
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold h-11 transition-all">
                          Darsni davom ettirish <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        onClick={() => handleEnroll(course.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold h-11 transition-all shadow-sm"
                      >
                        Kursga yozilish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Courses;
