import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Plus, Trash2, Edit2, BookOpen, CheckCircle2, ClipboardList, 
  Target, RefreshCcw, Layers, ChevronRight, ChevronDown, BarChart3, 
  HelpCircle, AlertCircle, GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Course { id: string; title: string; }
interface Lesson { id: string; title: string; course_id: string; courses: Course; }
interface Test {
  id: string;
  question: string;
  lesson_id: string;
  options: string[];
  correct_answer: string;
  lessons: Lesson;
  successRate?: number;
  totalAttempts?: number;
}

// Grouped structure: Course -> Lessons -> Tests
interface GroupedData {
  courseId: string;
  courseTitle: string;
  lessons: {
    lessonId: string;
    lessonTitle: string;
    tests: Test[];
  }[];
}

const TeacherAssignments = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Track open/closed state for courses and lessons
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());
  const [openLessons, setOpenLessons] = useState<Set<string>>(new Set());

  const [stats, setStats] = useState({ totalQuestions: 0, avgMastery: 0, totalAttempts: 0, coverage: 0 });

  const fetchTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tests")
        .select(`*, lessons!inner (id, title, course_id, courses!inner (id, title, teacher_id))`)
        .eq("lessons.courses.teacher_id", user.id);

      if (error) throw error;

      const testsData = (data as unknown as Test[]) || [];

      if (testsData.length > 0) {
        const testIds = testsData.map(t => t.id);
        const { data: results } = await supabase.from("test_results").select("test_id, is_correct").in("test_id", testIds);

        const resultsMap: Record<string, { correct: number, total: number }> = {};
        results?.forEach(r => {
          if (!resultsMap[r.test_id]) resultsMap[r.test_id] = { correct: 0, total: 0 };
          resultsMap[r.test_id].total++;
          if (r.is_correct) resultsMap[r.test_id].correct++;
        });

        const enrichedTests = testsData.map(t => ({
          ...t,
          successRate: resultsMap[t.id] ? Math.round((resultsMap[t.id].correct / resultsMap[t.id].total) * 100) : 0,
          totalAttempts: resultsMap[t.id]?.total || 0
        }));

        setTests(enrichedTests);

        const totalAttempts = results?.length || 0;
        const correctCount = results?.filter(r => r.is_correct).length || 0;
        setStats({
          totalQuestions: enrichedTests.length,
          avgMastery: totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0,
          totalAttempts,
          coverage: new Set(enrichedTests.map(t => t.lesson_id)).size
        });

        // Auto-open first course
        const firstCourseId = enrichedTests[0]?.lessons?.courses?.id;
        if (firstCourseId) setOpenCourses(new Set([firstCourseId]));
      } else {
        setTests([]);
        setStats({ totalQuestions: 0, avgMastery: 0, totalAttempts: 0, coverage: 0 });
      }
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    const { error } = await supabase.from("tests").delete().eq("id", testToDelete);
    if (error) { toast.error("O'chirishda xatolik"); }
    else { toast.success("Muvaffaqiyatli o'chirildi"); fetchTests(); }
    setDeleteDialogOpen(false);
    setTestToDelete(null);
  };

  const toggleCourse = (courseId: string) => {
    setOpenCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setOpenLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  // Build grouped structure: Course -> Lessons -> Tests
  const grouped = useMemo((): GroupedData[] => {
    const filtered = tests.filter(t =>
      !searchQuery ||
      t.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lessons.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lessons.courses.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const courseMap: Record<string, GroupedData> = {};
    filtered.forEach(t => {
      const courseId = t.lessons.courses.id;
      const courseTitle = t.lessons.courses.title;
      const lessonId = t.lesson_id;
      const lessonTitle = t.lessons.title;

      if (!courseMap[courseId]) {
        courseMap[courseId] = { courseId, courseTitle, lessons: [] };
      }
      const course = courseMap[courseId];
      let lessonGroup = course.lessons.find(l => l.lessonId === lessonId);
      if (!lessonGroup) {
        lessonGroup = { lessonId, lessonTitle, tests: [] };
        course.lessons.push(lessonGroup);
      }
      lessonGroup.tests.push(t);
    });

    return Object.values(courseMap);
  }, [tests, searchQuery]);

  if (loading) return (
    <div className="w-full pt-8 px-8 space-y-8 pb-20">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      <Skeleton className="h-[500px] w-full rounded-xl" />
    </div>
  );

  return (
    <div className="w-full py-8 px-4 md:px-8 space-y-8 pb-20 min-h-screen">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#0056d2] font-semibold text-xs uppercase tracking-wider">
            <ClipboardList className="h-4 w-4" /> Vazifalar Boshqaruvi
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vazifalar va Testlar</h1>
          <p className="text-slate-500 text-sm font-medium">Kurs darslari uchun savollar yarating va talabalar natijalarini kuzating.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchTests} className="h-10 gap-2 border-slate-200 bg-white shadow-sm hover:bg-slate-50">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Yangilash
          </Button>
          <Button asChild className="h-10 px-6 bg-[#0056d2] hover:bg-[#00419e] text-white shadow-md gap-2">
            <a href="/teacher/courses"><Plus className="h-4 w-4" /> Yangi savol</a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Jami Savollar", value: stats.totalQuestions, icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "O'rtacha o'zlashtirish", value: `${stats.avgMastery}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Umumiy urinishlar", value: stats.totalAttempts, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Darslar qamrovi", value: `${stats.coverage} ta dars`, icon: Layers, color: "text-amber-600", bg: "bg-amber-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Kurs, dars yoki savol bo'yicha qidirish..."
          className="h-11 pl-9 rounded-xl border-slate-200 bg-white shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Hierarchical Accordion: Course -> Lesson -> Tests */}
      <div className="space-y-4">
        {grouped.length === 0 ? (
          <div className="py-24 text-center bg-white border border-slate-100 rounded-2xl">
            <HelpCircle className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Savollar topilmadi</p>
          </div>
        ) : (
          grouped.map((course) => {
            const isCourseOpen = openCourses.has(course.courseId);
            const totalTests = course.lessons.reduce((acc, l) => acc + l.tests.length, 0);

            return (
              <div key={course.courseId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Course Header */}
                <button
                  onClick={() => toggleCourse(course.courseId)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Kurs</p>
                      <h2 className="text-lg font-bold text-slate-900">{course.courseTitle}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none font-bold">
                      {course.lessons.length} dars • {totalTests} savol
                    </Badge>
                    {isCourseOpen
                      ? <ChevronDown className="h-5 w-5 text-slate-400" />
                      : <ChevronRight className="h-5 w-5 text-slate-400" />
                    }
                  </div>
                </button>

                {/* Lessons inside Course */}
                {isCourseOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-3">
                    {course.lessons.map((lesson) => {
                      const isLessonOpen = openLessons.has(lesson.lessonId);
                      return (
                        <div key={lesson.lessonId} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                          {/* Lesson Header */}
                          <button
                            onClick={() => toggleLesson(lesson.lessonId)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-slate-800">{lesson.lessonTitle}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400">{lesson.tests.length} ta savol</span>
                              {isLessonOpen
                                ? <ChevronDown className="h-4 w-4 text-slate-400" />
                                : <ChevronRight className="h-4 w-4 text-slate-400" />
                              }
                            </div>
                          </button>

                          {/* Tests inside Lesson */}
                          {isLessonOpen && (
                            <div className="border-t border-slate-100 divide-y divide-slate-50">
                              {lesson.tests.map((test, idx) => (
                                <div key={test.id} className="p-4 hover:bg-slate-50/50 transition-colors flex justify-between items-start gap-4 group">
                                  <div className="flex items-start gap-3 flex-1">
                                    <span className="h-6 w-6 rounded-md bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {idx + 1}
                                    </span>
                                    <div className="space-y-2 flex-1">
                                      <p className="text-sm font-bold text-slate-800">{test.question}</p>
                                      <div className="grid grid-cols-2 gap-1.5">
                                        {test.options.map((opt, i) => (
                                          <div key={i} className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                                            opt === test.correct_answer
                                              ? "bg-emerald-50 border-emerald-100 text-emerald-700 font-bold"
                                              : "bg-slate-50 border-slate-100 text-slate-500"
                                          }`}>
                                            {opt === test.correct_answer
                                              ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                                              : <div className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                                            }
                                            <span className="line-clamp-1">{opt}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg">
                                      <a href={`/lessons/${test.lesson_id}`}><Edit2 className="h-4 w-4 text-slate-400" /></a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setTestToDelete(test.id); setDeleteDialogOpen(true); }} className="h-8 w-8 rounded-lg hover:text-rose-600 hover:bg-rose-50">
                                      <Trash2 className="h-4 w-4 text-slate-400" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl p-0 overflow-hidden border-none shadow-2xl max-w-sm bg-white">
          <div className="bg-rose-50 p-6 flex flex-col items-center text-center space-y-4">
            <div className="h-14 w-14 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-sm">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">O'chirishni tasdiqlaysizmi?</h2>
              <p className="text-sm text-slate-600 font-medium">Ushbu savol o'chirilsa, unga bog'liq barcha natijalar ham o'chib ketishi mumkin.</p>
            </div>
          </div>
          <DialogFooter className="p-4 bg-white flex flex-row gap-3 mt-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1 h-11 rounded-xl border-slate-200 font-bold text-slate-600">Bekor qilish</Button>
            <Button onClick={handleDeleteTest} className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm">O'chirish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherAssignments;
