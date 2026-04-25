import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
   BookOpen, Users, Brain, ClipboardList, Activity, ArrowLeft, 
   Plus, Video, FileText, CheckCircle2, MoreVertical, LayoutGrid, Globe,
   Clock, Sparkles, Settings2, Trash2, GraduationCap, TrendingUp,
   MessageSquare, HelpCircle, UserCheck, Wand2, Search, Edit, Upload, Loader2, Youtube, ExternalLink,
   ChevronRight, BarChart3, Target, Pencil, PlusCircle, Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("curriculum");
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addTestOpen, setAddTestOpen] = useState(false);
  
  const [newLesson, setNewLesson] = useState({
    title: "",
    content_type: "video",
    video_url: "",
    content: ""
  });

  useEffect(() => {
    if (!id) return;
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      
      if (courseError) throw courseError;
      setCourse(courseData);

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");
      setLessons(lessonsData || []);

      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*, profiles(*)")
        .eq("course_id", id);
      setEnrollments(enrollData || []);
      
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Kurs ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddLesson = async () => {
    if (!newLesson.title) return toast.error("Dars nomini kiriting");
    
    let contentUrl = newLesson.video_url;
    if (newLesson.content_type === 'video') {
       const ytId = getYoutubeId(newLesson.video_url);
       if (!ytId) return toast.error("Noto'g'ri YouTube havolasi");
       contentUrl = `https://www.youtube.com/embed/${ytId}`;
    }

    try {
      const { error } = await supabase
        .from("lessons")
        .insert({
          course_id: id,
          title: newLesson.title,
          content_type: newLesson.content_type,
          content_url: contentUrl,
          content_text: newLesson.content_type === 'text' ? newLesson.content : null,
          order_index: lessons.length + 1
        });
      
      if (error) throw error;
      toast.success("Yangi dars muvaffaqiyatli qo'shildi");
      setAddLessonOpen(false);
      setNewLesson({ title: "", content_type: "video", video_url: "", content: "" });
      fetchCourseData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Ishonchingiz komilmi?")) return;
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
      if (error) throw error;
      toast.success("Dars o'chirildi");
      fetchCourseData();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const togglePublish = async () => {
    try {
      const { error } = await supabase
        .from("courses")
        .update({ is_published: !course.is_published })
        .eq("id", id);
      
      if (error) throw error;
      toast.success(course.is_published ? "Kurs qoralama holatiga o'tkazildi" : "Kurs faollashtirildi");
      fetchCourseData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <Skeleton className="h-16 w-64 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <Link to="/teacher/courses">
                 <Button variant="outline" className="rounded-2xl h-14 w-14 p-0 border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all">
                    <ArrowLeft className="h-6 w-6 text-slate-600" />
                 </Button>
              </Link>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Badge className={`rounded-full text-[9px] font-black uppercase tracking-widest border-none px-2.5 py-0.5 ${course?.is_published ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                       {course?.is_published ? "FAOL" : "QORALAMA"}
                    </Badge>
                 </div>
                 <h1 className="text-4xl font-bold text-[#1e293b] font-serif tracking-tight uppercase">{course?.title}</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={togglePublish}
                className={`rounded-2xl h-14 px-8 font-bold text-[10px] uppercase tracking-widest transition-all gap-2 shadow-sm ${course?.is_published ? "border-amber-200 text-amber-600 bg-amber-50/30 hover:bg-amber-50" : "border-emerald-200 text-emerald-600 bg-emerald-50/30 hover:bg-emerald-50"}`}
              >
                {course?.is_published ? <Clock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {course?.is_published ? "Qoralama qilish" : "Faollashtirish"}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setSettingsOpen(true)}
                className="rounded-2xl h-14 px-8 border-slate-200 bg-white font-bold text-[10px] uppercase tracking-widest text-slate-600 shadow-sm hover:bg-slate-50 transition-all gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Kurs sozlamalari
              </Button>
              
              <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <Button 
                       className="rounded-2xl h-14 px-8 bg-indigo-600 hover:bg-indigo-700 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all gap-2"
                    >
                       <PlusCircle className="h-5 w-5" />
                       Yangi Kontent
                    </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-64 rounded-3xl p-3 border-slate-100 shadow-2xl space-y-1">
                    <DropdownMenuItem onClick={() => setAddLessonOpen(true)} className="rounded-2xl py-4 cursor-pointer font-bold text-[10px] uppercase tracking-widest text-slate-600 gap-4 hover:bg-indigo-50 group">
                       <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <Video className="h-5 w-5" />
                       </div>
                       Yangi Dars qo'shish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAddTestOpen(true)} className="rounded-2xl py-4 cursor-pointer font-bold text-[10px] uppercase tracking-widest text-slate-600 gap-4 hover:bg-amber-50 group">
                       <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                          <ClipboardList className="h-5 w-5" />
                       </div>
                       Yangi Test yaratish
                    </DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="curriculum" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-10">
             <TabsList className="bg-white border border-slate-100 p-1.5 rounded-[2rem] h-auto shadow-sm">
               <TabsTrigger value="curriculum" className="rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-[#1e293b] data-[state=active]:text-white transition-all gap-2">
                 <LayoutGrid className="h-4 w-4" /> Darslar rejasi
               </TabsTrigger>
               <TabsTrigger value="students" className="rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-[#1e293b] data-[state=active]:text-white transition-all gap-2">
                 <Users className="h-4 w-4" /> Talabalar nazorati
               </TabsTrigger>
               <TabsTrigger value="analytics" className="rounded-full px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-[#1e293b] data-[state=active]:text-white transition-all gap-2">
                 <Brain className="h-4 w-4" /> Metakognitiv tahlil
               </TabsTrigger>
             </TabsList>
          </div>

          <TabsContent value="curriculum" className="mt-0">
             <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h2 className="text-3xl font-bold text-[#1e293b] font-serif uppercase tracking-tight">Kurs mundarijasi</h2>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <Bookmark className="h-4 w-4" /> {lessons.length} ta dars mavjud
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                   {lessons.length === 0 ? (
                      <Card className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-20">
                         <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-200">
                               <Plus className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest font-serif">Kurs hali bo'sh</h3>
                            <Button onClick={() => setAddLessonOpen(true)} variant="link" className="text-indigo-600 font-black uppercase text-xs tracking-widest">Birinchi darsni qo'shish</Button>
                         </div>
                      </Card>
                   ) : (
                      lessons.map((lesson) => (
                        <div 
                          key={lesson.id} 
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="group relative bg-white border border-slate-100 p-4 rounded-2xl hover:shadow-xl hover:shadow-indigo-100/30 hover:border-indigo-100 transition-all cursor-pointer flex items-center justify-between"
                        >
                           <div className="flex items-center gap-6">
                              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                 {lesson.content_type === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                              </div>
                              <div className="space-y-0.5">
                                 <div className="flex items-center gap-3">
                                    <h3 className="text-base font-bold text-[#1e293b] uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{lesson.title}</h3>
                                    <Badge className="bg-slate-50 text-slate-400 border-none text-[7px] font-black tracking-widest uppercase px-1.5 py-0">
                                       {lesson.content_type}
                                    </Badge>
                                 </div>
                                 <div className="flex items-center gap-4 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> 4/25/2026</span>
                                    <span className="flex items-center gap-1.5"><HelpCircle className="h-3 w-3 text-indigo-300" /> Quiz</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                                className="h-10 w-10 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                              <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                 <ChevronRight className="h-5 w-5" />
                              </div>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </div>
          </TabsContent>

          <TabsContent value="students" className="mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((en) => (
                  <Card key={en.id} className="rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all p-8 bg-white overflow-hidden relative group">
                     <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600 transition-all duration-500" />
                     <div className="relative z-10 space-y-6">
                        <div className="h-20 w-20 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center text-3xl font-black text-[#1e293b]">
                           {en.profiles?.full_name?.[0]}
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-xl font-bold text-[#1e293b] uppercase tracking-tight">{en.profiles?.full_name}</h3>
                           <p className="text-xs font-bold text-slate-400 tracking-widest">{en.profiles?.email}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                              <span className="text-slate-400">Progress</span>
                              <span className="text-indigo-600">35%</span>
                           </div>
                           <Progress value={35} className="h-2 bg-slate-100 rounded-full" />
                        </div>
                     </div>
                  </Card>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
             <div className="py-20 text-center space-y-6">
                <div className="h-24 w-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                   <Sparkles className="h-12 w-12" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl font-bold text-[#1e293b] font-serif uppercase tracking-tight">Metakognitiv AI Analytics</h2>
                   <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sun'iy intellekt talabalar natijalarini tahlil qilmoqda...</p>
                </div>
                <Button className="h-14 px-10 rounded-2xl bg-indigo-600 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 gap-3">
                   <Activity className="h-5 w-5" /> Tahlilni boshlash
                </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="rounded-[3rem] p-12 max-w-2xl border-none shadow-2xl">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-3xl font-bold text-[#1e293b] font-serif uppercase">Yangi dars qo'shish</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kurs mundarijasini boyitish uchun dars ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          <div className="grid gap-8 py-8">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dars nomi</Label>
              <Input 
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Masalan: JavaScript Kirish" 
                className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all" 
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Video havolasi (YouTube)</Label>
              <div className="relative">
                 <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                 <Input 
                  value={newLesson.video_url}
                  onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 shadow-inner pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all" 
                 />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddLesson} className="h-16 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">
               Darsni saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TeacherCourseDetail;
