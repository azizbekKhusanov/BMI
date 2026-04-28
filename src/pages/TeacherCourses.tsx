import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-12 animate-fade-in pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#0056d2] font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                <Sparkles className="h-3 w-3" /> Kurslarni Boshqarish
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Mening Kurslarim</h1>
              <p className="text-slate-500 font-medium max-w-2xl">
                 O'quv dasturlaringizni yaratish va dunyo bo'ylab talabalar bilan baham ko'rish boshqaruv paneli.
              </p>
           </div>

           <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogTrigger asChild>
                    <Button className="h-14 px-8 rounded-2xl bg-[#0056d2] hover:bg-[#00419e] text-white font-bold shadow-lg shadow-blue-100 transition-all gap-3">
                       <Plus className="h-5 w-5" /> Yangi Kurs Yaratish
                    </Button>
                 </DialogTrigger>
                 <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 max-w-2xl overflow-hidden bg-white">
                    <div className="bg-[#0056d2] p-10 text-white relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
                       <DialogHeader className="relative z-10">
                          <DialogTitle className="text-3xl font-black tracking-tight">Yangi Kurs</DialogTitle>
                          <DialogDescription className="text-blue-100 font-bold text-[10px] uppercase tracking-widest mt-2">
                             Akademik sayohatni bugun boshlang
                          </DialogDescription>
                       </DialogHeader>
                    </div>
                    <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs Nomi</Label>
                          <Input 
                            placeholder="Masalan: Metakognitiv Psixologiya" 
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                            className="h-14 rounded-2xl border-slate-100 bg-slate-50 text-base font-bold focus-visible:ring-blue-100"
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
                               className="h-14 pl-16 rounded-2xl border-slate-100 bg-slate-50 font-bold"
                             />
                          </div>
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kurs Tavsifi</Label>
                          <Textarea 
                            placeholder="Kursning maqsad va vazifalari haqida..." 
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                            className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 p-6 text-base font-medium"
                          />
                       </div>

                       <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-6 group cursor-pointer hover:bg-blue-50 transition-all">
                          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-[#0056d2] shadow-sm"><Zap className="h-6 w-6" /></div>
                          <div className="flex-1">
                             <p className="text-[10px] font-black text-[#0056d2] uppercase tracking-widest">AI Power</p>
                             <p className="text-sm font-bold text-slate-700">AI yordamida kurs strukturasini yaratish</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-blue-200 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                    <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
                       <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">Bekor qilish</Button>
                       <Button 
                         onClick={handleCreateCourse} 
                         disabled={isCreating}
                         className="h-14 flex-[2] rounded-2xl bg-[#0056d2] hover:bg-[#00419e] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100 transition-all"
                       >
                         {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kursni Tasdiqlash"}
                       </Button>
                    </div>
                 </DialogContent>
              </Dialog>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400">
                 <Filter className="h-5 w-5" />
              </Button>
           </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#0056d2] transition-colors" />
           <Input 
             placeholder="Mavjud kurslaringizni qidiring..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-16 pl-16 pr-10 rounded-2xl border-slate-100 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-100 transition-all text-base font-medium"
           />
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-[450px] rounded-[2.5rem]" />)}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-24 text-center space-y-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm animate-fade-in">
             <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-slate-200" />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hozircha kurslar yo'q</h3>
                <p className="text-slate-500 font-medium italic">Ilk kursingizni yaratib, bilimlaringizni ulashishni boshlang!</p>
             </div>
             <Button onClick={() => setIsDialogOpen(true)} className="h-12 px-8 rounded-xl bg-blue-50 text-[#0056d2] font-bold border-none hover:bg-blue-100">Boshlash</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {filteredCourses.map((course) => (
               <motion.div
                 key={course.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.3 }}
               >
                 <Link to={`/teacher/courses/${course.id}`} className="group block h-full">
                    <Card className="h-full rounded-[2.5rem] border-none bg-white shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-blue-50/50 hover:-translate-y-2 flex flex-col p-2">
                       <div className="h-52 relative overflow-hidden rounded-[2rem]">
                          <img 
                            src={course.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60"} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                            alt={course.title} 
                          />
                          <div className="absolute top-4 left-4">
                             <Badge className={`${course.is_published ? "bg-emerald-500" : "bg-amber-500"} text-white border-none px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-full shadow-lg`}>
                                {course.is_published ? "Nashr etilgan" : "Qoralama"}
                             </Badge>
                          </div>
                       </div>
                       
                       <CardContent className="p-8 flex flex-col flex-1">
                          <div className="space-y-4 flex-1">
                             <div className="flex items-center gap-2 text-[#0056d2]">
                                <Globe className="h-3.5 w-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Global Academy</span>
                             </div>
                             <h3 className="text-xl font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-[#0056d2] transition-colors">
                                {course.title}
                             </h3>
                             <p className="text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 italic">
                                {course.description || "Ushbu kurs haqida batafsil ma'lumot tez orada qo'shiladi."}
                             </p>
                          </div>

                          <div className="mt-8 space-y-6">
                             <div className="flex items-center justify-between py-4 border-y border-slate-50">
                                <div className="flex items-center gap-3">
                                   <Users className="h-4 w-4 text-[#0056d2]" />
                                   <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{course.studentCount || 0} Talaba</span>
                                </div>
                                <div className="flex items-center gap-3">
                                   <BookOpen className="h-4 w-4 text-[#0056d2]" />
                                   <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{course.lessonCount || 0} Dars</span>
                                </div>
                             </div>

                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center"><Clock className="h-5 w-5 text-slate-300" /></div>
                                   <div>
                                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Yaratildi</p>
                                      <p className="text-[10px] font-bold text-slate-600 uppercase">{new Date(course.created_at).toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' })}</p>
                                   </div>
                                </div>
                                <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-[#0056d2] group-hover:bg-[#0056d2] transition-all">
                                   <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-white transition-all" />
                                </div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 </Link>
               </motion.div>
             ))}
          </div>
        )}
      </div>
  );
};

export default TeacherCourses;
