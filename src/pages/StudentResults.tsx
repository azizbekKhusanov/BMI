import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Target, CheckCircle2, XCircle, 
  BookOpen, Activity, TrendingUp, SearchIcon, ArrowRight,
  GraduationCap, ChevronDown, ChevronUp, Sparkles, Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Course { id: string; title: string; }
interface Lesson { id: string; title: string; course_id: string; }
interface Test { id: string; question: string; lesson_id: string; }
interface TestResult { 
  id: string; test_id: string; user_id: string; answer: string; is_correct: boolean; created_at: string; 
  tests?: Test & { lessons?: Lesson & { courses?: Course; }; }; 
}

const StudentResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<string[]>([]);

  const toggleCourse = (id: string) => setExpandedCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const toggleLesson = (id: string) => setExpandedLessons(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);

  const fetchResults = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: resultsData, error: resultsError } = await supabase.from("test_results").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (resultsError) throw resultsError;
      if (resultsData && resultsData.length > 0) {
        const testIds = [...new Set(resultsData.map(r => r.test_id))];
        const { data: testsData } = await supabase.from("tests").select("*").in("id", testIds);
        const lessonIds = [...new Set(testsData?.map(t => t.lesson_id) || [])];
        const { data: lessonsData } = await supabase.from("lessons").select("*").in("id", lessonIds);
        const courseIds = [...new Set(lessonsData?.map(l => l.course_id) || [])];
        const { data: coursesData } = await supabase.from("courses").select("id, title").in("id", courseIds);

        const mappedResults = resultsData.map(res => {
          const test = testsData?.find(t => t.id === res.test_id);
          const lesson = lessonsData?.find(l => l.id === test?.lesson_id);
          const course = coursesData?.find(c => c.id === lesson?.course_id);
          return { ...res, tests: { ...test, lessons: { ...lesson, courses: course } } } as TestResult;
        });
        setResults(mappedResults);
      } else setResults([]);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const stats = {
    total: results.length,
    correct: results.filter(r => r.is_correct).length,
    accuracy: results.length ? Math.round((results.filter(r => r.is_correct).length / results.length) * 100) : 0
  };

  const filteredResults = results.filter(r => r.tests?.question.toLowerCase().includes(searchQuery.toLowerCase()) || r.tests?.lessons?.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const groupedByCourse = filteredResults.reduce((acc, result) => {
    const courseId = result.tests?.lessons?.course_id || "unknown";
    const courseTitle = result.tests?.lessons?.courses?.title || "Umumiy Kurs";
    const lessonId = result.tests?.lesson_id;
    if (!lessonId) return acc;
    if (!acc[courseId]) acc[courseId] = { courseId, courseTitle, lessons: {} };
    if (!acc[courseId].lessons[lessonId]) acc[courseId].lessons[lessonId] = { lessonId, lessonTitle: result.tests?.lessons?.title || "Dars", results: [] };
    acc[courseId].lessons[lessonId].results.push(result);
    return acc;
  }, {} as Record<string, { courseId: string, courseTitle: string, lessons: Record<string, { lessonId: string, lessonTitle: string, results: TestResult[] }> }>);

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-10 space-y-16 animate-fade-in pb-32">
      
      {/* 1. Noyob "Custom" Hero Section */}
      <div className="relative rounded-[3rem] bg-slate-950 overflow-hidden min-h-[450px] shadow-2xl flex items-center group">
         {/* Background Decor */}
         <div className="absolute top-0 right-0 w-[600px] h-full opacity-40 mix-blend-screen pointer-events-none">
            <img 
               src="/learning_analytics_3d_1779339577360.png" 
               alt="Analytics" 
               className="w-full h-full object-contain translate-x-32 scale-125"
            />
         </div>
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

         <div className="relative z-10 p-10 md:p-20 flex flex-col md:flex-row items-center gap-16 w-full">
            <div className="flex-1 space-y-8 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 rounded-full px-5 py-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">Shaxsiy Yutuqlar</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">Mening<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">Natijalarim</span></h1>
               <p className="text-slate-400 text-lg font-medium max-w-lg">Sizning bilim cho'qqilarini zabt etish yo'lidagi barcha urinishlaringiz va intellektual salohiyatingiz tahlili.</p>
               
               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="relative w-full md:w-80">
                     <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                     <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Natijalardan qidiring..." 
                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-indigo-500/50 outline-none transition-all"
                     />
                  </div>
               </div>
            </div>

            {/* Floating Stats Glassmorphism */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-[450px]">
               {[
                 { label: "Jami Urinish", val: stats.total, icon: Target, col: "text-blue-400" },
                 { label: "Muvaffaqiyatli", val: stats.correct, icon: CheckCircle2, col: "text-emerald-400" },
                 { label: "O'rtacha Aniqlik", val: `${stats.accuracy}%`, icon: TrendingUp, col: "text-amber-400" },
                 { label: "O'zlashtirish", val: "A'lo", icon: Trophy, col: "text-indigo-400" }
               ].map((s, i) => (
                  <div key={i} className="group/item relative p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-500">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/item:opacity-20 transition-all">
                        <s.icon className={`h-12 w-12 ${s.col}`} />
                     </div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                     <h3 className="text-3xl font-black text-white">{s.val}</h3>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* 2. Natijalar Ro'yxati - Custom Layout */}
      <div className="space-y-10">
         <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 text-slate-900">
               <Activity className="h-6 w-6 text-indigo-600" />
               <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest text-xs">Barcha Tahlillar</h2>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jami:</span>
               <Badge className="bg-indigo-50 text-indigo-600 border-none font-black">{filteredResults.length}</Badge>
            </div>
         </div>

         {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-[2rem] bg-slate-50 animate-pulse" />)}
            </div>
         ) : filteredResults.length === 0 ? (
            <div className="py-20 text-center"><p className="text-slate-400 font-bold">Hech narsa topilmadi</p></div>
         ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {Object.values(groupedByCourse).map((course) => {
                  const isEx = expandedCourses.includes(course.courseId);
                  const lessons = Object.values(course.lessons);
                  const total = lessons.reduce((s, l) => s + l.results.length, 0);
                  const correct = lessons.reduce((s, l) => s + l.results.filter(r => r.is_correct).length, 0);
                  const acc = total ? Math.round((correct / total) * 100) : 0;

                  return (
                     <Card key={course.courseId} className={`group/course rounded-[2.5rem] border-slate-100 transition-all duration-700 overflow-hidden ${isEx ? "shadow-2xl shadow-indigo-100 bg-slate-50" : "shadow-sm hover:shadow-xl bg-white"}`}>
                        <div onClick={() => toggleCourse(course.courseId)} className="p-8 cursor-pointer flex items-center justify-between gap-6">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover/course:rotate-3">
                                 <BookOpen className="h-8 w-8" />
                              </div>
                              <div>
                                 <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight">{course.courseTitle}</h3>
                                 <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{total} ta urinish</span></div>
                                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                                    <div className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{acc}% aniqlik</span></div>
                                 </div>
                              </div>
                           </div>
                           <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm text-slate-400 group-hover/course:text-indigo-600 transition-colors">
                              {isEx ? <ChevronUp /> : <ChevronDown />}
                           </div>
                        </div>

                        <AnimatePresence>
                        {isEx && (
                           <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-8 pb-8 space-y-4">
                              {lessons.map(lesson => {
                                 const isLex = expandedLessons.includes(lesson.lessonId);
                                 return (
                                    <div key={lesson.lessonId} className="rounded-3xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
                                       <div onClick={() => toggleLesson(lesson.lessonId)} className="p-5 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors">
                                          <h4 className="text-sm font-black text-slate-800">{lesson.lessonTitle}</h4>
                                          <div className="flex items-center gap-4">
                                             <Badge variant="outline" className="text-[9px] font-black border-slate-200 uppercase tracking-tighter">O'rtacha: {Math.round(lesson.results.filter(r => r.is_correct).length / lesson.results.length * 100)}%</Badge>
                                             {isLex ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                          </div>
                                       </div>
                                       {isLex && (
                                          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                                             {lesson.results.map((r, i) => (
                                                <div key={i} className="flex items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
                                                   <p className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">{r.tests?.question}</p>
                                                   {r.is_correct ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                                                </div>
                                             ))}
                                          </div>
                                       )}
                                    </div>
                                 );
                              })}
                           </motion.div>
                        )}
                        </AnimatePresence>
                     </Card>
                  );
               })}
            </div>
         )}
      </div>

      {/* 3. Custom Bottom Banner */}
      <div className="relative rounded-[3.5rem] bg-indigo-600 p-12 md:p-24 overflow-hidden shadow-3xl shadow-indigo-200/50">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left space-y-6 max-w-2xl">
               <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Yutuqlarni zabt etishda<br />davom eting!</h2>
               <p className="text-indigo-100/80 text-xl font-medium leading-relaxed">Har bir test va tahlil — bu sizning intellektual rivojlanishingiz yo'lidagi muhim qadamdir.</p>
            </div>
            <Button asChild className="h-16 px-12 rounded-2xl bg-white text-indigo-600 font-black text-lg hover:scale-105 transition-all shadow-xl shadow-indigo-900/20">
               <Link to="/student/courses">O'qishda davom etish <ArrowRight className="ml-2 h-6 w-6" /></Link>
            </Button>
         </div>
      </div>
    </div>
  );
};

export default StudentResults;
