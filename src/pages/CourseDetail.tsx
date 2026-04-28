import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  PlayCircle, CheckCircle2, Clock, Users, Target,
  ArrowRight, Sparkles, Lock, Star, Globe, 
  Play, ShieldCheck, Award, BookOpen, Activity, Share2, Heart,
  Bookmark, MessageCircle, MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  teacher_id: string;
  category?: string;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  order_index: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
}

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [teacher, setTeacher] = useState<Profile | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const fetchCourseData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
      if (!courseData) return;
      setCourse(courseData as Course);
      
      const { data: lessonsData } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index");
      setLessons(lessonsData as Lesson[] || []);
      
      const { data: teacherData } = await supabase.from("profiles").select("*").eq("user_id", courseData.teacher_id).single();
      setTeacher(teacherData as Profile);

      const { count } = await supabase.from("enrollments").select("*", { count: 'exact', head: true }).eq("course_id", id);
      setStudentCount(count || 0);

      if (user) {
        const { data: enrollData } = await supabase.from("enrollments").select("*").eq("course_id", id).eq("user_id", user.id).maybeSingle();
        setEnrollment(enrollData as Enrollment);

        const { data: assessmentsData } = await supabase
          .from("self_assessments")
          .select("lesson_id")
          .eq("user_id", user.id);
        
        const completedIds = [...new Set(assessmentsData?.map((a) => a.lesson_id) || [])] as string[];
        setCompletedLessons(completedIds);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourseData();
  }, [fetchCourseData]);

  const nextLessonId = lessons.find(l => !completedLessons.includes(l.id))?.id || lessons[0]?.id;

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Kursga yozilish uchun avval tizimga kiring");
      navigate("/login");
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: id,
        progress: 0
      });

      if (error) throw error;
      toast.success("Kursga muvaffaqiyatli yozildingiz!");
      fetchCourseData();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Xatolik yuz berdi");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
        <div className="space-y-8 mt-6">
          <Skeleton className="h-64 md:h-96 w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-40 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        </div>
    );
  }

  if (!course) return <div className="text-center py-32 font-bold text-2xl text-slate-500">Kurs topilmadi</div>;

  return (
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 mt-4">
        <Link to="/student/courses" className="hover:text-indigo-600 transition-colors">Kurslar</Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-slate-900 font-semibold">{course.title}</span>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="h-64 md:h-96 relative bg-slate-100">
          <img 
            src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
            className="w-full h-full object-cover"
            alt={course.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 w-full text-white">
            <div className="flex gap-3 mb-4">
              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-none font-semibold px-4 py-1.5 rounded-full">
                {course.category || "Fan"}
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-semibold px-4 py-1.5 rounded-full">
                Bepul
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight max-w-3xl">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <span>4.9 (2.4k sharhlar)</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-300" />
                <span>{studentCount.toLocaleString()} ta talaba</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-300" />
                <span>O'zbek tili</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Kurs haqida</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                {course.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                  <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Amaliy ko'nikmalar</h4>
                    <p className="text-sm text-slate-500">O'rganganlaringizni real loyihalarda qo'llashni o'rganasiz.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Sertifikat</h4>
                    <p className="text-sm text-slate-500">Kursni yakunlagach maxsus sertifikatga ega bo'lasiz.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Dars dasturi</h2>
                <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {lessons.length} dars</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> 24 soat</span>
                </div>
              </div>

              <Accordion type="single" collapsible defaultValue="module-1" className="w-full">
                <AccordionItem value="module-1" className="border-slate-100 mb-4 bg-slate-50 rounded-2xl overflow-hidden px-2">
                  <AccordionTrigger className="hover:no-underline px-4 py-4 text-left">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold shadow-sm">1</div>
                      <div>
                        <h4 className="font-bold text-slate-900">Asosiy Darslar</h4>
                        <p className="text-xs text-slate-500 mt-1 font-normal">Barcha dars modullari</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 mt-2">
                      {lessons.length === 0 ? (
                        <div className="py-8 text-center bg-white rounded-xl border border-slate-100">
                           <p className="text-sm text-slate-400">Hozircha darslar yuklanmagan</p>
                        </div>
                      ) : (
                        lessons.map((lesson, idx) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          const isLocked = enrollment ? (idx > 0 && !completedLessons.includes(lessons[idx-1].id)) : true;
                          
                          return (
                            <div 
                              key={lesson.id} 
                              className={`flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white transition-all ${
                                !isLocked ? "hover:border-indigo-200 cursor-pointer" : "opacity-50 cursor-not-allowed bg-slate-50"
                              }`}
                              onClick={() => !isLocked && navigate(`/lessons/${lesson.id}`)}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                                  isCompleted ? "bg-emerald-50 text-emerald-500" : isLocked ? "bg-slate-200 text-slate-400" : "bg-indigo-50 text-indigo-500"
                                }`}>
                                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isLocked ? <Lock className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                                </div>
                                <div>
                                   <span className={`text-sm font-semibold ${isLocked ? "text-slate-400" : isCompleted ? "text-slate-500" : "text-slate-900"}`}>
                                     {lesson.title}
                                   </span>
                                   <div className="text-xs text-slate-400 mt-0.5">Modul {lesson.order_index}</div>
                                </div>
                              </div>
                              <div className="text-slate-300">
                                 {isLocked ? <Lock className="h-4 w-4" /> : isCompleted ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <ArrowRight className="h-4 w-4 text-indigo-400" />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm bg-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">O'qituvchi haqida</h2>
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <Avatar className="h-32 w-32 rounded-2xl border-4 border-slate-50 shadow-sm">
                  <AvatarImage src={teacher?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 text-3xl font-bold">{teacher?.full_name?.[0] || "T"}</AvatarFallback>
                </Avatar>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{teacher?.full_name || "O'qituvchi"}</h3>
                    <p className="text-indigo-600 font-semibold text-sm mt-1">Platforma mualiffi</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Sizga yangi bilimlarni mukammal darajada yetkazish va kelajak kasblariga tayyorlash uchun shu yerdaman. Har bir dars qiziqarli va foydali bo'lishiga ishonaman.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-slate-100 shadow-sm bg-white sticky top-24">
            <CardContent className="p-8">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                 <h3 className="text-xl font-bold text-slate-900">Kurs xolati</h3>
                 <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">Bepul</Badge>
              </div>

              {enrollment ? (
                 <div className="space-y-6">
                    <Link to={`/lessons/${nextLessonId}`}>
                       <Button className="w-full h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-base">
                         O'rganishni Davom Ettirish <ArrowRight className="ml-2 h-5 w-5" />
                       </Button>
                    </Link>
                    <div className="text-center text-sm font-medium text-slate-500">
                      Siz bu kursga yozilgansiz
                    </div>
                 </div>
              ) : (
                <div className="space-y-6">
                  <Button 
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-base"
                  >
                    {enrolling ? "Yozilmoqda..." : "Kursga Yozilish Bepul"}
                  </Button>
                </div>
              )}

              <div className="space-y-4 pt-8 mt-8 border-t border-slate-100">
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: "To'liq bepul kirish", icon: ShieldCheck },
                    { label: "Cheklanmagan vaqt", icon: Clock },
                    { label: "Amaliy mashg'ulotlar", icon: Activity },
                    { label: "Sertifikat beriladi", icon: Award },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-500">
                         <item.icon className="h-4 w-4" />
                      </div>
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 shadow-sm">
                    <Bookmark className="h-4 w-4 mr-2" /> Saqlash
                 </Button>
                 <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 shadow-sm">
                    <Share2 className="h-4 w-4 mr-2" /> Ulashish
                 </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default CourseDetail;
