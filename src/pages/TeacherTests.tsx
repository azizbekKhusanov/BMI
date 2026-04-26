import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, Filter, FileText, Trash2, Edit2, BookOpen, GraduationCap, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallback } from "react";

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

const TeacherTests = () => {
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
    // Fetch tests with joins to get lesson and course info
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
      toast.error("Testlarni yuklashda xatolik");
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
      toast.success("Test o'chirildi");
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
            <h1 className="text-3xl font-bold font-serif tracking-tight">Testlar Bazasi</h1>
            <p className="text-muted-foreground mt-1">Barcha kurslaringizdagi test savollarini boshqaring.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full px-4" onClick={fetchTests}>
              Yangilash
            </Button>
            <Button asChild className="rounded-full px-6 shadow-lg bg-primary hover:shadow-xl transition-all">
              <a href="/teacher/courses">
                <Plus className="mr-2 h-4 w-4" /> Yangi Test
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-blue-50/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-blue-600 uppercase mb-1">Jami Testlar</span>
              <span className="text-2xl font-bold">{tests.length}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-purple-50/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-purple-600 uppercase mb-1">Kurslar</span>
              <span className="text-2xl font-bold">{courses.length}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-50/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-green-600 uppercase mb-1">Darslar</span>
              <span className="text-2xl font-bold">{new Set(tests.map(t => t.lesson_id)).size}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-orange-50/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-orange-600 uppercase mb-1">Filterlangan</span>
              <span className="text-2xl font-bold">{filteredTests.length}</span>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-md overflow-hidden bg-background/50 backdrop-blur-sm border">
          <CardContent className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Savol yoki dars nomi bo'yicha qidirish..." 
                className="pl-10 rounded-xl bg-muted/30 border-none h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="rounded-xl border-none bg-muted/30 h-11">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Kursni tanlang" />
                  </div>
                </SelectTrigger>
                <SelectContent>
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
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : filteredTests.length > 0 ? (
            filteredTests.map((test) => (
              <Card key={test.id} className="group overflow-hidden border-none shadow-md hover:shadow-lg transition-all border-l-4 border-l-primary/30 hover:border-l-primary">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/20 bg-primary/5">
                          {test.lessons.courses.title}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] text-muted-foreground bg-transparent border-none">
                          {test.lessons.title}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold tracking-tight line-clamp-2">
                        {test.question}
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {test.options.map((opt: string, idx: number) => (
                          <span 
                            key={idx} 
                            className={`text-xs px-2 py-0.5 rounded-md border ${opt === test.correct_answer ? "bg-green-50 border-green-200 text-green-700 font-medium" : "bg-muted/50 border-transparent text-muted-foreground"}`}
                          >
                            {opt === test.correct_answer && <CheckCircle2 className="inline mr-1 h-3 w-3" />}
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors" onClick={() => { setTestToDelete(test.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                        <a href={`/teacher/courses`}>
                          <Edit2 className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-serif font-bold text-muted-foreground">Testlar topilmadi</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Qidiruv so'rovini o'zgartiring yoki yangi test qo'shish uchun Kurslar bo'limiga o'ting.
              </p>
              <Button variant="outline" className="mt-6 rounded-full px-8" onClick={() => { setSearchQuery(""); setSelectedCourse("all"); }}>
                Filterni tozalash
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif">Testni o'chirish</DialogTitle>
            <CardDescription className="pt-2 text-base">
              Haqiqatan ham ushbu test savolini o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
            </CardDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleDeleteTest}>Ha, o'chirish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TeacherTests;

