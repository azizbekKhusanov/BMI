import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, BookOpen, Search, Filter, MoreVertical, 
  Edit, Trash2, Sparkles, Wand2, LayoutGrid, 
  Users, GraduationCap, ArrowRight, Clock, 
  Loader2, Camera, Zap, ChevronRight, Globe
} from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
  teacher_id: string;
  created_at: string;
  studentCount?: number;
  lessonCount?: number;
}

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    image_url: ""
  });

  const fetchTeacherCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (coursesData && coursesData.length > 0) {
        const [enrollmentsRes, lessonsRes] = await Promise.all([
          supabase.from("enrollments").select("course_id"),
          supabase.from("lessons").select("course_id")
        ]);

        const allEnrollments = enrollmentsRes.data || [];
        const allLessons = lessonsRes.data || [];

        const mappedCourses = (coursesData as Course[]).map(course => ({
          ...course,
          studentCount: allEnrollments.filter(e => e.course_id === course.id).length,
          lessonCount: allLessons.filter(l => l.course_id === course.id).length
        }));
        
        setCourses(mappedCourses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      toast.error("Kurslarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeacherCourses();
  }, [fetchTeacherCourses]);

  const handleCreateCourse = async () => {
    if (!newCourse.title) {
      toast.error("Kurs nomini kiriting");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          image_url: newCourse.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60",
          teacher_id: user?.id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Kurs muvaffaqiyatli yaratildi!");
      setIsDialogOpen(false);
      navigate(`/teacher/courses/${data.id}`);
    } catch (error) {
      toast.error("Kurs yaratishda xatolik");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-12 animate-fade-in">
        
        {/* Modern Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Sparkles className="h-7 w-7" />
                 </div>
                 <div>
                    <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 mb-1">Akademiya Boshqaruvi</Badge>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Mening Kurslarim</h1>
                 </div>
              </div>
              <p className="text-slate-400 text-sm font-medium max-w-2xl italic leading-relaxed">
                 O'quv dasturlaringizni yaratish, boyitish va dunyo bo'ylab talabalar bilan baham ko'rish uchun markazlashgan boshqaruv paneli.
              </p>
           </div>

           <div className="flex flex-wrap items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogTrigger asChild>
                    <Button className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all gap-3">
                       <Plus className="h-5 w-5" /> Yangi Kurs Yaratish
                    </Button>
                 </DialogTrigger>
                 <DialogContent className="rounded-[4rem] border-none shadow-2xl p-0 max-w-2xl overflow-hidden bg-white">
                    <div className="bg-slate-900 p-10 text-white relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
                       <DialogHeader className="relative z-10">
                          <DialogTitle className="text-3xl font-black uppercase italic tracking-tight">Yangi Kurs</DialogTitle>
                          <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                             Akademik sayohatni bugun boshlang
                          </DialogDescription>
                       </DialogHeader>
                    </div>
                    <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs Nomi</Label>
                          <Input 
                            placeholder="Masalan: Metakognitiv Psixologiya" 
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                            className="h-16 rounded-2xl border-slate-100 bg-slate-50/50 text-base font-bold focus-visible:ring-primary/20"
                          />
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Muqova rasmi (URL)</Label>
                          <div className="relative">
                             <Camera className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                             <Input 
                               placeholder="Rasm manzilini kiriting..." 
                               value={newCourse.image_url}
                               onChange={(e) => setNewCourse({...newCourse, image_url: e.target.value})}
                               className="h-16 pl-16 rounded-2xl border-slate-100 bg-slate-50/50"
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs Tavsifi</Label>
                          <Textarea 
                            placeholder="Kursning maqsad va vazifalari haqida..." 
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                            className="min-h-[150px] rounded-3xl border-slate-100 bg-slate-50/50 p-8 text-base font-medium"
                          />
                       </div>

                       <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-center gap-6 group cursor-pointer hover:bg-indigo-100 transition-all">
                          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm"><Zap className="h-6 w-6" /></div>
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Power</p>
                             <p className="text-sm font-bold text-indigo-900">AI yordamida kurs strukturasini yaratish</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                    <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                       <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-16 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400">Bekor qilish</Button>
                       <Button 
                         onClick={handleCreateCourse} 
                         disabled={isCreating}
                         className="h-16 flex-2 px-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] transition-all"
                       >
                         {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kursni Tasdiqlash"}
                       </Button>
                    </div>
                 </DialogContent>
              </Dialog>
              <Button variant="outline" className="h-16 w-16 rounded-2xl border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all">
                 <Filter className="h-5 w-5 text-slate-400" />
              </Button>
           </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
           <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-primary transition-colors" />
           <Input 
             placeholder="Mavjud kurslaringizni qidiring..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-20 pl-20 pr-10 rounded-[2.5rem] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] focus-visible:ring-2 focus-visible:ring-primary/10 transition-all text-lg font-medium italic"
           />
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] rounded-[4rem]" />)}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-32 text-center space-y-8 animate-fade-in">
             <div className="h-32 w-32 rounded-[3rem] bg-slate-100 flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="h-12 w-12 text-slate-300" />
             </div>
             <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Hozircha kurslar yo'q</h3>
                <p className="text-slate-400 font-medium italic">Ilk kursingizni yaratib, bilimlaringizni ulashishni boshlang!</p>
             </div>
             <Button onClick={() => setIsDialogOpen(true)} className="h-14 px-10 rounded-2xl bg-primary/10 text-primary font-black uppercase text-xs tracking-widest border-none">Boshlash</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {filteredCourses.map((course) => (
               <Link key={course.id} to={`/teacher/courses/${course.id}`} className="group relative">
                  <Card className="h-[520px] rounded-[4rem] border-none bg-white shadow-[0_20px_60px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 flex flex-col">
                     <div className="h-56 relative overflow-hidden">
                        <img 
                          src={course.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60"} 
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          alt={course.title} 
                        />
                        <div className="absolute top-6 left-6 flex gap-2">
                           <Badge className={`${course.is_published ? "bg-emerald-500 shadow-emerald-200" : "bg-amber-500 shadow-amber-200"} text-white border-none px-4 py-1.5 font-black text-[9px] uppercase shadow-xl tracking-[0.2em] rounded-full`}>
                              {course.is_published ? "Published" : "Draft"}
                           </Badge>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                     
                     <CardContent className="p-10 flex flex-col flex-1 gap-6">
                        <div className="space-y-3">
                           <div className="flex items-center gap-2 text-primary">
                              <Globe className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Global Academy</span>
                           </div>
                           <h3 className="text-2xl font-black text-slate-900 line-clamp-2 uppercase italic tracking-tight leading-tight group-hover:text-primary transition-colors">
                              {course.title}
                           </h3>
                           <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 italic">
                              {course.description || "Ushbu kurs haqida batafsil ma'lumot tez orada qo'shiladi."}
                           </p>
                        </div>

                        <div className="mt-auto space-y-6">
                           <div className="flex items-center justify-between py-4 border-y border-slate-50">
                              <div className="flex items-center gap-2.5">
                                 <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center"><Users className="h-4 w-4 text-slate-400" /></div>
                                 <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{course.studentCount || 0} Talaba</span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                 <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center"><BookOpen className="h-4 w-4 text-slate-400" /></div>
                                 <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{course.lessonCount || 0} Dars</span>
                              </div>
                           </div>

                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center"><Clock className="h-5 w-5 text-primary/40" /></div>
                                 <div>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Yaratildi</p>
                                    <p className="text-[10px] font-bold text-slate-600">{new Date(course.created_at).toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' })}</p>
                                 </div>
                              </div>
                              <div className="h-12 w-12 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-primary group-hover:bg-primary transition-all">
                                 <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               </Link>
             ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherCourses;
