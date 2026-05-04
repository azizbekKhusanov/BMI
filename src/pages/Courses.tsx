import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Search, 
  ArrowRight, Star, Clock, 
  Users
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
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

  const filtered = courses.filter((c) => {
    const matchesSearch = (c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "Barchasi" || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["Barchasi", ...new Set(courses.map(c => c.category).filter(Boolean))] as string[];

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 mt-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Mening kurslarim</h1>
          <p className="text-slate-500 font-medium">Platformadagi barcha mavjud kurslarni kashf eting va o'rganishni boshlang.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Kurslarni nomi yoki tavsifi bo'yicha qidirish..." 
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#0056d2] transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-6 h-11 text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                ? "bg-[#0056d2] hover:bg-[#00419e] text-white" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-slate-100 shadow-sm mb-12">
           <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
             <BookOpen className="h-8 w-8 text-slate-300" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">Kurslar topilmadi</h3>
           <p className="text-slate-500 mb-8 max-w-sm">Qidiruv natijasida hech qanday kurs topilmadi. Iltimos, boshqa kalit so'zdan foydalanib ko'ring.</p>
           <Button onClick={() => { setSearch(""); setActiveCategory("Barchasi"); }} className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-md px-10 h-12 font-bold transition-all">
             Barchasini ko'rsatish
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filtered.map((course) => {
            const isEnrolled = enrolledIds.includes(course.id);
            return (
              <Card key={course.id} className="rounded-xl border-slate-200 shadow-none overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group flex flex-col bg-white">
                <div className="h-44 relative overflow-hidden bg-slate-100">
                  <ImageWithFallback 
                    src={course.image_url} 
                    alt={course.title} 
                    containerClassName="absolute inset-0 w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    fallback={<div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100" />}
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-[#0056d2] text-white hover:bg-[#0056d2] border-none font-bold rounded-md px-3 py-1 shadow-sm">
                      {course.category || "Fan"}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/95 rounded-md text-[10px] font-black text-slate-800 shadow-sm border border-slate-100">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.8
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 12 soat</div>
                     <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {course.studentCount || 0} talaba</div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 line-clamp-2 mb-3 leading-snug group-hover:text-[#0056d2] transition-colors tracking-tight">
                    {course.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-8">
                    <Avatar className="h-7 w-7 ring-2 ring-white">
                      <AvatarImage src={course.teacher?.avatar_url} />
                      <AvatarFallback className="bg-slate-100 text-[10px] text-slate-600 font-black">{course.teacher?.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold text-slate-600">{course.teacher?.full_name}</span>
                  </div>

                  <div className="mt-auto pt-5 border-t border-slate-100">
                    {isEnrolled ? (
                      <Link to={`/student/courses/${course.id}`}>
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md font-bold h-11 transition-all">
                          Darsni davom ettirish <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        onClick={() => handleEnroll(course.id)}
                        className="w-full bg-white border-2 border-[#0056d2] text-[#0056d2] hover:bg-blue-50 rounded-md font-bold h-11 transition-all"
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
    </>
  );
};

export default Courses;
