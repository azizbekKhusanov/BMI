import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Target, Calendar, CheckCircle2, XCircle, 
  BookOpen, Activity, TrendingUp, SearchIcon, ArrowRight, Star,
  Medal, Zap, GraduationCap, ChevronDown, ChevronUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
}

interface Test {
  id: string;
  question: string;
  lesson_id: string;
}

interface TestResult {
  id: string;
  test_id: string;
  user_id: string;
  answer: string;
  is_correct: boolean;
  created_at: string;
  tests?: Test & {
    lessons?: Lesson & {
      courses?: Course;
    };
  };
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
      const { data: resultsData, error: resultsError } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (resultsError) throw resultsError;

      if (resultsData && resultsData.length > 0) {
        const testIds = [...new Set(resultsData.map(r => r.test_id))];
        const { data: testsData } = await supabase
          .from("tests")
          .select("*")
          .in("id", testIds);
        
        const lessonIds = [...new Set(testsData?.map(t => t.lesson_id) || [])];
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("*")
          .in("id", lessonIds);
        
        const courseIds = [...new Set(lessonsData?.map(l => l.course_id) || [])];
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);

        const mappedResults = resultsData.map(res => {
          const test = testsData?.find(t => t.id === res.test_id);
          const lesson = lessonsData?.find(l => l.id === test?.lesson_id);
          const course = coursesData?.find(c => c.id === lesson?.course_id);

          return {
            ...res,
            tests: {
              ...test,
              lessons: {
                ...lesson,
                courses: course
              }
            }
          } as TestResult;
        });

        setResults(mappedResults);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredResults = results.filter(r => 
    r.tests?.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tests?.lessons?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: results.length,
    correct: results.filter(r => r.is_correct).length,
    accuracy: results.length ? Math.round((results.filter(r => r.is_correct).length / results.length) * 100) : 0
  };

  const groupedByCourse = filteredResults.reduce((acc, result) => {
    const courseId = result.tests?.lessons?.course_id || "unknown-course";
    const courseTitle = result.tests?.lessons?.courses?.title || "Umumiy Kurs";
    const lessonId = result.tests?.lesson_id;
    if (!lessonId) return acc;
    const lessonTitle = result.tests?.lessons?.title || "Noma'lum dars";

    if (!acc[courseId]) {
      acc[courseId] = {
        courseId,
        courseTitle,
        lessons: {}
      };
    }

    if (!acc[courseId].lessons[lessonId]) {
      acc[courseId].lessons[lessonId] = {
        lessonId,
        lessonTitle,
        results: []
      };
    }

    acc[courseId].lessons[lessonId].results.push(result);
    return acc;
  }, {} as Record<string, {
    courseId: string,
    courseTitle: string,
    lessons: Record<string, { lessonId: string, lessonTitle: string, results: TestResult[] }>
  }>);

  const courseArray = Object.values(groupedByCourse);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-10 animate-fade-in pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Mening Natijalarim</h1>
            </div>
            <p className="text-slate-500 ml-13">Sizning bilim cho'qqilarini zabt etish yo'lidagi har bir qadamingiz.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative w-full md:w-80">
               <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
               <input 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Test yoki dars nomini qidiring..." 
                 className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium placeholder:text-slate-400"
               />
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           {[
             { label: "Jami urinishlar", value: `${stats.total} ta`, icon: Target, color: "text-indigo-600 bg-indigo-50" },
             { label: "To'g'ri javoblar", value: `${stats.correct} ta`, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
             { label: "O'rtacha aniqlik", value: `${stats.accuracy}%`, icon: TrendingUp, color: "text-amber-600 bg-amber-50" }
           ].map((stat, i) => (
             <Card key={i} className="border-slate-100 shadow-sm bg-white rounded-3xl p-6 flex items-center gap-6 hover:shadow-md transition-all">
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${stat.color}`}>
                   <stat.icon className="h-8 w-8" />
                </div>
                <div>
                   <p className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</p>
                   <p className="text-3xl font-bold text-slate-900 leading-none">{stat.value}</p>
                </div>
             </Card>
           ))}
        </div>

        {/* Badges Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { icon: Medal, label: "Top Student", color: "bg-amber-50 text-amber-600" },
             { icon: Star, label: "Flash Learner", color: "bg-indigo-50 text-indigo-600" },
             { icon: Target, label: "Bullseye", color: "bg-rose-50 text-rose-600" },
             { icon: Zap, label: "Power User", color: "bg-emerald-50 text-emerald-600" }
           ].map((badge, i) => (
             <Card key={i} className="p-4 rounded-2xl border-slate-100 shadow-sm bg-white flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${badge.color}`}>
                   <badge.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">{badge.label}</p>
             </Card>
           ))}
        </div>

        {/* Results List */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-slate-900">Barcha Tahlillar</h3>
             <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-3 py-1 text-xs">
                {filteredResults.length} ta natija
             </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />)}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-24 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                <Activity className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Natijalar Mavjud emas</h3>
              <p className="text-slate-500 mb-8 max-w-sm mx-auto">Siz izlagan yoki umuman olganda hozircha test natijalari topilmadi. Darslarni ko'rib, testlarni ishlashni boshlang.</p>
              <Button asChild className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all">
                <Link to="/student/courses">Kurslarga o'tish <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {courseArray.map((course) => {
                const isCourseExpanded = expandedCourses.includes(course.courseId);
                const courseLessons = Object.values(course.lessons).sort((a, b) => 
                  a.lessonTitle.localeCompare(b.lessonTitle, undefined, { numeric: true, sensitivity: 'base' })
                );
                
                const courseTotal = courseLessons.reduce((sum, l) => sum + l.results.length, 0);
                const courseCorrect = courseLessons.reduce((sum, l) => sum + l.results.filter(r => r.is_correct).length, 0);
                const courseAccuracy = courseTotal ? Math.round((courseCorrect / courseTotal) * 100) : 0;

                return (
                  <Card key={course.courseId} className="border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
                    <div 
                      onClick={() => toggleCourse(course.courseId)}
                      className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6" />
                         </div>
                         <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-widest">Kurs</p>
                            <h3 className="text-xl font-bold text-slate-900">{course.courseTitle}</h3>
                         </div>
                      </div>
                      
                      <div className="flex gap-6 items-center">
                         <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold text-slate-500">O'zlashtirish</p>
                            <p className="text-lg font-bold text-indigo-600">{courseAccuracy}%</p>
                         </div>
                         <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-200 text-slate-400">
                            {isCourseExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                         </div>
                      </div>
                    </div>

                    {isCourseExpanded && (
                      <div className="p-6 md:p-8 space-y-6 bg-white">
                        {courseLessons.map(lesson => {
                           const isLessonExpanded = expandedLessons.includes(lesson.lessonId);
                           const lessonTotal = lesson.results.length;
                           const lessonCorrect = lesson.results.filter(r => r.is_correct).length;
                           const lessonAccuracy = lessonTotal ? Math.round((lessonCorrect / lessonTotal) * 100) : 0;

                           return (
                             <div key={lesson.lessonId} className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div 
                                  onClick={() => toggleLesson(lesson.lessonId)}
                                  className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                >
                                  <div>
                                    <h4 className="text-lg font-bold text-slate-900">{lesson.lessonTitle}</h4>
                                  </div>
                                  <div className="flex gap-4 items-center">
                                     <div className="text-center hidden sm:block">
                                        <p className="text-xs font-semibold text-slate-500">Natija</p>
                                        <p className="text-sm font-bold text-slate-900">{lessonCorrect}/{lessonTotal}</p>
                                     </div>
                                     <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
                                     <div className="text-center hidden sm:block">
                                        <p className="text-xs font-semibold text-slate-500">Aniqlik</p>
                                        <p className={`text-sm font-bold ${lessonAccuracy >= 80 ? 'text-emerald-600' : lessonAccuracy >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{lessonAccuracy}%</p>
                                     </div>
                                     <div className="ml-2 text-slate-400">
                                        {isLessonExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                     </div>
                                  </div>
                                </div>

                                {isLessonExpanded && (
                                  <div className="p-4 md:p-6 bg-white border-t border-slate-200">
                                     <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm font-semibold text-slate-500">Siz ishlagan testlar ro'yxati:</span>
                                        <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                                           <Link to={`/lessons/${lesson.lessonId}`}>Darsga o'tish <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                        </Button>
                                     </div>
                                     <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                           <thead>
                                              <tr className="border-b border-slate-100 text-sm text-slate-500">
                                                 <th className="pb-4 font-semibold w-1/2">Savol</th>
                                                 <th className="pb-4 font-semibold w-1/3">Sizning javobingiz</th>
                                                 <th className="pb-4 font-semibold text-right">Holat</th>
                                              </tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100">
                                              {lesson.results.map((r, i) => (
                                                <tr key={i} className="group/row hover:bg-slate-50/50 transition-colors">
                                                   <td className="py-4 pr-4">
                                                      <p className="text-sm font-semibold text-slate-900 line-clamp-2" title={r.tests?.question}>{r.tests?.question}</p>
                                                   </td>
                                                   <td className="py-4 pr-4">
                                                      <span className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg line-clamp-1" title={r.answer}>{r.answer}</span>
                                                   </td>
                                                   <td className="py-4 text-right">
                                                      {r.is_correct ? (
                                                         <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-bold">
                                                            <CheckCircle2 className="h-4 w-4" /> To'g'ri
                                                         </div>
                                                      ) : (
                                                         <div className="inline-flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl text-xs font-bold">
                                                            <XCircle className="h-4 w-4" /> Xato
                                                         </div>
                                                      )}
                                                   </td>
                                                </tr>
                                              ))}
                                           </tbody>
                                        </table>
                                     </div>
                                  </div>
                                )}
                             </div>
                           );
                        })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievement Banner */}
        <div className="rounded-3xl bg-indigo-600 p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 mt-12 shadow-lg">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/30 blur-[80px] rounded-full -ml-20 -mb-20" />
           
           <div className="relative z-10 space-y-4 text-center md:text-left max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                 Bilim cho'qqilarini zabt eting
              </h2>
              <p className="text-indigo-100 text-lg">
                 Sertifikatlar va premium nishonlarni to'plash orqali o'z portfoliongizni boyiting. O'qishda davom eting va natijalaringizni oshiring.
              </p>
           </div>
           <Button asChild className="relative z-10 h-14 px-8 rounded-xl bg-white text-indigo-600 font-bold hover:bg-slate-50 transition-all text-base shadow-sm">
              <Link to="/student/courses">
                Kurslarga o'tish <GraduationCap className="ml-2 h-5 w-5" />
              </Link>
           </Button>
        </div>

      </div>
    </Layout>
  );
};

export default StudentResults;
