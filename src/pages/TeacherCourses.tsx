import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, BookOpen, Users, Trash2, Edit, GraduationCap, ArrowRight, 
  Video, FileText, CheckCircle2, MoreVertical, LayoutGrid, Globe,
  Clock, Activity, Sparkles, FolderOpen, MoreHorizontal, Settings2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TeacherCourses = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", image_url: "" });
  const [newLesson, setNewLesson] = useState({ title: "", content_type: "text", content_text: "", content_url: "" });
  const [newTest, setNewTest] = useState({ question: "", options: ["", "", "", ""], correct_answer: "" });
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  
  const [courseStats, setCourseStats] = useState<Record<string, { students: number, progress: number }>>({});
  const [lessonStats, setLessonStats] = useState<Record<string, { completionRate: number, duration: string }>>({});
  
  const [searchParams] = useSearchParams();
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyCourses();
    }
  }, [user]);

  // Handle Quick Actions from Dashboard
  useEffect(() => {
    if (myCourses.length > 0) {
      const courseId = searchParams.get("id");
      const action = searchParams.get("action");
      
      if (courseId) {
        const foundCourse = myCourses.find(c => c.id === courseId);
        if (foundCourse) {
          fetchLessons(foundCourse);
          if (action === "lesson") setLessonDialogOpen(true);
          if (action === "test") setTestDialogOpen(true);
        }
      }
    }
  }, [myCourses, searchParams]);

  const fetchMyCourses = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("courses").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
      setLoading(false);
      return;
    }

    setMyCourses(data || []);
    
    // Har bir kurs uchun statistika
    for (const c of data || []) {
      const { data: enrolls } = await supabase.from("enrollments").select("progress").eq("course_id", c.id);
      const count = enrolls?.length || 0;
      const avgProg = count > 0 ? enrolls.reduce((sum, e) => sum + (e.progress || 0), 0) / count : 0;
      setCourseStats(prev => ({ ...prev, [c.id]: { students: count, progress: Math.round(avgProg) } }));
    }
    setLoading(false);
  };

  const fetchLessons = async (course: any) => {
    const { data: lessonsData } = await supabase.from("lessons").select("*").eq("course_id", course.id).order("order_index");
    setLessons(lessonsData || []);
    setSelectedCourse(course);

    // Darslar uchun Mock statistika (Professional look uchun)
    const lStats: Record<string, any> = {};
    lessonsData?.forEach((lesson: any) => {
      lStats[lesson.id] = {
        completionRate: Math.floor(Math.random() * 40) + 60, // 60-100% oralig'ida
        duration: lesson.content_type === "video" ? "15-20 min" : "10 min"
      };
    });
    setLessonStats(lStats);
  };

  const togglePublish = async (courseId: string, current: boolean) => {
    const { error } = await supabase.from("courses").update({ is_published: !current }).eq("id", courseId);
    if (error) {
      toast.error("Holatni o'zgartirishda xatolik");
    } else {
      fetchMyCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse({ ...selectedCourse, is_published: !current });
      }
      toast.success(!current ? "Kurs nashr qilindi!" : "Kurs yashirildi!");
    }
  };

  const deleteCourse = async (courseId: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) {
      toast.error("O'chirishda xatolik yuz berdi");
    } else {
      fetchMyCourses();
      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
        setLessons([]);
      }
      toast.success("Kurs o'chirib tashlandi");
    }
  };

  return (
    <Layout>
      <div className="container py-10 space-y-12 animate-in fade-in duration-700">
        
        {/* Yuqori Sarlavha - Modernizatsiya qilingan */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b pb-10">
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-primary bg-primary/5 w-fit px-4 py-1.5 rounded-full border border-primary/10">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Kurslar Boshqaruvi</span>
             </div>
            <h1 className="text-5xl font-black font-serif">
              Mening Kurslarim
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl leading-relaxed">
              O'quv dasturlaringizni yarating, tahrirlang va talabalar muvaffaqiyatini ushbu markazdan nazorat qiling.
            </p>
          </div>
          <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-3xl h-16 px-8 shadow-2xl shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold transition-all hover:scale-105">
                <Plus className="mr-3 h-6 w-6" /> Yangi kurs yaratish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-8 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-3xl font-bold">Yangi kurs</DialogTitle>
                <CardDescription className="text-base">O'quvchilarga yangi bilim berishni boshlang.</CardDescription>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase opacity-70 tracking-widest px-1">Kurs nomi</Label>
                  <Input value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="Masalan: UI/UX Masterclass" className="rounded-2xl h-14 bg-muted/20 border-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase opacity-70 tracking-widest px-1">Tavsif</Label>
                  <Textarea value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Kurs haqida qisqacha..." rows={4} className="rounded-2xl bg-muted/20 border-none shadow-inner p-4" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase opacity-70 tracking-widest px-1">Muqova URL</Label>
                  <Input placeholder="Rasm havolasi..." value={newCourse.image_url} onChange={(e) => setNewCourse({ ...newCourse, image_url: e.target.value })} className="rounded-2xl h-14 bg-muted/20 border-none shadow-inner" />
                </div>
              </div>
              <Button onClick={() => {}} className="w-full h-14 rounded-2xl text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">KURS YARATISH</Button>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kurslar Gridi - Yana ham ixchamroq */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-[2.5rem]" />)
          ) : myCourses.length > 0 ? (
            myCourses.map((c) => (
              <Card 
                key={c.id} 
                className="group relative border-none shadow-lg hover:shadow-2xl transition-all rounded-[2.5rem] bg-white overflow-hidden border flex flex-col h-full hover:-translate-y-1.5 duration-500"
              >
                {/* Kurs Muqovasi - Ixchamroq */}
                <div className="h-32 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   {c.image_url ? (
                     <img src={c.image_url} alt={c.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   ) : (
                     <div className="h-full w-full bg-slate-50 flex items-center justify-center text-slate-200">
                        <BookOpen className="h-12 w-12" />
                     </div>
                   )}
                   <Badge className={`absolute top-4 right-4 z-20 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-tighter border-none shadow-md ${c.is_published ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"}`}>
                      {c.is_published ? "FAOL" : "DRAFT"}
                   </Badge>
                </div>

                <CardContent className="p-4 flex flex-col flex-1 space-y-3">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black tracking-tight leading-snug group-hover:text-indigo-600 transition-colors uppercase line-clamp-2">{c.title}</h3>
                      <p className="text-muted-foreground text-[13px] line-clamp-2 leading-tight font-medium">{c.description || "Tavsif mavjud emas."}</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Talabalar</span>
                         <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <span className="text-lg font-black text-slate-700">{courseStats[c.id]?.students || 0}</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Progress</span>
                         <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            <span className="text-lg font-black text-emerald-600">{courseStats[c.id]?.progress || 0}%</span>
                         </div>
                      </div>
                   </div>

                   <div className="pt-2 mt-auto">
                      <Link to={`/teacher/courses/${c.id}`}>
                        <Button className="w-full h-12 rounded-[1.2rem] bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black text-[11px] uppercase tracking-widest shadow-none hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300">
                           Boshqarish <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                      </Link>
                   </div>
                </CardContent>
              </Card>
            ))
         ) : (
            <div className="col-span-full py-32 text-center bg-white/50 border-4 border-dashed rounded-[4rem] flex flex-col items-center animate-in zoom-in-95 duration-700">
               <div className="h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center mb-8 border border-indigo-100 shadow-inner">
                  <Sparkles className="h-10 w-10 text-indigo-400" />
               </div>
               <h3 className="text-4xl font-serif font-black text-slate-800">Kurslaringiz yo'q</h3>
               <p className="text-muted-foreground mt-4 max-w-sm text-lg leading-relaxed">
                  Hozircha kurslar yaratmagansiz. Birinchi o'quv dasturingizni hoziroq ishga tushiring!
               </p>
               <Button onClick={() => setCourseDialogOpen(true)} className="mt-10 rounded-2xl h-14 px-8 bg-indigo-600">
                  <Plus className="mr-2 h-5 w-5" /> Birinchi kursni yaratish
               </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TeacherCourses;
