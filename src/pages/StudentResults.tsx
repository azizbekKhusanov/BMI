import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Target, Calendar, CheckCircle2, XCircle, 
  Search, BookOpen, ChevronRight, Activity, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { useCallback } from "react";

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

  const fetchResults = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch test results
      const { data: resultsData, error: resultsError } = await supabase
        .from("test_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (resultsError) throw resultsError;

      if (resultsData && resultsData.length > 0) {
        // 2. Fetch tests
        const testIds = [...new Set(resultsData.map(r => r.test_id))];
        const { data: testsData } = await supabase
          .from("tests")
          .select("*")
          .in("id", testIds);
        
        // 3. Fetch lessons
        const lessonIds = [...new Set(testsData?.map(t => t.lesson_id) || [])];
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("*")
          .in("id", lessonIds);
        
        // 4. Fetch courses
        const courseIds = [...new Set(lessonsData?.map(l => l.course_id) || [])];
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);

        // Map everything together
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800 font-serif tracking-tight uppercase">Mening Natijalarim</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                Barcha yechilgan testlar va o'zlashtirish statistikasi
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
                <Target className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jami urinishlar</p>
                <p className="text-3xl font-bold text-slate-800">{stats.total} ta</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">To'g'ri javoblar</p>
                <p className="text-3xl font-bold text-slate-800">{stats.correct} ta</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardContent className="p-8 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">O'rtacha aniqlik</p>
                <p className="text-3xl font-bold text-slate-800">{stats.accuracy}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Test yoki dars nomini qidiring..." 
            className="w-full h-16 pl-16 pr-6 rounded-[2rem] border-none bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-sm font-medium"
          />
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <Card className="border-dashed border-2 py-20 text-center bg-slate-50/50 rounded-[3rem]">
              <div className="space-y-4">
                <Activity className="h-12 w-12 text-slate-200 mx-auto" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Hozircha natijalar topilmadi</p>
              </div>
            </Card>
          ) : (
            filteredResults.map((result) => (
              <Card key={result.id} className="border-none shadow-sm rounded-3xl bg-white hover:shadow-md transition-all group overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className={`w-2 md:self-stretch ${result.is_correct ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-slate-50 text-slate-400 hover:bg-slate-50 border-none px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {result.tests?.lessons?.courses?.title || "Kurs nomi yo'q"}
                          </Badge>
                          <span className="text-[10px] text-slate-300 font-bold">•</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {result.tests?.lessons?.title}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight">
                          {result.tests?.question}
                        </h3>
                        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(result.created_at), "d MMMM, yyyy HH:mm", { locale: uz })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            Javobingiz: <span className="text-slate-600">{result.answer}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {result.is_correct ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-5 py-2.5 rounded-2xl border border-emerald-100">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-widest">To'g'ri</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl border border-red-100">
                            <XCircle className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Xato</span>
                          </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-indigo-300 transition-colors hidden md:block" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentResults;
