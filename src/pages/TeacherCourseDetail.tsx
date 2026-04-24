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
   MessageSquare, HelpCircle, UserCheck, Wand2, Search
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
  const navigate = useNavigate();
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

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", id)
        .order("order_index");
      setLessons(lessonsData || []);

      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", id);

      const safeEnrollments = enrollData || [];
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
      toast.error("Kurs ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
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
      navigate("/teacher/courses");
    } catch (error) {
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
      toast.error("Dars qo'shishda xatolik");
    }
  };

  if (loading) {
    return (
      <Layout>
         <div className="space-y-10">
            <Skeleton className="h-20 w-1/3 rounded-2xl" />
            <Skeleton className="h-[500px] w-full rounded-[3rem]" />
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-700">
        
        {/* Navigation & Header */}
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
                onClick={() => setSettingsOpen(true)}
                className="rounded-2xl h-14 px-8 border-slate-200 bg-white shadow-sm hover:bg-slate-50 font-bold text-[10px] uppercase tracking-widest text-slate-500 gap-2"
              >
                <Settings2 className="h-5 w-5" /> Kurs Sozlamalari
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-2xl h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-widest uppercase shadow-lg shadow-indigo-100 transition-all gap-2">
                    <Plus className="h-5 w-5" /> Yangi kontent
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[1.5rem] p-2 border-none shadow-2xl min-w-[220px]">
                  <DropdownMenuItem onClick={() => setAddLessonOpen(true)} className="rounded-xl p-4 font-bold cursor-pointer text-xs uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                    <Video className="mr-3 h-4 w-4 text-indigo-500" /> Yangi Dars Qo'shish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAddTestOpen(true)} className="rounded-xl p-4 font-bold cursor-pointer text-xs uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600">
                    <ClipboardList className="mr-3 h-4 w-4 text-amber-500" /> Test Yaratish
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: "Talabalar", value: enrollments.length, icon: Users, color: "bg-blue-50 text-blue-600" },
             { label: "Darslar", value: lessons.length, icon: BookOpen, color: "bg-indigo-50 text-indigo-600" },
             { label: "O'rt. O'zlashtirish", value: "78%", icon: Activity, color: "bg-emerald-50 text-emerald-600" },
             { label: "Vazifalar", value: "12", icon: ClipboardList, color: "bg-amber-50 text-amber-600" },
           ].map((stat, i) => (
             <Card key={i} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[2rem] p-6 flex items-center gap-4 group hover:scale-[1.02] transition-transform">
                <div className={`h-12 w-12 rounded-2xl ${stat.color} flex items-center justify-center shadow-sm`}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-2xl font-bold text-slate-800 font-serif">{stat.value}</p>
                </div>
             </Card>
           ))}
        </div>

        {/* Main Interface */}
        <Tabs defaultValue="lessons" className="space-y-8">
           <TabsList className="bg-white/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white h-auto flex flex-wrap shadow-sm">
              <TabsTrigger value="lessons" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-[#1e293b] data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest transition-all gap-2">
                 <LayoutGrid className="h-4 w-4" /> Darslar Rejasi
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-[#1e293b] data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest transition-all gap-2">
                 <Users className="h-4 w-4" /> Talabalar Nazorati
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-[2rem] px-8 py-4 data-[state=active]:bg-[#1e293b] data-[state=active]:text-white font-bold text-[10px] uppercase tracking-widest transition-all gap-2">
                 <Brain className="h-4 w-4" /> Metakognitiv Tahlil
              </TabsTrigger>
           </TabsList>

           <TabsContent value="lessons" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-2xl font-bold text-slate-800 font-serif uppercase tracking-tight">Kurs Mundarijasi</h2>
                 <Button onClick={() => setAddLessonOpen(true)} variant="ghost" className="rounded-xl text-indigo-600 font-bold text-[10px] uppercase tracking-widest gap-2 hover:bg-indigo-50">
                    <Plus className="h-4 w-4" /> Dars qo'shish
                 </Button>
              </div>
              
              {lessons.length === 0 ? (
                <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-slate-200">
                   <CardContent className="space-y-4">
                      <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto text-slate-200">
                         <BookOpen className="h-8 w-8" />
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hali birorta ham dars qo'shilmagan</p>
                   </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                   {lessons.map((lesson, idx) => (
                     <Card key={lesson.id} className="group border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between gap-6">
                           <div className="flex items-center gap-6 flex-1">
                              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                                 {idx + 1}
                              </div>
                              <div>
                                 <h3 className="text-xl font-bold text-slate-800 font-serif">{lesson.title}</h3>
                                 <div className="flex items-center gap-4 mt-1.5">
                                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                       {lesson.content_type === "video" ? <Video className="h-3.5 w-3.5 text-indigo-500" /> : <FileText className="h-3.5 w-3.5 text-amber-500" />}
                                       {lesson.content_type}
                                    </span>
                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">12:45 minut</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
                                 <Edit className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50">
                                 <Trash2 className="h-5 w-5" />
                              </Button>
                           </div>
                        </div>
                     </Card>
                   ))}
                </div>
              )}
           </TabsContent>

           {/* More tabs like students/analytics would go here with same styling */}
           <TabsContent value="students">
              <Card className="border-none shadow-sm bg-white rounded-[2.5rem] p-12 text-center">
                 <Users className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                 <h3 className="text-2xl font-bold font-serif text-slate-800 uppercase mb-2">Talabalar Ro'yxati</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Ushbu kursga {enrollments.length} ta talaba yozilgan</p>
                 <div className="grid gap-4 max-w-2xl mx-auto">
                    {enrollments.map((e, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10 border-2 border-white">
                                <AvatarImage src={e.profiles?.avatar_url} />
                                <AvatarFallback className="bg-indigo-500 text-white font-bold">{e.profiles?.full_name?.[0]}</AvatarFallback>
                             </Avatar>
                             <div className="text-left">
                                <p className="text-sm font-bold text-slate-800">{e.profiles?.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{e.progress}% TUGALLADI</p>
                             </div>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-xl font-bold text-[9px] uppercase tracking-widest">Tahlil</Button>
                       </div>
                    ))}
                 </div>
              </Card>
           </TabsContent>
        </Tabs>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 max-w-lg">
           <DialogHeader className="space-y-3 mb-6">
              <DialogTitle className="text-3xl font-bold font-serif text-slate-800 uppercase tracking-tight">Kurs Sozlamalari</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-sm">Kurs ma'lumotlarini tahrirlang yoki ushbu kursni o'chirib tashlang.</DialogDescription>
           </DialogHeader>
           <div className="space-y-6 mb-8">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurs Nomi</Label>
                 <Input value={editCourse.title} onChange={e => setEditCourse({...editCourse, title: e.target.value})} className="h-14 rounded-2xl border-slate-100 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurs Tavsifi</Label>
                 <Textarea value={editCourse.description} onChange={e => setEditCourse({...editCourse, description: e.target.value})} rows={4} className="rounded-2xl border-slate-100 bg-slate-50/50 py-4" />
              </div>
           </div>
           <DialogFooter className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={() => setSettingsOpen(false)} className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest text-slate-400">Bekor qilish</Button>
              <Button onClick={handleUpdateCourse} className="rounded-2xl h-12 flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">O'zgarishlarni Saqlash</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 max-w-lg">
           <DialogHeader className="space-y-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                <Wand2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-bold font-serif text-slate-800 uppercase tracking-tight">Yangi Dars Qo'shish</DialogTitle>
           </DialogHeader>
           <div className="space-y-6 mb-8">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dars Nomi</Label>
                 <Input value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} placeholder="Masalan: Kirish qismi" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kontent Turi</Label>
                 <div className="flex gap-3">
                    <Button 
                      variant={newLesson.content_type === 'video' ? 'default' : 'outline'}
                      onClick={() => setNewLesson({...newLesson, content_type: 'video'})}
                      className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                    >Video</Button>
                    <Button 
                      variant={newLesson.content_type === 'text' ? 'default' : 'outline'}
                      onClick={() => setNewLesson({...newLesson, content_type: 'text'})}
                      className="flex-1 h-12 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                    >Matn</Button>
                 </div>
              </div>
              {newLesson.content_type === 'video' && (
                <div className="space-y-2">
                   <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">YouTube/Vimeo URL</Label>
                   <Input value={newLesson.video_url} onChange={e => setNewLesson({...newLesson, video_url: e.target.value})} placeholder="https://..." className="h-14 rounded-2xl border-slate-100 bg-slate-50/50" />
                </div>
              )}
           </div>
           <DialogFooter>
              <Button onClick={handleAddLesson} className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Darsni Qo'shish</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
};

export default TeacherCourseDetail;
