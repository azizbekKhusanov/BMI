import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, Target, CheckCircle2, XCircle, 
  BookOpen, ChevronDown, ChevronUp, BarChart3,
  SearchIcon, Filter, GraduationCap, Layout,
  TrendingUp, ClipboardCheck, Calendar, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  
  // Filter States
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const fetchResults = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("test_results")
        .select(`
          *,
          tests (
            id,
            question,
            lesson_id,
            lessons (
              id,
              title,
              course_id,
              courses (
                id,
                title
              )
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  }, [user]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  // Extract unique filter options
  const courses = Array.from(new Set(results.map(r => r.tests?.lessons?.courses?.id).filter(Boolean)))
    .map(id => ({ id, title: results.find(r => r.tests?.lessons?.courses?.id === id)?.tests?.lessons?.courses?.title }));

  const lessonsGroup = results
    .filter(r => selectedCourse === "all" || r.tests?.lessons?.course_id === selectedCourse)
    .map(r => ({ id: r.tests?.lessons?.id, title: r.tests?.lessons?.title }))
    .filter((v, i, a) => v.id && a.findIndex(t => t.id === v.id) === i);

  // Filtered logic
  const filteredData = results.filter(r => {
    const courseMatch = selectedCourse === "all" || r.tests?.lessons?.course_id === selectedCourse;
    const lessonMatch = selectedLesson === "all" || r.tests?.lessons?.id === selectedLesson;
    const statusMatch = selectedStatus === "all" || (selectedStatus === "correct" ? r.is_correct : !r.is_correct);
    return courseMatch && lessonMatch && statusMatch;
  });

  const stats = {
    total: filteredData.length,
    correct: filteredData.filter(r => r.is_correct).length,
    accuracy: filteredData.length ? Math.round((filteredData.filter(r => r.is_correct).length / filteredData.length) * 100) : 0
  };

  return (
    <div className="max-w-full mx-auto py-6 px-6 lg:px-8 space-y-6 pb-20 bg-[#fbfcfd]">
      
      {/* 1. Header & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col xl:flex-row xl:items-end justify-between gap-6">
         <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
               <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4" />
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Akademik Monitoring</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">O'zlashtirish Tahlili</h1>
            <p className="text-slate-500 text-[11px] font-medium max-w-md">Barcha test topshiriqlarining batafsil statistikasi.</p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5 min-w-[180px]">
               <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Kurs</label>
               <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setSelectedLesson("all"); }}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[11px] font-bold rounded-xl outline-none">
                     <SelectValue placeholder="Kurs tanlang" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="all">Barcha kurslar</SelectItem>
                     {courses.map(c => <SelectItem key={c.id} value={c.id!}>{c.title}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>

            <div className="space-y-1.5 min-w-[180px]">
               <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Dars</label>
               <Select value={selectedLesson} onValueChange={setSelectedLesson} disabled={selectedCourse === "all"}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[11px] font-bold rounded-xl outline-none">
                     <SelectValue placeholder="Dars tanlang" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="all">Barcha darslar</SelectItem>
                     {lessonsGroup.map(l => <SelectItem key={l.id} value={l.id!}>{l.title}</SelectItem>)}
                  </SelectContent>
               </Select>
            </div>

            <div className="space-y-1.5 min-w-[140px]">
               <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Holat</label>
               <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[11px] font-bold rounded-xl outline-none">
                     <SelectValue placeholder="Barchasi" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="all">Barcha testlar</SelectItem>
                     <SelectItem value="correct">To'g'ri</SelectItem>
                     <SelectItem value="wrong">Xato</SelectItem>
                  </SelectContent>
               </Select>
            </div>
         </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {[
           { label: "Jami Urinish", val: stats.total, icon: ClipboardCheck, col: "text-blue-600", bg: "bg-blue-50" },
           { label: "Muvaffaqiyatli", val: stats.correct, icon: CheckCircle2, col: "text-emerald-600", bg: "bg-emerald-50" },
           { label: "Aniqlik Darajasi", val: `${stats.accuracy}%`, icon: TrendingUp, col: "text-indigo-600", bg: "bg-indigo-50" }
         ].map((s, i) => (
            <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm group hover:border-blue-100 transition-all">
               <div className={`h-9 w-9 rounded-xl ${s.bg} ${s.col} flex items-center justify-center shrink-0`}>
                  <s.icon className="h-4.5 w-4.5" />
               </div>
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-slate-800 leading-none">{s.val}</p>
               </div>
            </div>
         ))}
      </div>

      {/* 3. Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
         <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600">
               <Layout className="h-4 w-4 text-slate-400" /> 
               <span className="text-xs font-bold uppercase tracking-tight">Testlar Ro'yxati</span>
            </div>
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-bold text-[9px] h-5">{filteredData.length} ta natija</Badge>
         </div>

         <div className="overflow-x-auto">
            {loading ? (
               <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
               </div>
            ) : filteredData.length === 0 ? (
               <div className="p-16 text-center">
                  <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                     <Info className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold text-xs">Ma'lumot topilmadi.</p>
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr>
                        <th className="px-6 py-3 text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">Savol</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">Kurs / Dars</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">Holat</th>
                        <th className="px-6 py-3 text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20 text-right">Sana</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {filteredData.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group text-[11px]">
                           <td className="px-6 py-4">
                              <p className="font-bold text-slate-700 max-w-xs sm:max-w-md truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{r.tests?.question}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col">
                                 <span className="font-bold text-slate-600">{r.tests?.lessons?.courses?.title}</span>
                                 <span className="font-medium text-slate-400 italic line-clamp-1">{r.tests?.lessons?.title}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <Badge variant={r.is_correct ? "outline" : "destructive"} className={`h-5 text-[8px] font-black border-none px-2 rounded-md ${r.is_correct ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {r.is_correct ? "TO'G'RI" : "XATO"}
                              </Badge>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className="font-bold text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
         </div>
      </div>

      {/* Support Footer */}
      <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="relative z-10 space-y-1">
            <h3 className="text-white font-bold text-sm tracking-tight">O'zlashtirishni tahlil qiling</h3>
            <p className="text-slate-400 text-[10px] leading-relaxed max-w-sm">Xatolar ustida ishlash - muvaffaqiyat garovidir.</p>
         </div>
         <Button asChild variant="outline" className="h-8 px-4 rounded-lg bg-transparent border-slate-700 text-white font-bold text-[10px] uppercase hover:bg-slate-800 shrink-0 transition-all">
            <Link to="/student/courses">Kurslar</Link>
         </Button>
      </div>
    </div>
  );
};

export default StudentResults;
