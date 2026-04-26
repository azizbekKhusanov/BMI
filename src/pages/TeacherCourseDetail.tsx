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
   ChevronRight, BarChart3, Target, Pencil, PlusCircle, Bookmark, Info
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useCallback } from "react";

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
      console.error("Error fetching course data:", error);
      toast.error("Kurs ma'lumotlarini yuklashda xatolik");
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

  const handleUpdateCourse = async () => {
    if (!editCourse.title) return toast.error("Kurs nomini kiriting");
    if (isUploadingImage) return toast.error("Rasm yuklanishini kuting");
    
    setIsUpdatingCourse(true);
    try {
      const { error } = await supabase
        .from("courses")
        .update({
          title: editCourse.title,
          description: editCourse.description,
          image_url: editCourse.image_url
        })
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Kurs sozlamalari saqlandi");
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
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Kurs muvaffaqiyatli o'chirildi");
      navigate("/teacher/courses");
    } catch (error) {
      toast.error("Kursni o'chirishda xatolik yuz berdi");
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
                                onClick={(e) => { 
                                   e.stopPropagation(); 
                                   setLessonToDelete(lesson.id);
                                   setDeleteConfirmOpen(true);
                                }}
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
                        <div className="h-20 w-20 rounded-[1.5rem] bg-white shadow-xl flex items-center justify-center text-3xl font-black text-[#1e293b] overflow-hidden">
                           {en.profiles?.avatar_url ? (
                             <img src={en.profiles.avatar_url} alt={en.profiles?.full_name} className="h-full w-full object-cover" />
                           ) : (
                             en.profiles?.full_name?.[0]
                           )}
                        </div>
                         <div className="space-y-1">
                            <h3 className="text-xl font-bold text-[#1e293b] uppercase tracking-tight">{en.profiles?.full_name || "Ism kiritilmagan"}</h3>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Faol Talaba</p>
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
            <Button onClick={handleAddLesson} disabled={isAddingLesson} className="h-16 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">
               {isAddingLesson ? <Loader2 className="h-5 w-5 animate-spin" /> : "Darsni saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 max-w-md border-none shadow-2xl">
          <DialogHeader className="space-y-4 text-center">
            <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-2">
               <Trash2 className="h-10 w-10" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#1e293b] font-serif uppercase">Darsni o'chirish</DialogTitle>
            <DialogDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               Rostan ham ushbu darsni o'chirmoqchimisiz? <br />Bu amalni ortga qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmOpen(false)} 
              className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200"
            >
               Bekor qilish
            </Button>
            <Button 
              onClick={handleDeleteLesson} 
              className="h-14 flex-1 rounded-2xl bg-red-500 hover:bg-red-600 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100"
            >
               O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-lg border-none shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-[#1e293b] font-serif uppercase">Kurs sozlamalari</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kurs ma'lumotlarini tahrirlang</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6 px-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurs nomi</Label>
                <div className="relative">
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="absolute top-0.5 right-0.5 z-10 h-4 w-4 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-red-100 flex items-center justify-center cursor-help hover:bg-white transition-colors">
                          <Info className="h-2.5 w-2.5 text-red-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-[#1e293b] text-white border-none p-3 rounded-xl shadow-2xl max-w-[200px] z-50">
                        <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                          Kursni o'chirganda undagi darslar va o'quvchilar ro'yxati avtomatik ravishda o'chib ketadi.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => setCourseDeleteConfirmOpen(true)}
                    className="h-10 px-5 rounded-xl text-red-600 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100 transition-all gap-2 font-black uppercase text-[9px] tracking-widest shadow-sm shadow-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Kursni o'chirish
                  </Button>
                </div>
              </div>
              <Input 
                value={editCourse.title}
                onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                placeholder="Kurs nomini kiriting" 
                className="h-14 rounded-xl border-slate-100 bg-slate-50/50 shadow-inner px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Muqova rasmi</Label>
              <div 
                onClick={() => document.getElementById('edit-course-image-upload')?.click()}
                className="group relative h-40 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden shadow-inner"
              >
                {editCourse.image_url ? (
                  <>
                    <img src={editCourse.image_url} className="h-full w-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <Plus className="h-8 w-8 mb-1" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Rasm yuklash</span>
                  </div>
                )}
                <input 
                  id="edit-course-image-upload"
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("Rasm hajmi 2MB dan oshmasligi kerak");
                      return;
                    }

                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Math.random()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    setIsUploadingImage(true);
                    toast.promise(
                      async () => {
                        const { error: uploadError } = await supabase.storage
                          .from('course_images')
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data } = supabase.storage
                          .from('course_images')
                          .getPublicUrl(filePath);

                        setEditCourse(prev => ({ ...prev, image_url: data.publicUrl }));
                        setIsUploadingImage(false);
                        return data.publicUrl;
                      },
                      {
                        loading: 'Rasm yuklanmoqda...',
                        success: 'Rasm muvaffaqiyatli yuklandi!',
                        error: (err) => {
                          setIsUploadingImage(false);
                          return `Xatolik: ${err.message}`;
                        },
                      }
                    );
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurs tavsifi</Label>
              <Textarea 
                value={editCourse.description}
                onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                placeholder="Kurs haqida batafsil ma'lumot..." 
                className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50/50 shadow-inner p-5 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all" 
              />
            </div>

          </div>
          <DialogFooter className="pt-4 border-t border-slate-50">
            <Button onClick={handleUpdateCourse} disabled={isUpdatingCourse || isUploadingImage} className="h-14 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">
               {isUpdatingCourse ? <Loader2 className="h-5 w-5 animate-spin" /> : "O'zgarishlarni saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Delete Confirmation Dialog */}
      <Dialog open={courseDeleteConfirmOpen} onOpenChange={setCourseDeleteConfirmOpen}>
        <DialogContent className="rounded-[2rem] p-8 max-w-md border-none shadow-2xl">
          <DialogHeader className="space-y-4 text-center">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
               <Trash2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-[#1e293b] font-serif uppercase">Kursni o'chirish</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
               Ushbu kursni butunlay o'chirib yubormoqchimisiz? <br />Bu amalni aslo ortga qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCourseDeleteConfirmOpen(false)} 
              className="h-12 flex-1 rounded-xl font-black uppercase text-[9px] tracking-widest border-slate-200"
            >
               Bekor qilish
            </Button>
            <Button 
              onClick={handleDeleteCourse} 
              className="h-12 flex-1 rounded-xl bg-red-500 hover:bg-red-600 font-black uppercase text-[9px] tracking-widest shadow-xl shadow-red-100"
            >
               O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TeacherCourseDetail;
