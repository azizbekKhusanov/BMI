import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Plus, Filter, Trash2, Edit2, BookOpen, 
  CheckCircle2, ClipboardList, Brain, 
  Target, Sparkles, RefreshCcw, Layers
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [avgMastery, setAvgMastery] = useState(0);

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
      const testsData = (data as unknown as Test[]) || [];
      setTests(testsData);
      
      if (testsData.length > 0) {
        const testIds = testsData.map(t => t.id);
        const { data: results } = await supabase
          .from("test_results")
          .select("is_correct")
          .in("test_id", testIds);
          
        if (results && results.length > 0) {
          const correctCount = results.filter(r => r.is_correct).length;
          setAvgMastery(Math.round((correctCount / results.length) * 100));
        }
      }
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
    <>
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0056d2] flex items-center justify-center">
                    <Brain className="h-5 w-5" />
                 </div>
                 <Badge className="bg-blue-50 text-[#0056d2] border-none font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded">
                    Metakognitiv Nazorat
                 </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                 Vazifalar & Refleksiya
              </h1>
              <p className="text-slate-500 font-medium text-sm max-w-xl">
                 O'quvchilar o'z bilimini sinashi va tahlil qilishi uchun mo'ljallangan baholash vositalari.
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchTests}
                className="h-10 w-10 p-0 rounded-lg border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button asChild className="h-10 px-6 rounded-lg bg-[#0056d2] text-white font-medium shadow-sm hover:bg-[#00419e] transition-colors gap-2">
                <a href="/teacher/courses">
                  <Plus className="h-4 w-4" /> Yangi qo'shish
                </a>
              </Button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: "Jami Savollar", value: tests.length, icon: ClipboardList, color: "text-[#0056d2]", bg: "bg-blue-50" },
             { label: "Darslar qamrovi", value: new Set(tests.map(t => t.lesson_id)).size, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "O'rtacha Mastery", value: `${avgMastery}%`, icon: Target, color: "text-amber-500", bg: "bg-amber-50" },
             { label: "AI Tahlil", value: "Yoqilgan", icon: Sparkles, color: "text-indigo-500", bg: "bg-indigo-50" }
           ].map((stat, i) => (
             <Card key={i} className="border border-slate-200 shadow-sm bg-white rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`h-12 w-12 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
                   <stat.icon className="h-6 w-6" />
                </div>
                <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
                   <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
                </div>
             </Card>
           ))}
        </div>

        {/* Filter Section */}
        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-4 flex flex-col lg:flex-row gap-4">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0056d2]" />
              <Input 
                placeholder="Savol yoki dars nomi bo'yicha qidirish..." 
                className="h-10 pl-10 rounded-lg border border-slate-200 bg-white font-medium text-sm focus-visible:ring-[#0056d2]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <div className="w-full lg:w-64">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                 <SelectTrigger className="h-10 rounded-lg border border-slate-200 bg-white font-medium text-sm px-4 focus:ring-[#0056d2]">
                    <div className="flex items-center gap-2">
                       <Filter className="h-4 w-4 text-slate-400" />
                       <SelectValue placeholder="Kursni tanlang" />
                    </div>
                 </SelectTrigger>
                 <SelectContent className="rounded-lg border border-slate-200 shadow-lg">
                    <SelectItem value="all" className="font-medium text-sm">Barcha Kurslar</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id} className="font-medium text-sm">{course.title}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
           </div>
        </Card>

        {/* Tests List */}
        <div className="grid gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
            ) : filteredTests.length > 0 ? (
              filteredTests.map((test) => (
                  <Card key={test.id} className="group border border-slate-200 shadow-sm hover:shadow-md bg-white rounded-xl overflow-hidden transition-shadow">
                     <CardContent className="p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                           <div className="flex flex-wrap items-center gap-3">
                              <Badge className="rounded bg-slate-100 text-slate-600 border-none px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wide">
                                 {test.lessons.courses.title}
                              </Badge>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                 <BookOpen className="h-3.5 w-3.5" /> {test.lessons.title}
                              </div>
                           </div>
                           
                           <h3 className="text-lg font-bold text-slate-900 leading-tight">
                              {test.question}
                           </h3>

                           <div className="flex flex-wrap gap-2 pt-1">
                              {test.options.map((opt: string, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border ${opt === test.correct_answer ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                                >
                                  {opt === test.correct_answer ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                                  {opt}
                                </div>
                              ))}
                           </div>
                        </div>
                        
                        <div className="flex lg:flex-col items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             asChild
                             className="h-10 w-10 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-[#0056d2]"
                           >
                              <a href={`/teacher/courses/${test.lessons.course_id}`}>
                                 <Edit2 className="h-5 w-5" />
                              </a>
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => { setTestToDelete(test.id); setDeleteDialogOpen(true); }}
                             className="h-10 w-10 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                           >
                              <Trash2 className="h-5 w-5" />
                           </Button>
                        </div>
                     </CardContent>
                  </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-4">
                 <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <ClipboardList className="h-8 w-8" />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Ma'lumotlar topilmadi</h3>
                    <p className="text-slate-500 font-medium text-sm">Filterni o'zgartiring yoki yangi savol qo'shish uchun Kurslarga o'ting.</p>
                 </div>
                 <Button onClick={() => { setSearchQuery(""); setSelectedCourse("all"); }} variant="link" className="text-[#0056d2] font-semibold text-sm">Filterni tozalash</Button>
              </div>
            )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-xl p-6 max-w-sm border border-slate-200 shadow-lg text-center space-y-4 bg-white">
           <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
           </div>
           <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">O'chirishni Tasdiqlaysizmi?</h2>
              <p className="text-slate-500 font-medium text-sm">Ushbu savol bazadan butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.</p>
           </div>
           <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="h-10 flex-1 rounded-lg font-medium text-slate-600 border-slate-200">Bekor qilish</Button>
              <Button onClick={handleDeleteTest} className="h-10 flex-1 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700">O'chirish</Button>
           </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeacherAssignments;
