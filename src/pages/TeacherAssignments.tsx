import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Filter, FileText, Trash2, Edit2, BookOpen, GraduationCap, CheckCircle2, ClipboardList, Brain } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const TeacherAssignments = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchTests();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("id, title").eq("teacher_id", user?.id);
    setCourses(data || []);
  };

  const fetchTests = async () => {
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
      .eq("lessons.courses.teacher_id", user?.id);

    if (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } else {
      setTests(data || []);
    }
    setLoading(false);
  };

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
    <Layout>
      <div className="container py-8 space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black font-serif tracking-tight uppercase">Vazifalar & Refleksiya</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-500" />
              O'quvchilar o'z bilimini sinashi va tahlil qilishi uchun "Reality Check" nuqtalari.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl border-2 px-4 font-bold" onClick={fetchTests}>
              Yangilash
            </Button>
            <Button asChild className="rounded-2xl px-6 shadow-xl bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 transition-all font-bold">
              <a href="/teacher/courses">
                <Plus className="mr-2 h-4 w-4" /> Yangi qo'shish
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-indigo-600 uppercase mb-1 tracking-widest leading-none">Jami nuqtalar</span>
            <span className="text-3xl font-black">{tests.length}</span>
          </Card>
          <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest leading-none">Darslar boyicha</span>
            <span className="text-3xl font-black">{new Set(tests.map(t => t.lesson_id)).size}</span>
          </Card>
          <Card className="border-none shadow-xl bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center col-span-2">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><Star className="h-5 w-5" /></div>
               <div className="text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest line-clamp-1">Metakognitiv bog'liqlik</p>
                  <p className="text-xs font-bold text-slate-400">Har bir testdan keyin o'quvchi o'zini tahlil qiladi.</p>
               </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Savol yoki dars nomi bo'yicha qidirish..." 
                className="pl-12 rounded-2xl bg-white border-none h-12 shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-2xl border-none bg-white h-12 shadow-inner">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Kursni tanlang" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Barcha Kurslar</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tests List */}
        <div className="space-y-4">
          {loading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-[2rem]" />)
          ) : filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <Card key={test.id} className="group border-none shadow-xl bg-white rounded-[2rem] overflow-hidden hover:shadow-2xl transition-all border-l-8 border-l-indigo-100 hover:border-l-indigo-500">
                <CardContent className="p-0">
                  <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest border-none px-3">
                          {test.lessons.courses.title}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {test.lessons.title}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                        {test.question}
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {test.options.map((opt: string, idx: number) => (
                          <span 
                            key={idx} 
                            className={`text-xs px-4 py-1.5 rounded-xl font-bold border-2 transition-all ${opt === test.correct_answer ? "bg-emerald-50 border-emerald-100 text-emerald-700 font-black" : "bg-slate-50 border-transparent text-slate-400"}`}
                          >
                            {opt === test.correct_answer && <CheckCircle2 className="inline mr-2 h-3.5 w-3.5" />}
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 hover:bg-red-50 hover:text-red-500" onClick={() => { setTestToDelete(test.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 hover:bg-indigo-50 hover:text-indigo-600" asChild>
                        <a href={`/teacher/courses/${test.lessons.course_id}`}>
                          <Edit2 className="h-5 w-5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-24 bg-white/50 border-4 border-dashed rounded-[3.5rem] shadow-inner">
              <ClipboardList className="h-20 w-20 mx-auto text-slate-200 mb-6" />
              <h3 className="text-2xl font-black font-serif text-slate-400 uppercase tracking-tighter">Ma'lumotlar topilmadi</h3>
              <p className="text-slate-400 mt-2 max-w-sm mx-auto font-bold text-sm">
                Qidiruv so'rovini o'zgartiring yoki yangi nuqta qo'shish uchun Kurslar bo'limiga o'ting.
              </p>
              <Button onClick={() => { setSearchQuery(""); setSelectedCourse("all"); }} variant="outline" className="mt-8 rounded-2xl border-2 px-10 h-12 font-bold transition-all hover:bg-slate-50">
                FILTERNI TOZALASH
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black font-serif">O'chirishni tasdiqlaysizmi?</DialogTitle>
            <DialogDescription className="pt-4 text-base font-bold text-slate-500">
              Ushbu amalni ortga qaytarib bo'lmaydi. Savol bazadan butunlay o'chiriladi.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 pt-8">
            <Button variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => setDeleteDialogOpen(false)}>BEKOR QILISH</Button>
            <Button variant="destructive" className="rounded-xl h-12 px-8 font-black shadow-lg shadow-red-100 uppercase" onClick={handleDeleteTest}>O'CHIRISH</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

// Lucide icon support for Star
const Star = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default TeacherAssignments;
