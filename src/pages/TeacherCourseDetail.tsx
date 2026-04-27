import { useEffect, useState, useCallback } from "react";
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
   ChevronRight, BarChart3, Target, Pencil, PlusCircle, Bookmark, Info, Zap, Layout as LayoutIcon
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  order_index: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("curriculum");
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addTestOpen, setAddTestOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [courseDeleteConfirmOpen, setCourseDeleteConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [newLesson, setNewLesson] = useState({
    title: "",
    content_type: "video",
    video_url: "",
    content: ""
  });

  const [editCourse, setEditCourse] = useState({
    title: "",
    description: "",
    image_url: ""
  });

  const fetchCourseData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      
      if (courseError) throw courseError;
      const courseDataTyped = courseData as Course;
      setCourse(courseDataTyped);
      setEditCourse({
        title: courseDataTyped.title || "",
        description: courseDataTyped.description || "",
        image_url: courseDataTyped.image_url || ""
      });

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");
      setLessons(lessonsData as Lesson[] || []);

      const { data: enrollData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", id);
      
      if (enrollError) throw enrollError;

      if (enrollData && enrollData.length > 0) {
        const userIds = enrollData.map(e => e.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        const mappedEnrollments = enrollData.map(enroll => ({
          ...enroll,
          profiles: profilesData?.find(p => p.user_id === enroll.user_id) || null
        }));
        setEnrollments(mappedEnrollments as Enrollment[]);
      } else {
        setEnrollments([]);
      }
      
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
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
    setIsAddingLesson(true);
    try {
      const { error } = await supabase.from("lessons").insert({
        course_id: id, title: newLesson.title, content_type: newLesson.content_type,
        content_url: contentUrl, content_text: newLesson.content_type === 'text' ? newLesson.content : null,
        order_index: lessons.length + 1
      });
      if (error) throw error;
      toast.success("Dars qo'shildi");
      setAddLessonOpen(false);
      setNewLesson({ title: "", content_type: "video", video_url: "", content: "" });
      fetchCourseData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsAddingLesson(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    try {
      const { error } = await supabase.from("lessons").delete().eq("id", lessonToDelete);
      if (error) throw error;
      toast.success("Dars o'chirildi");
      setDeleteConfirmOpen(false);
      setLessonToDelete(null);
      fetchCourseData();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const togglePublish = async () => {
    if (!course) return;
    try {
      const { error } = await supabase.from("courses").update({ is_published: !course.is_published }).eq("id", id);
      if (error) throw error;
      toast.success(course.is_published ? "Kurs qoralama qilindi" : "Kurs faollashtirildi");
      fetchCourseData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleUpdateCourse = async () => {
    if (!editCourse.title) return toast.error("Kurs nomini kiriting");
    setIsUpdatingCourse(true);
    try {
      const { error } = await supabase.from("courses").update({
        title: editCourse.title, description: editCourse.description, image_url: editCourse.image_url
      }).eq("id", id);
      if (error) throw error;
      toast.success("Saqlandi");
      setSettingsOpen(false);
      fetchCourseData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!id) return;
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Kurs o'chirildi");
      navigate("/teacher/courses");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in p-8 lg:p-12">
        <Skeleton className="h-16 w-1/3 rounded-[2rem]" />
        <Skeleton className="h-[400px] w-full rounded-[4rem]" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-12 animate-fade-in">
        
        {/* Premium Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
           <div className="flex items-center gap-6">
              <Link to="/teacher/courses">
                 <Button variant="outline" className="h-16 w-16 rounded-[2rem] border-slate-100 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center">
                    <ArrowLeft className="h-6 w-6 text-slate-400" />
                 </Button>
              </Link>
              <div className="space-y-3">
                 <div className="flex items-center gap-3">
                    <Badge className={`${course?.is_published ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} border-none font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full`}>
                       {course?.is_published ? "Published" : "Draft Mode"}
                    </Badge>
                 </div>
                 <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase italic tracking-tight leading-none">{course?.title}</h1>
              </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-4">
              <Button 
                variant="outline" 
                onClick={togglePublish}
                className={`h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all gap-3 border-none shadow-xl ${course?.is_published ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
              >
                {course?.is_published ? <Clock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                {course?.is_published ? "Make Draft" : "Go Live"}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setSettingsOpen(true)}
                className="h-16 px-10 rounded-2xl bg-white border-none shadow-xl font-black uppercase text-xs tracking-widest text-slate-900 gap-3"
              >
                <Settings2 className="h-5 w-5" /> Sozlamalar
              </Button>
              
              <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <Button className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 gap-3">
                       <PlusCircle className="h-5 w-5" /> Yangi Kontent
                    </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-72 rounded-[2.5rem] border-none shadow-2xl p-4 bg-white/95 backdrop-blur-xl">
                    <DropdownMenuItem onClick={() => setAddLessonOpen(true)} className="rounded-2xl p-5 cursor-pointer font-black text-[10px] uppercase tracking-widest text-slate-600 gap-4 hover:bg-primary/5 group transition-all">
                       <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                          <Video className="h-6 w-6" />
                       </div>
                       Dars qo'shish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAddTestOpen(true)} className="rounded-2xl p-5 cursor-pointer font-black text-[10px] uppercase tracking-widest text-slate-600 gap-4 hover:bg-amber-50 group transition-all">
                       <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">
                          <ClipboardList className="h-6 w-6" />
                       </div>
                       Test yaratish
                    </DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>

        {/* Unified Tabs System */}
        <Tabs defaultValue="curriculum" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-16">
             <TabsList className="bg-white/50 backdrop-blur-md border border-white shadow-2xl p-2 rounded-[3rem] h-auto space-x-2">
               {[
                 { id: "curriculum", label: "Darslar", icon: LayoutIcon },
                 { id: "students", label: "Talabalar", icon: Users },
                 { id: "analytics", label: "AI Tahlil", icon: Brain }
               ].map(t => (
                 <TabsTrigger 
                   key={t.id} 
                   value={t.id} 
                   className="rounded-[2.5rem] px-10 py-4 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all gap-3"
                 >
                   <t.icon className="h-5 w-5" /> {t.label}
                 </TabsTrigger>
               ))}
             </TabsList>
          </div>

          <TabsContent value="curriculum" className="space-y-10 focus-visible:outline-none">
             <div className="flex items-center justify-between px-6">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-4">
                   <BookOpen className="h-6 w-6 text-primary" /> Kurs Mundarijasi
                </h2>
                <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                   {lessons.length} Dars mavjud
                </Badge>
             </div>

             <div className="grid gap-6">
                {lessons.length === 0 ? (
                   <div className="py-32 text-center space-y-8 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                      <div className="h-32 w-32 rounded-[3rem] bg-white shadow-2xl flex items-center justify-center text-slate-200">
                         <Plus className="h-12 w-12" />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-3xl font-black text-slate-900 uppercase italic">Kurs hali bo'sh</h3>
                         <p className="text-slate-400 font-medium italic">Birinchi darsni qo'shish orqali kursingizni shakllantiring.</p>
                      </div>
                      <Button onClick={() => setAddLessonOpen(true)} variant="link" className="text-primary font-black uppercase text-xs tracking-[0.2em] hover:scale-105 transition-transform">Start Building Now</Button>
                   </div>
                ) : (
                   lessons.map((lesson) => (
                     <motion.div key={lesson.id} whileHover={{ scale: 1.01 }} className="group">
                       <Card 
                         onClick={() => navigate(`/lessons/${lesson.id}`)}
                         className="rounded-[3.5rem] border-none shadow-sm hover:shadow-2xl hover:shadow-primary/5 bg-white p-8 cursor-pointer transition-all duration-700 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10"
                       >
                          <div className="flex items-center gap-10">
                             <div className="h-20 w-20 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                {lesson.content_type === 'video' ? <Video className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                             </div>
                             <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                   <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight group-hover:text-primary transition-colors leading-none">{lesson.title}</h3>
                                   <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg italic">{lesson.content_type}</Badge>
                                </div>
                                <div className="flex items-center gap-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest italic">
                                   <span className="flex items-center gap-2"><Clock className="h-4 w-4 opacity-50" /> Estimated: 45 min</span>
                                   <span className="flex items-center gap-2 text-primary/60"><Zap className="h-4 w-4" /> AI Quiz Enabled</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setLessonToDelete(lesson.id);
                                  setDeleteConfirmOpen(true);
                               }}
                               className="h-16 w-16 rounded-[2rem] text-slate-100 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 className="h-6 w-6" />
                             </Button>
                             <div className="h-16 w-16 rounded-[2.5rem] bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                                <ChevronRight className="h-7 w-7" />
                             </div>
                          </div>
                       </Card>
                     </motion.div>
                   ))
                )}
             </div>
          </TabsContent>

          <TabsContent value="students" className="mt-0 focus-visible:outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {enrollments.map((en) => (
                  <motion.div key={en.id} whileHover={{ y: -10 }} className="group">
                    <Card className="rounded-[4rem] border-none shadow-xl bg-white p-12 overflow-hidden relative group h-[450px] flex flex-col justify-between">
                       <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:bg-primary group-hover:opacity-100 transition-all duration-700 opacity-50 blur-2xl" />
                       <div className="relative z-10 space-y-8">
                          <Avatar className="h-28 w-28 rounded-[2.5rem] border-[6px] border-white ring-2 ring-slate-50 shadow-2xl">
                             <AvatarImage src={en.profiles?.avatar_url || undefined} />
                             <AvatarFallback className="bg-primary text-white font-black text-3xl">{en.profiles?.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-3">
                             <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-tight">{en.profiles?.full_name || "Noma'lum"}</h3>
                             <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Full Access Student</p>
                          </div>
                          <div className="space-y-4">
                             <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest italic">
                                <span className="text-slate-400">Total Mastery</span>
                                <span className="text-primary">35%</span>
                             </div>
                             <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-primary" style={{ width: '35%' }} /></div>
                          </div>
                       </div>
                       <Button variant="outline" className="w-full h-16 rounded-[2rem] border-slate-100 font-black uppercase text-[10px] tracking-widest gap-2 group-hover:bg-slate-900 group-hover:text-white transition-all border-none shadow-xl">
                          <UserCheck className="h-5 w-5" /> View Profile
                       </Button>
                    </Card>
                  </motion.div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
             <div className="py-40 text-center space-y-10 bg-white rounded-[5rem] shadow-2xl border-none relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-30" />
                <div className="h-40 w-40 bg-white rounded-[3.5rem] flex items-center justify-center text-primary mx-auto shadow-2xl relative z-10 animate-bounce duration-[3000ms]">
                   <Wand2 className="h-16 w-16" />
                </div>
                <div className="space-y-4 relative z-10">
                   <h2 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Meta Analytics AI</h2>
                   <p className="text-slate-400 font-medium italic text-lg max-w-xl mx-auto leading-relaxed">Sizning o'quvchilaringizning metakognitiv ko'nikmalari va kurs samaradorligini sun'iy intellekt yordamida tahlil qiling.</p>
                </div>
                <Button className="h-20 px-16 rounded-[2.5rem] bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all gap-4 relative z-10">
                   <Zap className="h-6 w-6 text-primary" /> Generate Insights
                </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="rounded-[4rem] p-0 max-w-2xl border-none shadow-2xl bg-white overflow-hidden">
          <div className="bg-slate-900 p-12 text-white relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
             <DialogHeader className="relative z-10">
               <DialogTitle className="text-4xl font-black uppercase italic tracking-tight leading-none">Yangi Dars</DialogTitle>
               <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4">
                  Kurs mundarijasini boyitishni davom eting
               </DialogDescription>
             </DialogHeader>
          </div>
          <div className="p-12 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Dars Sarlavhasi</Label>
              <Input 
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Masalan: JavaScript Metakognitsiyasi" 
                className="h-18 rounded-[2rem] border-slate-100 bg-slate-50/50 shadow-inner px-8 text-lg font-bold focus-visible:ring-primary/20" 
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">YouTube Video URL</Label>
              <div className="relative">
                 <Youtube className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-red-500" />
                 <Input 
                  value={newLesson.video_url}
                  onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="h-18 rounded-[2rem] border-slate-100 bg-slate-50/50 shadow-inner pl-18 pr-8 text-base font-bold" 
                 />
              </div>
            </div>
          </div>
          <div className="p-12 bg-slate-50 border-t border-slate-100 flex gap-4">
            <Button variant="ghost" onClick={() => setAddLessonOpen(false)} className="h-18 flex-1 rounded-[2rem] font-black uppercase text-xs tracking-widest text-slate-400">Bekor qilish</Button>
            <Button onClick={handleAddLesson} disabled={isAddingLesson} className="h-18 flex-2 px-12 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] transition-all">
               {isAddingLesson ? <Loader2 className="h-6 w-6 animate-spin" /> : "Tasdiqlash va Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-[4rem] p-0 max-w-3xl border-none shadow-2xl bg-white overflow-hidden">
          <div className="bg-slate-900 p-12 text-white relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
             <DialogHeader className="relative z-10 flex flex-row items-center justify-between">
               <div>
                  <DialogTitle className="text-4xl font-black uppercase italic tracking-tight leading-none">Kurs Sozlamalari</DialogTitle>
                  <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-4">Platformadagi vizual ko'rinishni tahrirlash</DialogDescription>
               </div>
               <Button onClick={() => setCourseDeleteConfirmOpen(true)} className="h-16 w-16 rounded-3xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border-none">
                  <Trash2 className="h-6 w-6" />
               </Button>
             </DialogHeader>
          </div>
          <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-8">
               <div className="space-y-3">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Kurs Nomi</Label>
                 <Input 
                   value={editCourse.title}
                   onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                   className="h-16 rounded-[2rem] border-slate-100 bg-slate-50/50 shadow-inner px-8 font-bold" 
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Kurs Tavsifi</Label>
                 <Textarea 
                   value={editCourse.description}
                   onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                   className="min-h-[200px] rounded-[3rem] border-slate-100 bg-slate-50/50 shadow-inner p-8 text-base font-medium" 
                 />
               </div>
            </div>
            
            <div className="space-y-8">
               <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Cover Image Preview</Label>
               <div 
                 onClick={() => document.getElementById('edit-course-image-upload')?.click()}
                 className="group relative h-full w-full rounded-[4rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all overflow-hidden shadow-inner min-h-[300px]"
               >
                 {editCourse.image_url ? (
                   <>
                     <img src={editCourse.image_url} className="h-full w-full object-cover" alt="Preview" />
                     <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Upload className="h-10 w-10 text-white" />
                     </div>
                   </>
                 ) : (
                   <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors italic">
                     <Plus className="h-12 w-12 mb-2" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Update Image</span>
                   </div>
                 )}
                 <input 
                   id="edit-course-image-upload" type="file" accept="image/*" className="hidden" 
                   onChange={async (e) => {
                     const file = e.target.files?.[0];
                     if (!file) return;
                     const fileExt = file.name.split('.').pop();
                     const fileName = `${Math.random()}.${fileExt}`;
                     const filePath = `${fileName}`;
                     setIsUploadingImage(true);
                     toast.promise(async () => {
                         const { error: uploadError } = await supabase.storage.from('course_images').upload(filePath, file);
                         if (uploadError) throw uploadError;
                         const { data } = supabase.storage.from('course_images').getPublicUrl(filePath);
                         setEditCourse(prev => ({ ...prev, image_url: data.publicUrl }));
                         setIsUploadingImage(false);
                         return data.publicUrl;
                       }, { loading: 'Uploading...', success: 'Done!', error: 'Error uploading' }
                     );
                   }}
                 />
               </div>
            </div>
          </div>
          <div className="p-12 bg-slate-50 border-t border-slate-100">
            <Button onClick={handleUpdateCourse} disabled={isUpdatingCourse || isUploadingImage} className="h-18 w-full rounded-[2rem] bg-slate-900 text-white font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:scale-[1.01] transition-all">
               {isUpdatingCourse ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save All Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-[3rem] p-12 max-w-md border-none shadow-2xl text-center space-y-6">
           <div className="h-24 w-24 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Trash2 className="h-10 w-10" /></div>
           <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Darsni o'chirish?</h2>
              <p className="text-slate-400 font-medium italic">Ushbu amalni ortga qaytarib bo'lmaydi.</p>
           </div>
           <div className="flex gap-4 pt-4">
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)} className="h-16 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Bekor qilish</Button>
              <Button onClick={handleDeleteLesson} className="h-16 flex-1 rounded-2xl bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100">O'chirish</Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={courseDeleteConfirmOpen} onOpenChange={setCourseDeleteConfirmOpen}>
        <DialogContent className="rounded-[3rem] p-12 max-w-md border-none shadow-2xl text-center space-y-6">
           <div className="h-24 w-24 bg-rose-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
              <Trash2 className="h-10 w-10" />
           </div>
           <div className="space-y-3">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Kursni o'chirish?</h2>
              <p className="text-slate-400 font-medium italic text-sm">Ushbu kurs bilan birga barcha darslar va talabalar ro'yxati o'chib ketadi.</p>
           </div>
           <div className="flex flex-col gap-4 pt-4">
              <Button onClick={handleDeleteCourse} className="h-16 w-full rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">HAYE, BUTUNLAY O'CHIRILSIN</Button>
              <Button variant="ghost" onClick={() => setCourseDeleteConfirmOpen(false)} className="h-16 w-full rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Yo'q, adashdim</Button>
           </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TeacherCourseDetail;
