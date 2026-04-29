import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
   BookOpen, Users, Brain, ClipboardList, ArrowLeft, 
   Plus, Video, FileText, Globe, Clock, Settings2, Trash2, 
   UserCheck, Youtube, ChevronRight, PlusCircle, Upload, Loader2, LayoutIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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
  progress: number;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const TeacherCourseDetail = () => {
  const { id } = useParams();
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
      <div className="max-w-6xl mx-auto space-y-8 p-8">
        <Skeleton className="h-10 w-1/3 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <Link to="/teacher/courses">
                 <Button variant="outline" className="h-10 w-10 rounded-lg border-slate-200 shadow-sm p-0 flex items-center justify-center text-slate-500">
                    <ArrowLeft className="h-4 w-4" />
                 </Button>
              </Link>
              <div>
                 <div className="flex items-center gap-3 mb-1">
                    <Badge className={`${course?.is_published ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} border-none font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded`}>
                       {course?.is_published ? "Nashr etilgan" : "Qoralama"}
                    </Badge>
                 </div>
                 <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">{course?.title}</h1>
              </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                onClick={togglePublish}
                className={`h-10 px-4 rounded-lg font-medium text-sm transition-all border-slate-200 shadow-sm ${course?.is_published ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
              >
                {course?.is_published ? <Clock className="h-4 w-4 mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                {course?.is_published ? "Qoralamaga o'tkazish" : "Nashr etish"}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setSettingsOpen(true)}
                className="h-10 px-4 rounded-lg bg-white border border-slate-200 shadow-sm font-medium text-sm text-slate-700 hover:bg-slate-50"
              >
                <Settings2 className="h-4 w-4 mr-2" /> Sozlamalar
              </Button>
              
              <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <Button className="h-10 px-4 rounded-lg bg-[#0056d2] hover:bg-[#00419e] text-white font-medium text-sm shadow-sm">
                       <PlusCircle className="h-4 w-4 mr-2" /> Yangi Kontent
                    </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56 rounded-xl border border-slate-200 shadow-md p-2 bg-white">
                    <DropdownMenuItem onClick={() => setAddLessonOpen(true)} className="rounded-md p-3 cursor-pointer font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                       <Video className="h-4 w-4 mr-3 text-slate-400" />
                       Dars qo'shish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAddTestOpen(true)} className="rounded-md p-3 cursor-pointer font-medium text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                       <ClipboardList className="h-4 w-4 mr-3 text-slate-400" />
                       Test yaratish
                    </DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>

        {/* Unified Tabs System */}
        <Tabs defaultValue="curriculum" className="w-full" onValueChange={setActiveTab}>
          <div className="mb-8 border-b border-slate-200">
             <TabsList className="bg-transparent border-none p-0 h-auto space-x-6">
               {[
                 { id: "curriculum", label: "Darslar", icon: LayoutIcon },
                 { id: "students", label: "Talabalar", icon: Users },
                 { id: "analytics", label: "AI Tahlil", icon: Brain }
               ].map(t => (
                 <TabsTrigger 
                   key={t.id} 
                   value={t.id} 
                   className="rounded-none border-b-2 border-transparent px-2 py-3 text-sm font-semibold text-slate-500 data-[state=active]:border-[#0056d2] data-[state=active]:text-[#0056d2] data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors"
                 >
                   <t.icon className="h-4 w-4 mr-2" /> {t.label}
                 </TabsTrigger>
               ))}
             </TabsList>
          </div>

          <TabsContent value="curriculum" className="space-y-6 focus-visible:outline-none">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                   Kurs Mundarijasi
                </h2>
                <Badge className="bg-slate-100 text-slate-500 border-none font-medium text-xs rounded-md">
                   {lessons.length} ta dars
                </Badge>
             </div>

             <div className="grid gap-4">
                {lessons.length === 0 ? (
                   <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                         <Plus className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-lg font-bold text-slate-900">Kurs hali bo'sh</h3>
                         <p className="text-sm text-slate-500 font-medium">Birinchi darsni qo'shish orqali kursingizni shakllantiring.</p>
                      </div>
                      <Button onClick={() => setAddLessonOpen(true)} variant="link" className="text-[#0056d2] font-semibold text-sm">Dars qo'shish</Button>
                   </div>
                ) : (
                   lessons.map((lesson) => (
                       <Card 
                         key={lesson.id}
                         onClick={() => navigate(`/lessons/${lesson.id}`)}
                         className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md bg-white p-4 cursor-pointer transition-shadow flex flex-col md:flex-row items-center justify-between gap-4"
                       >
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                {lesson.content_type === 'video' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                             </div>
                             <div>
                                <div className="flex items-center gap-2 mb-1">
                                   <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-semibold uppercase tracking-wide rounded">
                                     {lesson.content_type}
                                   </Badge>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 leading-none">{lesson.title}</h3>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setLessonToDelete(lesson.id);
                                  setDeleteConfirmOpen(true);
                               }}
                               className="h-8 w-8 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                             <div className="h-8 w-8 rounded-md text-slate-400 flex items-center justify-center">
                                <ChevronRight className="h-5 w-5" />
                             </div>
                          </div>
                       </Card>
                   ))
                )}
             </div>
          </TabsContent>

          <TabsContent value="students" className="mt-0 focus-visible:outline-none">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((en) => (
                    <Card key={en.id} className="rounded-xl border border-slate-200 shadow-sm bg-white p-6 flex flex-col">
                       <div className="flex items-center gap-4 mb-6">
                          <Avatar className="h-14 w-14 rounded-full border border-slate-100">
                             <AvatarImage src={en.profiles?.avatar_url || undefined} />
                             <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-lg">{en.profiles?.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                             <h3 className="text-base font-bold text-slate-900 leading-tight">{en.profiles?.full_name || "Noma'lum"}</h3>
                             <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Talaba</p>
                          </div>
                       </div>
                       <div className="space-y-3 mb-6 flex-1">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                             <span>O'zlashtirish</span>
                             <span className="font-bold text-slate-900">{en.progress || 0}%</span>
                          </div>
                          <Progress value={en.progress || 0} className="h-2 rounded-full bg-slate-100" />
                       </div>
                       <Button variant="outline" className="w-full h-10 rounded-lg border-slate-200 font-semibold text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <UserCheck className="h-4 w-4 mr-2" /> Profilni ko'rish
                       </Button>
                    </Card>
                ))}
                {enrollments.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-500 font-medium border border-dashed border-slate-200 rounded-xl">
                    Hozircha kursga yozilgan talabalar yo'q.
                  </div>
                )}
             </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
             <div className="py-24 text-center space-y-6 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="h-16 w-16 bg-blue-50 rounded-lg flex items-center justify-center text-[#0056d2] mx-auto">
                   <Brain className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                   <h2 className="text-2xl font-bold text-slate-900">Metakognitiv Tahlil</h2>
                   <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
                     Sizning o'quvchilaringizning metakognitiv ko'nikmalari va kurs samaradorligini sun'iy intellekt yordamida tahlil qiling.
                   </p>
                </div>
                <Button className="h-10 px-8 rounded-lg bg-[#0056d2] text-white font-medium text-sm shadow-sm hover:bg-[#00419e] transition-colors mt-4">
                   <Brain className="h-4 w-4 mr-2" /> Tahlil qilish
                </Button>
             </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="rounded-xl p-0 max-w-xl border border-slate-200 shadow-lg bg-white overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-6">
             <DialogHeader>
               <DialogTitle className="text-xl font-bold text-slate-900">Yangi Dars</DialogTitle>
               <DialogDescription className="text-slate-500 font-medium text-sm mt-1">
                  Kurs mundarijasini boyitishni davom eting
               </DialogDescription>
             </DialogHeader>
          </div>
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Dars Sarlavhasi</Label>
              <Input 
                value={newLesson.title}
                onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                placeholder="Masalan: JavaScript asoslari" 
                className="h-10 rounded-lg border-slate-200 font-medium" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">YouTube Video URL</Label>
              <div className="relative">
                 <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                  value={newLesson.video_url}
                  onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="h-10 rounded-lg border-slate-200 pl-9 font-medium" 
                 />
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
            <Button variant="outline" onClick={() => setAddLessonOpen(false)} className="h-10 flex-1 rounded-lg font-medium text-slate-600 border-slate-200">Bekor qilish</Button>
            <Button onClick={handleAddLesson} disabled={isAddingLesson} className="h-10 flex-[2] rounded-lg bg-[#0056d2] text-white font-medium hover:bg-[#00419e] transition-colors">
               {isAddingLesson ? <Loader2 className="h-4 w-4 animate-spin" /> : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-xl p-0 max-w-2xl border border-slate-200 shadow-lg bg-white overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
             <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Kurs Sozlamalari</DialogTitle>
             </div>
             <Button onClick={() => setCourseDeleteConfirmOpen(true)} variant="ghost" className="h-10 w-10 p-0 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                <Trash2 className="h-5 w-5" />
             </Button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-5">
               <div className="space-y-2">
                 <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kurs Nomi</Label>
                 <Input 
                   value={editCourse.title}
                   onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                   className="h-10 rounded-lg border-slate-200 font-medium" 
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kurs Tavsifi</Label>
                 <Textarea 
                   value={editCourse.description}
                   onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                   className="min-h-[120px] rounded-lg border-slate-200 font-medium text-sm p-3" 
                 />
               </div>
            </div>
            
            <div className="space-y-2">
               <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Muqova Rasmi</Label>
               <div 
                 onClick={() => document.getElementById('edit-course-image-upload')?.click()}
                 className="group relative h-40 w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-[#0056d2]/40 hover:bg-[#0056d2]/5 transition-colors overflow-hidden"
               >
                 {editCourse.image_url ? (
                   <>
                     <img src={editCourse.image_url} className="h-full w-full object-cover" alt="Preview" />
                     <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-6 w-6 text-white" />
                     </div>
                   </>
                 ) : (
                   <div className="flex flex-col items-center text-slate-400">
                     <Plus className="h-6 w-6 mb-1" />
                     <span className="text-xs font-medium">Rasm yuklash</span>
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
                       }, { loading: 'Yuklanmoqda...', success: 'Yuklandi!', error: 'Yuklashda xatolik' }
                     );
                   }}
                 />
               </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <Button onClick={handleUpdateCourse} disabled={isUpdatingCourse || isUploadingImage} className="h-10 w-full rounded-lg bg-[#0056d2] text-white font-medium hover:bg-[#00419e] transition-colors">
               {isUpdatingCourse ? <Loader2 className="h-4 w-4 animate-spin" /> : "Saqlash"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="rounded-xl p-6 max-w-sm border border-slate-200 shadow-lg text-center space-y-4">
           <div className="h-12 w-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
             <Trash2 className="h-6 w-6" />
           </div>
           <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Darsni o'chirish?</h2>
              <p className="text-slate-500 text-sm font-medium">Ushbu amalni ortga qaytarib bo'lmaydi.</p>
           </div>
           <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="h-10 flex-1 rounded-lg font-medium text-slate-600 border-slate-200">Bekor qilish</Button>
              <Button onClick={handleDeleteLesson} className="h-10 flex-1 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700">O'chirish</Button>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={courseDeleteConfirmOpen} onOpenChange={setCourseDeleteConfirmOpen}>
        <DialogContent className="rounded-xl p-6 max-w-sm border border-slate-200 shadow-lg text-center space-y-4">
           <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
           </div>
           <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Kursni o'chirish?</h2>
              <p className="text-slate-500 font-medium text-sm">Ushbu kurs bilan birga barcha darslar va talabalar ro'yxati o'chib ketadi.</p>
           </div>
           <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleDeleteCourse} className="h-10 w-full rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700">HAYE, O'CHIRILSIN</Button>
              <Button variant="ghost" onClick={() => setCourseDeleteConfirmOpen(false)} className="h-10 w-full rounded-lg font-medium text-slate-600">Bekor qilish</Button>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeacherCourseDetail;
