import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
   BookOpen, Users, Brain, ClipboardList, Activity, ArrowLeft, 
   Plus, Video, FileText, CheckCircle2, MoreVertical, LayoutGrid, Globe,
   Clock, Sparkles, Settings2, Trash2, GraduationCap, TrendingUp,
   MessageSquare, HelpCircle, UserCheck
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
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TeacherCourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addLessonOpen, setAddLessonOpen] = useState(false);
  const [addTestOpen, setAddTestOpen] = useState(false);
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [editCourse, setEditCourse] = useState({ title: "", description: "", image_url: "" });
  const [newLesson, setNewLesson] = useState({ title: "", content_type: "video", video_url: "", content: "" });
  const [editLesson, setEditLesson] = useState<any>(null);

  // Student analytics states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<{ 
    tests: any[], 
    reflections: any[] 
  }>({ tests: [], reflections: [] });
  const [isAnalyticLoading, setIsAnalyticLoading] = useState(false);

  // Messaging states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchCourseData();
    }
  }, [user, id]);

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      // 1. Kurs ma'lumotlari
      const { data: courseData, error: cError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single();
      
      if (cError) throw cError;
      setCourse(courseData);
      setEditCourse({ 
        title: courseData.title, 
        description: courseData.description || "", 
        image_url: courseData.image_url || "" 
      });

      // 2. Darslar
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");
      setLessons(lessonsData || []);

      // 2.1 Test natijalari (Topshiriqlar)
      const lessonIds = (lessonsData || []).map((l: any) => l.id);
      if (lessonIds.length > 0) {
        const { data: resultsData } = await supabase
          .from("test_results")
          .select("id")
          .in("test_id", 
            (await supabase.from("tests").select("id").in("lesson_id", lessonIds)).data?.map((t: any) => t.id) || []
          );
        setTestResults(resultsData || []);
      } else {
        setTestResults([]);
      }

      // 3. Talabalar (Ushbu kursga yozilganlar)
      const { data: enrollData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", id);

      if (enrollError) throw enrollError;

      const safeEnrollments = enrollData || [];
      
      // Profillarni alohida olish (Join xatoligini oldini olish uchun)
      const userIds = [...new Set(safeEnrollments.map(e => e.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        
        const enriched = safeEnrollments.map(e => ({
          ...e,
          profiles: (profilesData || []).find(p => p.user_id === e.user_id)
        }));
        setEnrollments(enriched);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnalytics = async (student: any) => {
    setSelectedStudent(student);
    setIsAnalyticLoading(true);
    try {
      // 1. Test natijalarini olish
      const { data: testResultsData } = await supabase
        .from("test_results")
        .select(`
          *,
          tests (
            question,
            lesson_id,
            lessons (title)
          )
        `)
        .eq("user_id", student.user_id);

      // 2. Refleksiya (Self-assessment) natijalarini olish
      // Kursga tegishli darslar IDlarini to'plash
      const lessonIds = lessons.map(l => l.id);
      const { data: reflectionData } = await supabase
        .from("self_assessments")
        .select(`
          *,
          lessons (title)
        `)
        .eq("user_id", student.user_id)
        .in("lesson_id", lessonIds);

      setStudentAnalytics({
        tests: testResultsData || [],
        reflections: reflectionData || []
      });

      // 3. Xabarlarni yuklash
      fetchMessages(student.user_id);
    } catch (error) {
       console.error("Analytics fetch error:", error);
    } finally {
      setIsAnalyticLoading(false);
    }
  };

  const fetchMessages = async (studentId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
      .or(`sender_id.eq.${studentId},recipient_id.eq.${studentId}`)
      .eq("course_id", id)
      .order("created_at", { ascending: true });
    
    setMessages(data || []);
  };

  useEffect(() => {
    if (!user || !selectedStudent) return;

    // Realtime obuna (Messages)
    const channel = supabase
      .channel('messages-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `course_id=eq.${id}`
      }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === user.id && msg.recipient_id === selectedStudent.user_id) ||
            (msg.sender_id === selectedStudent.user_id && msg.recipient_id === user.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStudent, id, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent || !user) return;
    
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedStudent.user_id,
        course_id: id,
        content: newMessage.trim()
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateCourse = async () => {
    try {
      const { error } = await supabase
        .from("courses")
        .update(editCourse)
        .eq("id", id);
      
      if (error) throw error;
      toast.success("Kurs muvaffaqiyatli yangilandi");
      setSettingsOpen(false);
      fetchCourseData();
    } catch (error) {
      toast.error("O'zgarishlarni saqlashda xatolik");
    }
  };

  const handleDeleteCourse = async () => {
    try {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Kurs o'chirildi");
      window.location.href = "/teacher/courses";
    } catch (error) {
      console.error("Delete course error:", error);
      toast.error("O'chirishda xatolik");
    }
  }

  const handleAddLesson = async () => {
    if (!newLesson.title) return toast.error("Dars nomini kiriting");
    try {
      const { error } = await supabase
        .from("lessons")
        .insert({
          course_id: id,
          title: newLesson.title,
          content_type: newLesson.content_type,
          content_url: newLesson.content_type === 'video' ? newLesson.video_url : null,
          content_text: newLesson.content_type === 'text' ? newLesson.content : null,
          order_index: lessons.length + 1
        });
      
      if (error) throw error;
      toast.success("Yangi dars muvaffaqiyatli qo'shildi");
      setAddLessonOpen(false);
      setNewLesson({ title: "", content_type: "video", video_url: "", content: "" });
      fetchCourseData();
    } catch (error) {
      console.error("Add lesson error:", error);
      toast.error("Dars qo'shishda xatolik");
    }
  };

  const handleEditLesson = async () => {
    if (!editLesson?.title) return toast.error("Dars nomini kiriting");
    try {
      const { error } = await supabase
        .from("lessons")
        .update({
          title: editLesson.title,
          content_type: editLesson.content_type,
          content_url: editLesson.content_type === 'video' ? editLesson.video_url : null,
          content_text: editLesson.content_type === 'text' ? editLesson.content : null,
        })
        .eq("id", editLesson.id);
      
      if (error) throw error;
      toast.success("Dars muvaffaqiyatli yangilandi");
      setIsEditLessonOpen(false);
      setEditLesson(null);
      fetchCourseData();
    } catch (error) {
      console.error("Edit lesson error:", error);
      toast.error("Darsni yangilashda xatolik");
    }
  };

  if (loading) {
    return (
      <Layout>
         <div className="container py-8 space-y-8">
            <Skeleton className="h-20 w-1/3 rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-[3rem]" />
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-8 animate-in fade-in duration-500">
        
        {/* Navigatsiya va Sarlavha */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <Link to="/teacher/courses">
                 <Button variant="ghost" className="rounded-2xl h-12 w-12 p-0 hover:bg-slate-100 border-2">
                    <ArrowLeft className="h-6 w-6" />
                 </Button>
              </Link>
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Badge className={`rounded-full text-[10px] font-black uppercase tracking-widest ${course?.is_published ? "bg-emerald-500" : "bg-orange-500"}`}>
                       {course?.is_published ? "FAOL" : "DRAFT"}
                    </Badge>
                 </div>
                 <h1 className="text-4xl font-black font-serif uppercase">{course?.title}</h1>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              {/* Sozlamalar Dialog */}
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-2xl h-12 border-2 border-slate-200 hover:bg-slate-100 hover:text-indigo-600 transition-all font-bold">
                    <Settings2 className="mr-2 h-5 w-5" /> Sozlamalar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black font-serif">Kurs Sozlamalari</DialogTitle>
                    <DialogDescription>Kurs ma'lumotlarini tahrirlang yoki uni o'chiring.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Kurs nomi</Label>
                       <Input value={editCourse.title} onChange={e => setEditCourse({...editCourse, title: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Tavsif</Label>
                       <Textarea value={editCourse.description} onChange={e => setEditCourse({...editCourse, description: e.target.value})} rows={4} className="rounded-xl bg-muted/20 border-none shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Rasm URL</Label>
                       <Input value={editCourse.image_url} onChange={e => setEditCourse({...editCourse, image_url: e.target.value})} className="rounded-xl h-12 bg-muted/20 border-none shadow-inner" />
                    </div>
                    
                    <div className="pt-4 flex flex-col gap-3">
                       <Button onClick={handleUpdateCourse} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-100 uppercase">O'zgarishlarni Saqlash</Button>
                       
                       <AlertDialog>
                         <AlertDialogTrigger asChild>
                           <Button variant="ghost" className="w-full h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 font-bold uppercase"><Trash2 className="mr-2 h-4 w-4" /> Kursni O'chirish</Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent className="rounded-[2rem] p-8 border-none shadow-2xl">
                           <AlertDialogHeader>
                             <AlertDialogTitle className="text-2xl font-black font-serif">Kursni butunlay o'chirish?</AlertDialogTitle>
                             <AlertDialogDescription className="text-base pt-2">
                               Siz haqiqatan ham **"{course?.title}"** kursini butunlay o'chirib tashlamoqchimisiz? Kurs bilan birga darslar va ma'lumotlar ham o'chib ketadi.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter className="pt-6">
                             <AlertDialogCancel className="rounded-xl border-2 h-12 font-bold">BEKOR QILISH</AlertDialogCancel>
                             <AlertDialogAction 
                               onClick={handleDeleteCourse}
                               className="rounded-xl bg-red-500 hover:bg-red-600 h-12 font-black shadow-lg shadow-red-100"
                             >
                               O'CHIRISH
                             </AlertDialogAction>
                           </AlertDialogFooter>
                         </AlertDialogContent>
                       </AlertDialog>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Yangi Kontent Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                    <Plus className="mr-2 h-5 w-5" /> Yangi kontent
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-2xl p-2 border-none shadow-2xl min-w-[200px]">
                  <DropdownMenuItem onClick={() => setAddLessonOpen(true)} className="rounded-xl p-3 font-bold cursor-pointer">
                    <Video className="mr-3 h-4 w-4 text-blue-500" /> Yangi Dars
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAddTestOpen(true)} className="rounded-xl p-3 font-bold cursor-pointer">
                    <ClipboardList className="mr-3 h-4 w-4 text-orange-500" /> Test yaratish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Tez orada: Topshiriq")} className="rounded-xl p-3 font-bold cursor-pointer">
                    <CheckCircle2 className="mr-3 h-4 w-4 text-emerald-500" /> Topshiriq berish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Yangi Dars Dialog */}
              <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black font-serif">Yangi Dars</DialogTitle>
                    <DialogDescription>Kursga yangi o'quv materiali qo'shish.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Dars nomi</Label>
                       <Input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} placeholder="Masalan: Kirish qismi" className="rounded-xl h-12 bg-muted/20 border-none shadow-inner" />
                    </div>
                    <div className="space-y-2">
                       <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Dars turi</Label>
                       <div className="flex gap-3">
                          <Button 
                            onClick={() => setNewLesson({...newLesson, content_type: 'video'})}
                            variant={newLesson.content_type === 'video' ? 'default' : 'outline'}
                            className="flex-1 rounded-xl h-12 font-bold"
                          >
                             <Video className="mr-2 h-4 w-4" /> Video
                          </Button>
                          <Button 
                            onClick={() => setNewLesson({...newLesson, content_type: 'text'})}
                            variant={newLesson.content_type === 'text' ? 'default' : 'outline'}
                            className="flex-1 rounded-xl h-12 font-bold"
                          >
                             <FileText className="mr-2 h-4 w-4" /> Matn
                          </Button>
                       </div>
                    </div>

                    {newLesson.content_type === 'video' ? (
                       <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Video URL (YouTube/Vimeo)</Label>
                          <Input 
                            value={newLesson.video_url} 
                            onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} 
                            placeholder="https://youtube.com/..." 
                            className="rounded-xl h-12 bg-muted/20 border-none shadow-inner" 
                          />
                       </div>
                    ) : (
                       <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <Label className="font-black text-[10px] uppercase tracking-widest opacity-60">Dars matni</Label>
                          <Textarea 
                            value={newLesson.content} 
                            onChange={e => setNewLesson({...newLesson, content: e.target.value})} 
                            rows={6} 
                            placeholder="Dars mazmunini shu yerga yozing..." 
                            className="rounded-xl bg-muted/20 border-none shadow-inner" 
                          />
                       </div>
                    ) }

                    <Button onClick={handleAddLesson} className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 uppercase tracking-widest">Darsni Qo'shish</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Yangi Test Dialog (Placeholder) */}
              <Dialog open={addTestOpen} onOpenChange={setAddTestOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black font-serif">Test Yaratish</DialogTitle>
                    <DialogDescription>O'quvchilar bilimini tekshirish uchun yangi test.</DialogDescription>
                  </DialogHeader>
                  <div className="py-10 text-center space-y-4">
                     <Brain className="h-16 w-16 text-indigo-200 mx-auto" />
                     <p className="font-bold text-slate-500 uppercase text-xs">Test konstruktori tez orada ishga tushadi...</p>
                     <Button onClick={() => setAddTestOpen(false)} className="rounded-xl px-10">TUSHUNARLI</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Darsni Tahrirlash Dialog */}
              <Dialog open={isEditLessonOpen} onOpenChange={setIsEditLessonOpen}>
                <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black font-serif">Darsni Tahrirlash</DialogTitle>
                    <DialogDescription>Dars ma'lumotlarini o'zgartiring.</DialogDescription>
                  </DialogHeader>
                  {editLesson && (
                    <div className="space-y-6 py-6 font-sans">
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest opacity-60 text-slate-500">Dars nomi</Label>
                        <Input 
                          value={editLesson.title} 
                          onChange={e => setEditLesson({...editLesson, title: e.target.value})} 
                          className="rounded-xl h-12 bg-muted/20 border-none shadow-inner" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black text-[10px] uppercase tracking-widest opacity-60 text-slate-500">Dars turi</Label>
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => setEditLesson({...editLesson, content_type: 'video'})}
                            variant={editLesson.content_type === 'video' ? 'default' : 'outline'}
                            className="flex-1 rounded-xl h-12 font-bold"
                          >
                            <Video className="mr-2 h-4 w-4" /> Video
                          </Button>
                          <Button 
                            onClick={() => setEditLesson({...editLesson, content_type: 'text'})}
                            variant={editLesson.content_type === 'text' ? 'default' : 'outline'}
                            className="flex-1 rounded-xl h-12 font-bold"
                          >
                            <FileText className="mr-2 h-4 w-4" /> Matn
                          </Button>
                        </div>
                      </div>

                      {editLesson.content_type === 'video' ? (
                        <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                          <Label className="font-black text-[10px] uppercase tracking-widest opacity-60 text-slate-500">Video URL</Label>
                          <Input 
                            value={editLesson.content_url || ""} 
                            onChange={e => setEditLesson({...editLesson, content_url: e.target.value})} 
                            className="rounded-xl h-12 bg-muted/20 border-none shadow-inner" 
                            placeholder="https://..."
                          />
                        </div>
                      ) : (
                        <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                          <Label className="font-black text-[10px] uppercase tracking-widest opacity-60 text-slate-500">Dars matni</Label>
                          <Textarea 
                            value={editLesson.content_text || ""} 
                            onChange={e => setEditLesson({...editLesson, content_text: e.target.value})} 
                            rows={6} 
                            className="rounded-xl bg-muted/20 border-none shadow-inner" 
                            placeholder="Dars matni..."
                          />
                        </div>
                      )}

                      <Button onClick={handleEditLesson} className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-100 uppercase tracking-widest">Saqlash</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
           </div>
        </div>

        {/* Tezkor Statistikalar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><Users className="h-6 w-6" /></div>
              <div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase">Talabalar</p>
                 <p className="text-xl font-black">{enrollments.length}</p>
              </div>
           </Card>
           <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner"><Activity className="h-6 w-6" /></div>
              <div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase">O'rt. Progress</p>
                 <p className="text-xl font-black">
                    {enrollments.length > 0 ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / enrollments.length) : 0}%
                 </p>
              </div>
           </Card>
           <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><BookOpen className="h-6 w-6" /></div>
              <div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase">Darslar</p>
                 <p className="text-xl font-black">{lessons.length}</p>
              </div>
           </Card>
           <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner"><ClipboardList className="h-6 w-6" /></div>
              <div>
                 <p className="text-[10px] font-black text-muted-foreground uppercase">Vazifalar & Tahlil</p>
                 <p className="text-xl font-black">{testResults.length} ta nuqta</p>
              </div>
           </Card>
        </div>

        {/* Asosiy Boshqaruv Hududi (Tabs) */}
        <Tabs defaultValue="lessons" className="space-y-8">
           <TabsList className="bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border h-auto flex flex-wrap shadow-2xl shadow-slate-100">
              <TabsTrigger value="lessons" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">
                 <LayoutGrid className="mr-2 h-4 w-4" /> Darslar Rejasi
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">
                 <Users className="mr-2 h-4 w-4" /> Talabalar Nazorati
              </TabsTrigger>
              <TabsTrigger value="tests" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">
                 <ClipboardList className="mr-2 h-4 w-4" /> Vazifalar & Refleksiya
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">
                 <Brain className="mr-2 h-4 w-4" /> Kurs Analitikasi
              </TabsTrigger>
           </TabsList>

           {/* 1. Darslar Tab */}
           <TabsContent value="lessons" className="space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Kurs Kontenti</h2>
                 <Button 
                    onClick={() => setAddLessonOpen(true)}
                    className="rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold transition-all"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Dars qo'shish
                 </Button>
              </div>
              <div className="grid gap-4">
                 {lessons.length > 0 ? lessons.map((lesson, idx) => (
                    <Card key={lesson.id} className="group border-2 border-transparent shadow-xl bg-white rounded-[2rem] p-6 hover:border-indigo-500 hover:shadow-2xl transition-all duration-300">
                       <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center gap-6 flex-1">
                             <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-inner">
                                {idx + 1}
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-slate-800">{lesson.title}</h3>
                                <div className="flex items-center gap-5 mt-2">
                                   <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                                      {lesson.content_type === "video" ? <Video className="h-3.5 w-3.5 text-blue-500" /> : <FileText className="h-3.5 w-3.5 text-orange-500" />}
                                      {lesson.content_type}
                                   </span>
                                   <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                                      <Clock className="h-3.5 w-3.5" /> 15 min
                                   </span>
                                   <Badge className="bg-emerald-50 text-emerald-600 text-[9px] font-black shadow-none border-none">
                                      84% O'zlashtirildi
                                   </Badge>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <Button 
                                onClick={() => {
                                  setEditLesson(lesson);
                                  setIsEditLessonOpen(true);
                                }} 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full h-10 w-10 text-muted-foreground hover:text-indigo-600 transition-all hover:bg-indigo-50"
                              >
                                <Settings2 className="h-5 w-5" />
                              </Button>
                             
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground hover:text-red-500">
                                   <Trash2 className="h-5 w-5" />
                                 </Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent className="rounded-[2rem] p-8 border-none shadow-2xl">
                                 <AlertDialogHeader>
                                   <AlertDialogTitle className="text-2xl font-black font-serif">Darsni o'chirish?</AlertDialogTitle>
                                   <AlertDialogDescription className="text-base pt-2">
                                     Siz haqiqatan ham **"{lesson.title}"** darsini o'chirib tashlamoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.
                                   </AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter className="pt-6">
                                   <AlertDialogCancel className="rounded-xl border-2 h-12 font-bold">BEKOR QILISH</AlertDialogCancel>
                                   <AlertDialogAction 
                                     onClick={async () => {
                                       const { error } = await supabase.from("lessons").delete().eq("id", lesson.id);
                                       if (error) toast.error("O'chirishda xatolik");
                                       else {
                                         toast.success("Dars tizimdan o'chirildi");
                                         fetchCourseData();
                                       }
                                     }}
                                     className="rounded-xl bg-red-500 hover:bg-red-600 h-12 font-black shadow-lg shadow-red-100"
                                   >
                                     O'CHIRISH
                                   </AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                          </div>
                       </div>
                    </Card>
                 )) : (
                    <div className="py-20 text-center border-4 border-dashed rounded-[3rem] bg-muted/10 opacity-50 italic font-bold text-lg">
                       Hali darslar qo'shilmagan...
                    </div>
                 )}
              </div>
           </TabsContent>

           {/* 2. Talabalar Tab */}
           <TabsContent value="students" className="space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Talabalar Progressi</h2>
              </div>
              <div className="grid gap-3">
                  {enrollments.length > 0 ? enrollments.map((e) => (
                    <Card key={e.id} className="group border-none shadow-xl bg-white rounded-[2rem] overflow-hidden hover:shadow-[0_15px_40px_rgba(79,70,229,0.08)] transition-all border-l-[6px] border-l-indigo-400">
                       <div className="p-3 px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div 
                             onClick={() => fetchStudentAnalytics(e)}
                             className="flex items-center gap-4 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                             <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                                   <AvatarImage src={e.profiles?.avatar_url} />
                                   <AvatarFallback className="bg-indigo-50 text-indigo-600 text-sm font-black uppercase leading-none">{e.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white rounded-full p-0.5 border border-white shadow-sm">
                                   <CheckCircle2 className="h-2.5 w-2.5" />
                                </div>
                             </div>
                             <div className="space-y-0">
                                <h4 className="text-base font-black text-slate-800 uppercase leading-tight">{e.profiles?.full_name || "Noma'lum"}</h4>
                                <div className="flex items-center gap-2">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5" /> {new Date(e.created_at).toLocaleDateString()}
                                   </span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex-1 max-w-xs w-full flex items-center gap-3">
                             <div className="flex-1">
                                <Progress value={e.progress} className="h-1.5 bg-emerald-50 rounded-full" />
                             </div>
                             <span className="text-[11px] font-black text-emerald-600 w-8">{e.progress}%</span>
                          </div>
 
                          <div className="flex items-center gap-2">
                             <Button 
                               onClick={() => fetchStudentAnalytics(e)}
                               className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-9 w-9 p-0 text-white shadow-xl shadow-indigo-100 transition-all hover:scale-105"
                             >
                                <MessageSquare className="h-4 w-4" />
                             </Button>
                          </div>
                       </div>
                    </Card>
                  )) : (
                     <div className="py-20 text-center border-4 border-dashed rounded-[3rem] bg-muted/10 opacity-50 italic font-bold text-lg">
                        Ushbu kursda hali talabalar yo'q...
                     </div>
                  )}
              </div>

              {/* Talaba Tahlili Yon Paneli */}
              <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
                <SheetContent className="sm:max-w-md md:max-w-lg rounded-l-[3.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col">
                  {selectedStudent && (
                    <>
                      <div className="bg-indigo-600 p-8 text-white relative">
                        <div className="flex items-center gap-4 relative z-10">
                          <Avatar className="h-16 w-16 border-4 border-white/20 shadow-2xl">
                             <AvatarImage src={selectedStudent.profiles?.avatar_url} />
                             <AvatarFallback className="bg-white/10 text-white text-xl font-black">{selectedStudent.profiles?.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h2 className="text-2xl font-black uppercase tracking-normal leading-none">{selectedStudent.profiles?.full_name}</h2>
                            <p className="text-indigo-100 opacity-60 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                               <GraduationCap className="h-3 w-3" /> Talaba tahliliy hisoboti
                            </p>
                          </div>
                        </div>
                        {/* Background effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/30">
                        {isAnalyticLoading ? (
                          <div className="space-y-4">
                            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                          </div>
                        ) : (
                          <>
                            {/* Analytics Summary */}
                            <div className="grid grid-cols-2 gap-4">
                              <Card className="p-5 rounded-[2.5rem] border-none bg-emerald-500 text-white shadow-xl shadow-emerald-100 flex flex-col justify-between h-32">
                                <Activity className="h-6 w-6 opacity-30" />
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Progress</div>
                                  <div className="text-3xl font-black">{selectedStudent.progress}%</div>
                                </div>
                              </Card>
                              <Card className="p-5 rounded-[2.5rem] border-none bg-indigo-600 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between h-32">
                                <ClipboardList className="h-6 w-6 opacity-30" />
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Testlar</div>
                                  <div className="text-3xl font-black">{studentAnalytics.tests.length} ta</div>
                                </div>
                              </Card>
                            </div>

                            {/* Muloqot (Chat) Section */}
                            <div className="space-y-6">
                              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                <MessageSquare className="h-3.5 w-3.5" /> Muloqot va Fikrlar
                              </h3>
                              
                              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[400px] max-h-[500px]">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                                  {messages.length > 0 ? messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                                        msg.sender_id === user?.id 
                                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                                          : 'bg-white text-slate-700 rounded-tl-none border'
                                      }`}>
                                        {msg.content}
                                        <div className={`text-[9px] mt-1 opacity-50 ${msg.sender_id === user?.id ? 'text-white' : 'text-slate-400'}`}>
                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                    </div>
                                  )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                      <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
                                        <MessageSquare className="h-8 w-8" />
                                      </div>
                                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-loose">Hali muloqot boshlanmagan.<br/>Talabaga birinchi xabarni yuboring!</p>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-white border-t flex gap-2">
                                  <Input 
                                    placeholder="Xabar yozing..." 
                                    className="rounded-xl border-none bg-slate-100 focus-visible:ring-indigo-600"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                  />
                                  <Button 
                                    onClick={sendMessage}
                                    disabled={isSending || !newMessage.trim()}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 shadow-lg shadow-indigo-100"
                                  >
                                    <Activity className="h-5 w-5 transform rotate-90" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Metakognitiv Refleksiya List */}
                            <div className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Brain className="h-3.5 w-3.5" /> Talaba Mullohazalari
                              </h3>
                              {studentAnalytics.reflections.length > 0 ? studentAnalytics.reflections.map((ref: any) => (
                                <div key={ref.id} className="p-6 rounded-[2rem] bg-white border border-slate-100 space-y-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                                  <div className="flex items-center justify-between relative z-10">
                                    <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{ref.lessons.title}</p>
                                    <div className="flex items-center gap-1">
                                      {Array(5).fill(0).map((_, i) => (
                                        <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < ref.rating ? 'bg-indigo-500' : 'bg-indigo-100'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600 leading-relaxed italic relative z-10">
                                    "{ref.reflection}"
                                  </p>
                                </div>
                              )) : (
                                <div className="py-10 text-center bg-muted/20 rounded-[2.5rem] italic text-slate-400 font-bold text-sm">Refleksiya mavjud emas.</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="p-8 border-t bg-white">
                        <Button className="w-full h-14 rounded-2xl bg-slate-900 border-none hover:bg-black font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 text-white flex items-center justify-center gap-3">
                           <GraduationCap className="h-5 w-5" /> Talabani yakuniy baholash
                        </Button>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
           </TabsContent>

           {/* 3. Analytics Tab (Metakognitiv) */}
           <TabsContent value="analytics" className="space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                 <h2 className="text-2xl font-black font-serif italic text-slate-800">03. Metakognitiv Insights</h2>
                 <Badge className="bg-indigo-600 px-6 py-2 rounded-full text-xs font-black shadow-xl shadow-indigo-100">JONLI TAHLIL</Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 {/* Qiyin Darslar Chart Placeholder */}
                 <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black uppercase text-slate-700">Qiyin Darslar Tahlili</h3>
                       <TrendingUp className="h-6 w-6 text-orange-500" />
                    </div>
                    <div className="space-y-6">
                       <p className="text-muted-foreground text-sm leading-relaxed">O'quvchilar tomonidan eng past baholangan (tushunarli darajasi bo'yicha) darslar.</p>
                       <div className="space-y-4">
                          {[
                             { name: "Metakognitiv asoslar", rate: 42, color: "bg-red-500" },
                             { name: "Self-regulation", rate: 58, color: "bg-orange-500" },
                             { name: "Fikrni jamlash", rate: 76, color: "bg-yellow-500" },
                          ].map(l => (
                             <div key={l.name} className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase"><span className="text-slate-500">{l.name}</span> <span className="text-slate-700">{l.rate}% IQ</span></div>
                                <Progress value={l.rate} className="h-3" />
                             </div>
                          ))}
                       </div>
                    </div>
                 </Card>

                 {/* Top Talabalar */}
                 <Card className="border-none shadow-2xl bg-white rounded-[3rem] p-10 space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black uppercase text-slate-700">Etalon Talabalar</h3>
                       <UserCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="space-y-6">
                       {enrollments.slice(0, 3).map((e, i) => (
                          <div key={e.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-muted-foreground/5">
                             <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">{i+1}</div>
                                <span className="font-bold text-slate-700 uppercase text-xs">{e.profiles?.full_name}</span>
                             </div>
                             <Badge className="bg-emerald-50 text-emerald-600 font-black border-none shadow-none">{e.progress}%</Badge>
                          </div>
                       ))}
                       <Button variant="ghost" className="w-full rounded-2xl h-12 text-indigo-600 font-bold hover:bg-indigo-50">BATAFSIL KO'RISH</Button>
                    </div>
                 </Card>
              </div>
           </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeacherCourseDetail;
