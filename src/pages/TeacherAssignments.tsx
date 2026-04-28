import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Plus, Filter, FileText, Trash2, Edit2, BookOpen, 
  GraduationCap, CheckCircle2, ClipboardList, Brain, Star, 
  Target, Sparkles, RefreshCcw, Layers, ChevronRight, Zap
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
  courses: Course;
}

interface Test {
  id: string;
  question: string;
  lesson_id: string;
  options: string[];
  correct_answer: string;
  lessons: Lesson;
}

const TeacherAssignments = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("id, title").eq("teacher_id", user.id);
    setCourses(data || []);
  }, [user]);

  const fetchTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tests")
      .select(`
        *,
        lessons!inner (
          id,
          title,
          course_id,
          courses!inner (
            id,
            title,
            teacher_id
          )
        )
      `)
      .eq("lessons.courses.teacher_id", user.id);

    if (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } else {
      setTests((data as unknown as Test[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCourses();
    fetchTests();
  }, [fetchCourses, fetchTests]);

  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    const { error } = await supabase.from("tests").delete().eq("id", testToDelete);
    if (error) {
      toast.error("O'chirishda xatolik");
    } else {
      toast.success("Muvaffaqiyatli o'chirildi");
      fetchTests();
    }
    setDeleteDialogOpen(false);
    setTestToDelete(null);
  };

  const filteredTests = tests.filter((test) => {
    const matchesCourse = selectedCourse === "all" || test.lessons.course_id === selectedCourse;
    const matchesSearch = test.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         test.lessons.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  return (
      <div className="max-w-7xl mx-auto py-10 px-6 lg:px-12 space-y-12 animate-fade-in">
        
        {/* Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <Brain className="h-6 w-6" />
                 </div>
                 <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5">
                    Metacognitive Control
                 </Badge>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase italic tracking-tight leading-none">
                 Vazifalar & <span className="text-primary">Refleksiya</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-lg max-w-2xl leading-relaxed">
                 O'quvchilar o'z bilimini sinashi va tahlil qilishi uchun mo'ljallangan "Reality Check" nuqtalarini boshqarish markazi.
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={fetchTests}
                className="h-16 w-16 rounded-[2rem] border-slate-100 shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                <RefreshCcw className={`h-6 w-6 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button asChild className="h-16 px-10 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] transition-all gap-3">
                <a href="/teacher/courses">
                  <Plus className="h-5 w-5 text-primary" /> Yangi qo'shish
                </a>
              </Button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "Jami Savollar", value: tests.length, icon: ClipboardList, color: "text-primary", bg: "bg-primary/5" },
             { label: "Darslar qamrovi", value: new Set(tests.map(t => t.lesson_id)).size, icon: Layers, color: "text-emerald-500", bg: "bg-emerald-50" },
             { label: "O'rtacha Mastery", value: "84%", icon: Target, color: "text-amber-500", bg: "bg-amber-50" },
             { label: "AI Insights", value: "Active", icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-50" }
           ].map((stat, i) => (
             <Card key={i} className="border-none shadow-xl bg-white rounded-[2.5rem] p-8 flex items-center gap-6 group hover:shadow-2xl transition-all">
                <div className={`h-16 w-16 rounded-3xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                   <stat.icon className="h-8 w-8" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 italic">{stat.label}</p>
                   <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</p>
                </div>
             </Card>
           ))}
        </div>

        {/* Filter Section */}
        <Card className="border-none shadow-2xl bg-white/40 backdrop-blur-xl rounded-[3rem] p-4 lg:p-6 overflow-hidden border border-white/50">
           <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                 <Input 
                   placeholder="Savol yoki dars nomi bo'yicha qidirish..." 
                   className="h-16 pl-16 rounded-[2rem] border-none bg-white shadow-inner text-lg font-bold placeholder:text-slate-300 focus-visible:ring-primary/20 transition-all"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <div className="w-full lg:w-72">
                 <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="h-16 rounded-[2rem] border-none bg-white shadow-inner font-black uppercase text-[10px] tracking-widest px-8">
                       <div className="flex items-center gap-4">
                          <Filter className="h-4 w-4 text-primary" />
                          <SelectValue placeholder="Kursni tanlang" />
                       </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-[2.5rem] border-none shadow-2xl p-4 bg-white/95 backdrop-blur-xl">
                       <SelectItem value="all" className="rounded-xl p-4 font-black text-[10px] uppercase tracking-widest">Barcha Kurslar</SelectItem>
                       {courses.map((course) => (
                         <SelectItem key={course.id} value={course.id} className="rounded-xl p-4 font-black text-[10px] uppercase tracking-widest">{course.title}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
           </div>
        </Card>

        {/* Tests List */}
        <div className="grid gap-6">
           <AnimatePresence mode="popLayout">
              {loading ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-[3.5rem]" />)
              ) : filteredTests.length > 0 ? (
                filteredTests.map((test, index) => (
                  <motion.div 
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group border-none shadow-sm hover:shadow-2xl bg-white rounded-[3.5rem] overflow-hidden transition-all duration-700 relative">
                       <div className="absolute top-0 left-0 w-3 h-full bg-slate-50 group-hover:bg-primary transition-all duration-700" />
                       <CardContent className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                          <div className="flex-1 space-y-6">
                             <div className="flex flex-wrap items-center gap-4">
                                <Badge className="rounded-xl bg-primary/5 text-primary border-none px-4 py-1.5 font-black text-[9px] uppercase tracking-widest italic">
                                   {test.lessons.courses.title}
                                </Badge>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
                                   <BookOpen className="h-3 w-3" /> {test.lessons.title}
                                </div>
                             </div>
                             
                             <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors uppercase italic">
                                {test.question}
                             </h3>

                             <div className="flex flex-wrap gap-3 pt-2">
                                {test.options.map((opt: string, idx: number) => (
                                  <div 
                                    key={idx} 
                                    className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all ${opt === test.correct_answer ? "bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-100/50 scale-105" : "bg-slate-50 text-slate-400 group-hover:bg-white border border-transparent group-hover:border-slate-100"}`}
                                  >
                                    {opt === test.correct_answer ? <Zap className="h-4 w-4 fill-emerald-600" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200" />}
                                    {opt}
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          <div className="flex lg:flex-col items-center gap-4 shrink-0">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => { setTestToDelete(test.id); setDeleteDialogOpen(true); }}
                               className="h-16 w-16 rounded-3xl text-slate-100 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 className="h-7 w-7" />
                             </Button>
                             <Button 
                               variant="outline" 
                               size="icon" 
                               asChild
                               className="h-16 w-16 rounded-[2rem] border-slate-50 bg-white shadow-xl hover:bg-slate-900 hover:text-white transition-all group/btn"
                             >
                                <a href={`/teacher/courses/${test.lessons.course_id}`}>
                                   <Edit2 className="h-6 w-6 text-slate-400 group-hover/btn:text-primary transition-colors" />
                                </a>
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-40 bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-[5rem] flex flex-col items-center gap-8"
                >
                   <div className="h-32 w-32 rounded-[3.5rem] bg-white shadow-2xl flex items-center justify-center text-slate-200">
                      <ClipboardList className="h-16 w-16" />
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-3xl font-black text-slate-400 uppercase italic tracking-tight">Ma'lumotlar topilmadi</h3>
                      <p className="text-slate-400 font-medium italic text-lg max-w-md mx-auto">Filterni o'zgartiring yoki yangi savol qo'shish uchun Kurslarga o'ting.</p>
                   </div>
                   <Button onClick={() => { setSearchQuery(""); setSelectedCourse("all"); }} variant="link" className="text-primary font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-transform">Reset Filters</Button>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-[4rem] p-12 max-w-md border-none shadow-2xl text-center space-y-8 bg-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -translate-y-10 translate-x-10" />
           <div className="h-28 w-28 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner relative z-10">
              <Trash2 className="h-12 w-12" />
           </div>
           <div className="space-y-4 relative z-10">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight leading-none">O'chirishni Tasdiqlaysizmi?</h2>
              <p className="text-slate-400 font-medium italic leading-relaxed">Ushbu savol bazadan butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.</p>
           </div>
           <div className="flex flex-col gap-4 relative z-10">
              <Button onClick={handleDeleteTest} className="h-18 w-full rounded-[2rem] bg-rose-500 text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-rose-100 hover:bg-rose-600 transition-all">HAYE, O'CHIRILSIN</Button>
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="h-16 w-full rounded-[2rem] font-black uppercase text-[10px] tracking-widest text-slate-400">Yo'q, qolsin</Button>
           </div>
        </DialogContent>
      </Dialog>
  );
};

export default TeacherAssignments;
