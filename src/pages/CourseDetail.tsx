import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, PlayCircle, FileText, HelpCircle, CheckCircle, Clock, Users, GraduationCap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCourseData();
  }, [id, user]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const { data: courseData } = await supabase.from("courses").select("*").eq("id", id).single();
      setCourse(courseData);
      
      const { data: lessonsData } = await supabase.from("lessons").select("*").eq("course_id", id).order("order_index");
      setLessons(lessonsData || []);
      
      if (user) {
        const { data: enrollData } = await supabase.from("enrollments").select("*").eq("course_id", id).eq("user_id", user.id).maybeSingle();
        setEnrollment(enrollData);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setEnrolling(false);
    }
  };

  const contentIcon = (type: string) => {
    switch (type) {
      case "video": return <PlayCircle className="h-5 w-5 text-indigo-500" />;
      case "quiz": return <HelpCircle className="h-5 w-5 text-amber-500" />;
      default: return <FileText className="h-5 w-5 text-sky-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!course) return <Layout><div className="text-center py-20 font-bold">Kurs topilmadi</div></Layout>;

  return (
    <Layout>
      <div className="container py-12 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <div className="space-y-6">
              <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100 border-8 border-white">
                <img 
                  src={course.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                  alt={course.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Kurs haqida</Badge>
                   <div className="h-1 w-1 rounded-full bg-slate-200" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lessons.length} ta dars</span>
                </div>
                <h1 className="text-5xl font-bold font-serif text-slate-800 tracking-tight leading-tight uppercase">{course.title}</h1>
                <p className="text-lg text-slate-500 leading-relaxed max-w-3xl">{course.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm"><BookOpen className="h-5 w-5" /></div>
                <h2 className="text-2xl font-bold font-serif text-slate-800 uppercase tracking-tight">O'quv dasturi</h2>
              </div>
              
              <div className="grid gap-3">
                {lessons.length === 0 ? (
                  <Card className="border-dashed py-12 text-center rounded-[2rem] bg-slate-50/50">
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hali darslar qo'shilmagan</p>
                  </Card>
                ) : (
                  lessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className={`group flex items-center gap-6 p-5 rounded-2xl border-2 transition-all ${
                        enrollment 
                          ? "bg-white border-white shadow-sm hover:shadow-xl hover:scale-[1.01] cursor-pointer" 
                          : "bg-slate-50 border-transparent opacity-70 grayscale"
                      }`}
                      onClick={() => enrollment && navigate(`/lessons/${lesson.id}`)}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-black text-sm shadow-inner shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                           {contentIcon(lesson.content_type)}
                           <p className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{lesson.title}</p>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lesson.content_type} dars</p>
                      </div>
                      {enrollment ? (
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                           <ArrowRight className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                           <Lock className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Enrollment Card */}
          <div className="space-y-8">
             <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white sticky top-24">
                <CardHeader className="bg-[#1e293b] p-10 text-white space-y-2">
                   <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Hozir boshlang</p>
                   <CardTitle className="text-3xl font-bold font-serif uppercase tracking-tight">Kursga a'zo bo'lish</CardTitle>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between py-4 border-b border-slate-50">
                         <div className="flex items-center gap-3 text-slate-400">
                            <Clock className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Davomiyligi</span>
                         </div>
                         <span className="text-sm font-bold text-slate-700 uppercase">O'z tezligingizda</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-slate-50">
                         <div className="flex items-center gap-3 text-slate-400">
                            <GraduationCap className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Daraja</span>
                         </div>
                         <span className="text-sm font-bold text-slate-700 uppercase">Boshlang'ich</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-slate-50">
                         <div className="flex items-center gap-3 text-slate-400">
                            <Users className="h-5 w-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Talabalar</span>
                         </div>
                         <span className="text-sm font-bold text-slate-700 uppercase">240+ talaba</span>
                      </div>
                   </div>

                   {enrollment ? (
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <span>Progress</span>
                               <span>{Math.round(enrollment.progress)}%</span>
                            </div>
                            <Progress value={Number(enrollment.progress)} className="h-2 bg-slate-100" />
                         </div>
                         <Button asChild className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100">
                            <Link to={`/lessons/${lessons[0]?.id}`}>O'rganishni davom ettirish</Link>
                         </Button>
                      </div>
                   ) : (
                      <Button 
                        onClick={handleEnroll} 
                        disabled={enrolling}
                        className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all active:scale-95"
                      >
                         {enrolling ? "Yozilmoqda..." : "Kursga yozilish"}
                      </Button>
                   )}
                   
                   <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest leading-relaxed">
                      Kursga yozilish mutlaqo bepul. <br /> Barcha darslar va testlar ochiladi.
                   </p>
                </CardContent>
             </Card>

             {/* Teacher info card or related features */}
             <div className="p-10 rounded-[3rem] bg-indigo-50/50 border border-indigo-100/50 space-y-4">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Kafolatlanadi</h4>
                <div className="flex items-center gap-3 text-indigo-700 font-bold text-sm">
                   <CheckCircle className="h-5 w-5 text-indigo-600" />
                   Metakognitiv yondashuv
                </div>
                <div className="flex items-center gap-3 text-indigo-700 font-bold text-sm">
                   <CheckCircle className="h-5 w-5 text-indigo-600" />
                   AI yordamida o'zlashtirish
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;
