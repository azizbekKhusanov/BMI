import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { analyzeReflection } from "@/lib/groq";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, 
         SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Brain, Star, MessageSquare, TrendingUp,
  Search, ChevronRight, Target, Activity,
  Sparkles, Calendar, RefreshCcw, Loader2,
  Filter, History, StickyNote, ChevronDown,
  CheckCircle, AlertCircle, Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SelfAssessment {
  id: string;
  user_id: string;
  lesson_id: string;
  rating: number;
  reflection: string | null;
  predicted_score: number | null;
  actual_score: number | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  lessons: {
    title: string;
    course_id: string;
    courses: {
      title: string;
    };
  };
}

interface AIAnalysis {
  depth: "sirtaki" | "o'rtacha" | "chuqur";
  mainIssue: string;
  recommendation: string;
  positives: string;
}

interface TeacherNote {
  assessmentId: string;
  note: string;
  savedAt: string;
}

const TeacherSelfAssessments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<SelfAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter
  const [courseFilter, setCourseFilter] = useState("all");
  const [depthFilter, setDepthFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [courses, setCourses] = useState<{id: string; title: string}[]>([]);

  // AI tahlil
  const [aiAnalyses, setAiAnalyses] = useState<Record<string, AIAnalysis>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Tarix dialog
  const [historyStudent, setHistoryStudent] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [historyData, setHistoryData] = useState<SelfAssessment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // O'qituvchi izohi
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchAssessments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. O'qituvchi kurslarini olamiz
      const { data: teacherCourses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("teacher_id", user.id);
      
      const courseIds = teacherCourses?.map(c => c.id) || [];
      setCourses(teacherCourses || []);
      if (courseIds.length === 0) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      // 2. Shu kurslarga tegishli darslarni olamiz
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("id")
        .in("course_id", courseIds);
      
      const lessonIds = lessonsData?.map(l => l.id) || [];
      if (lessonIds.length === 0) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      // 3. Shu darslarga tegishli assessmentlarni olamiz
      const { data, error } = await supabase
        .from("self_assessments")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          lessons:lesson_id (
            title,
            course_id,
            courses:course_id (title)
          )
        `)
        .in("lesson_id", lessonIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssessments((data as any) || []);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleAnalyzeReflection = async (a: SelfAssessment) => {
    if (!a.reflection) return toast.error("Refleksiya matni yo'q");
    setAnalyzingId(a.id);
    try {
      const calibration = a.predicted_score !== null && a.actual_score !== null
        ? Math.abs(a.predicted_score - a.actual_score)
        : null;

      const result = await analyzeReflection(
        a.profiles?.full_name || "Noma'lum",
        a.lessons?.title || "Noma'lum dars",
        a.lessons?.courses?.title || "Noma'lum kurs",
        a.reflection,
        a.rating,
        calibration
      );

      const parsed: AIAnalysis = JSON.parse(result);
      setAiAnalyses(prev => ({ ...prev, [a.id]: parsed }));
    } catch {
      toast.error("AI tahlilda xatolik");
    } finally {
      setAnalyzingId(null);
    }
  };

  const fetchStudentHistory = async (userId: string) => {
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .from("self_assessments")
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          lessons:lesson_id (
            title, course_id,
            courses:course_id (title)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setHistoryData((data as any) || []);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveNote = async (assessmentId: string) => {
    setSavingNote(true);
    try {
      // localStorage da saqlash
      const allNotes = JSON.parse(
        localStorage.getItem("teacher_notes") || "{}"
      );
      allNotes[assessmentId] = {
        note: noteText,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem("teacher_notes", JSON.stringify(allNotes));
      setNotes(prev => ({ ...prev, [assessmentId]: noteText }));
      setEditingNoteId(null);
      toast.success("Izoh saqlandi");
    } finally {
      setSavingNote(false);
    }
  };

  // Komponent mount bo'lganda localStoragedan izohlarni o'qi:
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("teacher_notes") || "{}"
    );
    const notesMap: Record<string, string> = {};
    Object.entries(saved).forEach(([id, val]: any) => {
      notesMap[id] = val.note;
    });
    setNotes(notesMap);
  }, []);

  const parseReflection = (text: string | null) => {
    if (!text) return ["Fikr bildirilmagan", "", ""];

    // | belgisi bilan ajratilgan format
    if (text.includes('|')) {
      const parts = text.split('|');
      return [
        parts[0]?.split(':')[1]?.trim() || parts[0]?.trim() || "",
        parts[1]?.split(':')[1]?.trim() || parts[1]?.trim() || "",
        parts[2]?.split(':')[1]?.trim() || parts[2]?.trim() || ""
      ];
    }

    // Oddiy matn — hammasini birinchi qutiga qo'y
    return [text.trim(), "", ""];
  };

  const filteredAssessments = assessments
    .filter(a => {
      // Qidiruv
      const matchSearch =
        a.profiles?.full_name?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        a.lessons?.title?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      // Kurs filtri
      const matchCourse = courseFilter === "all" ||
        a.lessons?.course_id === courseFilter;

      // Vaqt filtri
      const date = new Date(a.created_at);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const matchTime =
        timeFilter === "all" ? true :
        timeFilter === "today" ? diff < 86400000 :
        timeFilter === "week" ? diff < 604800000 :
        timeFilter === "month" ? diff < 2592000000 : true;

      // Aniqlik filtri (AI tahlil bo'lsa)
      const analysis = aiAnalyses[a.id];
      const matchDepth = depthFilter === "all" ||
        (analysis && analysis.depth === depthFilter);

      return matchSearch && matchCourse && matchTime && matchDepth;
    })
    .sort((a, b) => {
      if (sortBy === "latest")
        return new Date(b.created_at).getTime() -
               new Date(a.created_at).getTime();
      if (sortBy === "lowest_rating") return a.rating - b.rating;
      if (sortBy === "highest_gap") {
        const gapA = a.predicted_score !== null && a.actual_score !== null
          ? Math.abs(a.predicted_score - a.actual_score) : 0;
        const gapB = b.predicted_score !== null && b.actual_score !== null
          ? Math.abs(b.predicted_score - b.actual_score) : 0;
        return gapB - gapA;
      }
      return 0;
    });

  return (
    <>
      <div className="max-w-full mx-auto py-8 px-6 lg:px-8 space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0056d2] flex items-center justify-center shadow-sm">
                    <Brain className="h-5 w-5" />
                 </div>
                 <Badge className="bg-blue-50 text-[#0056d2] border-none font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded">
                    Metakognitiv tahlillar
                 </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                 O'z-o'zini baholash tahlili
              </h1>
              <p className="text-slate-500 font-medium text-sm max-w-xl">
                 Talabalarning o'z o'rganish jarayoniga bergan baholari va chuqur refleksiyalarini ko'rib chiqing.
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchAssessments}
                className="h-10 w-10 p-0 rounded-lg border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0056d2]" />
                 <Input 
                   placeholder="Talaba yoki dars nomi..." 
                   className="h-10 pl-9 rounded-lg border-slate-200 bg-white shadow-sm w-full lg:w-[300px] font-medium text-sm focus-visible:ring-[#0056d2]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {assessments.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Jami baholashlar",
                value: assessments.length,
                icon: Brain,
                color: "text-[#0056d2]",
                bg: "bg-blue-50"
              },
              {
                label: "O'rtacha baho",
                value: `${(assessments.reduce((s, a) => s + a.rating, 0) /
                           assessments.length).toFixed(1)}/5`,
                icon: Star,
                color: "text-amber-500",
                bg: "bg-amber-50"
              },
              {
                label: "Yuqori tafovut",
                value: assessments.filter(a =>
                  a.predicted_score !== null && a.actual_score !== null &&
                  Math.abs(a.predicted_score - a.actual_score) > 1
                ).length,
                icon: Activity,
                color: "text-rose-500",
                bg: "bg-rose-50"
              },
              {
                label: "Refleksiya yozganlar",
                value: assessments.filter(a =>
                  a.reflection && a.reflection.trim().length > 20
                ).length,
                icon: MessageSquare,
                color: "text-emerald-600",
                bg: "bg-emerald-50"
              }
            ].map((s, i) => (
              <div key={i}
                   className="bg-white rounded-xl border border-slate-200 
                               p-5 shadow-sm">
                <div className={`h-9 w-9 rounded-lg ${s.bg} ${s.color} 
                                 flex items-center justify-center mb-3`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none">
                  {s.value}
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1.5 
                              uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-3">

            {/* Kurs filtri */}
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 
                                        text-xs font-medium w-44">
                <SelectValue placeholder="Barcha kurslar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kurslar</SelectItem>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Vaqt filtri */}
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 
                                        text-xs font-medium w-36">
                <SelectValue placeholder="Vaqt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha vaqt</SelectItem>
                <SelectItem value="today">Bugun</SelectItem>
                <SelectItem value="week">Bu hafta</SelectItem>
                <SelectItem value="month">Bu oy</SelectItem>
              </SelectContent>
            </Select>

            {/* AI chuqurlik filtri */}
            <Select value={depthFilter} onValueChange={setDepthFilter}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 
                                        text-xs font-medium w-40">
                <SelectValue placeholder="Refleksiya chuqurligi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha chuqurlik</SelectItem>
                <SelectItem value="sirtaki">Sirtaki</SelectItem>
                <SelectItem value="o'rtacha">O'rtacha</SelectItem>
                <SelectItem value="chuqur">Chuqur</SelectItem>
              </SelectContent>
            </Select>

            {/* Saralash */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 
                                        text-xs font-medium w-44 ml-auto">
                <SelectValue placeholder="Tartiblash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Oxirgi baholashlar</SelectItem>
                <SelectItem value="lowest_rating">Eng past baho</SelectItem>
                <SelectItem value="highest_gap">Eng yuqori tafovut</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>

        {/* Assessments List */}
        <div className="grid gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
              ) : filteredAssessments.length > 0 ? (
                filteredAssessments.map((a) => {
                  const [q1, q2, q3] = parseReflection(a.reflection);
                  const calibration = a.predicted_score !== null && a.actual_score !== null
                    ? Math.abs(a.predicted_score - a.actual_score)
                    : null;

                  return (
                      <Card key={a.id} className="border border-slate-200 shadow-sm hover:shadow-md bg-white rounded-xl overflow-hidden transition-shadow">
                        <CardContent className="p-6 lg:p-8">
                          <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left: Profile & Calibration */}
                            <div className="lg:w-1/4 flex flex-col space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8 shrink-0">
                               <div className="flex items-center lg:flex-col lg:items-start gap-4">
                                  <Avatar className="h-16 w-16 lg:h-20 lg:w-20 rounded-xl border border-slate-200 shadow-sm">
                                     <AvatarImage src={a.profiles?.avatar_url || ""} />
                                     <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xl">{a.profiles?.full_name?.[0] || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                     <h4 className="font-bold text-base lg:text-lg text-slate-900 leading-tight">{a.profiles?.full_name || "Noma'lum talaba"}</h4>
                                     <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs mt-1">
                                        <Calendar className="h-3 w-3" /> {new Date(a.created_at).toLocaleDateString('uz-UZ')}
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-4">
                                  <div className="space-y-1.5">
                                     <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Talaba bahosi</p>
                                     <div className="flex items-center gap-1.5">
                                        {Array(5).fill(0).map((_, i) => (
                                          <Star key={i} className={`h-4 w-4 ${i < a.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-50"}`} />
                                        ))}
                                        <span className="text-sm font-bold text-slate-900 ml-1">{a.rating}/5</span>
                                     </div>
                                  </div>

                                  {calibration !== null && (
                                    <div className="space-y-1.5">
                                       <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Kalibrlash (Aniqlik)</p>
                                       <Badge className={`rounded px-2.5 py-0.5 border-none font-semibold text-[10px] uppercase tracking-wide ${calibration === 0 ? 'bg-emerald-50 text-emerald-700' : calibration <= 1 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                                          {calibration === 0 ? "Mukammal" : calibration <= 1 ? "Yaxshi" : "Yuqori tafovut"}
                                       </Badge>
                                    </div>
                                  )}
                               </div>
                            </div>

                            {/* Right: Reflection Content */}
                            <div className="flex-1 space-y-6">
                               <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="space-y-1">
                                     <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{a.lessons?.courses?.title || "Kurs topilmadi"}</p>
                                     <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        {a.lessons?.title || "Mavzu topilmadi"} <ChevronRight className="h-4 w-4 text-slate-300" />
                                     </h3>
                                  </div>
                                  <Badge className="bg-slate-100 text-slate-700 rounded px-3 py-1 font-semibold text-[10px] uppercase tracking-wide border-none self-start">Tahliliy refleksiya</Badge>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {[
                                    { q: "Qiyinchiliklar", v: q1, icon: Target, color: "text-rose-600 bg-rose-50" },
                                    { q: "Sabablar", v: q2, icon: Activity, color: "text-[#0056d2] bg-blue-50" },
                                    { q: "Kelgusi reja", v: q3, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" }
                                  ].map((box, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className={`h-8 w-8 rounded-md ${box.color} flex items-center justify-center`}>
                                          <box.icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{box.q}</span>
                                      </div>
                                      <p className="text-sm text-slate-700 font-medium">
                                         "{box.v || "Talaba fikr bildirmadi"}"
                                      </p>
                                    </div>
                                  ))}
                               </div>

                               <div className="space-y-6">
                                 {/* AI Tahlil bloki */}
                                 <div className="border-t border-slate-100 pt-4">
                                   {aiAnalyses[a.id] ? (
                                     <div className="space-y-3">
                                       <div className="flex items-center gap-2 mb-3">
                                         <Sparkles className="h-4 w-4 text-purple-600" />
                                         <span className="text-xs font-bold text-slate-900 uppercase 
                                                          tracking-wide">AI Tahlil</span>
                                         <span className={`text-[10px] font-semibold px-2 py-0.5 
                                                           rounded-full ${
                                           aiAnalyses[a.id].depth === "chuqur"
                                             ? "bg-emerald-50 text-emerald-700"
                                             : aiAnalyses[a.id].depth === "o'rtacha"
                                               ? "bg-blue-50 text-blue-700"
                                               : "bg-amber-50 text-amber-700"
                                         }`}>
                                           {aiAnalyses[a.id].depth} refleksiya
                                         </span>
                                       </div>
                                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                         <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                                           <div className="flex items-center gap-1.5 mb-1.5">
                                             <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                                             <span className="text-[10px] font-semibold text-rose-700 
                                                              uppercase tracking-wide">Asosiy muammo</span>
                                           </div>
                                           <p className="text-xs text-rose-800 leading-relaxed">
                                             {aiAnalyses[a.id].mainIssue}
                                           </p>
                                         </div>
                                         <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                           <div className="flex items-center gap-1.5 mb-1.5">
                                             <Info className="h-3.5 w-3.5 text-[#0056d2]" />
                                             <span className="text-[10px] font-semibold text-blue-700 
                                                              uppercase tracking-wide">Tavsiya</span>
                                           </div>
                                           <p className="text-xs text-blue-800 leading-relaxed">
                                             {aiAnalyses[a.id].recommendation}
                                           </p>
                                         </div>
                                         <div className="p-3 bg-emerald-50 rounded-lg border 
                                                         border-emerald-100">
                                           <div className="flex items-center gap-1.5 mb-1.5">
                                             <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                             <span className="text-[10px] font-semibold text-emerald-700 
                                                              uppercase tracking-wide">Kuchli tomoni</span>
                                           </div>
                                           <p className="text-xs text-emerald-800 leading-relaxed">
                                             {aiAnalyses[a.id].positives}
                                           </p>
                                         </div>
                                       </div>
                                     </div>
                                   ) : (
                                     <Button
                                       onClick={() => handleAnalyzeReflection(a)}
                                       disabled={analyzingId === a.id || !a.reflection}
                                       variant="outline"
                                       className="h-9 px-4 rounded-lg border-purple-200 text-purple-700 
                                                  hover:bg-purple-50 font-semibold text-xs gap-2"
                                     >
                                       {analyzingId === a.id
                                         ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Tahlil qilinmoqda...</>
                                         : <><Sparkles className="h-3.5 w-3.5" /> AI tahlil qilish</>
                                       }
                                     </Button>
                                   )}
                                 </div>

                                 {/* O'qituvchi izohi bloki */}
                                 <div className="border-t border-slate-100 pt-4">
                                   <div className="flex items-center justify-between mb-2">
                                     <div className="flex items-center gap-2">
                                       <StickyNote className="h-4 w-4 text-amber-500" />
                                       <span className="text-xs font-bold text-slate-900">
                                         Mening izohim
                                       </span>
                                     </div>
                                     {editingNoteId !== a.id && (
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => {
                                           setEditingNoteId(a.id);
                                           setNoteText(notes[a.id] || "");
                                         }}
                                         className="h-7 px-2 rounded-md text-xs text-slate-500 
                                                    hover:text-slate-700"
                                       >
                                         {notes[a.id] ? "Tahrirlash" : "+ Izoh qo'shish"}
                                       </Button>
                                     )}
                                   </div>

                                   {editingNoteId === a.id ? (
                                     <div className="space-y-2">
                                       <Textarea
                                         value={noteText}
                                         onChange={(e) => setNoteText(e.target.value)}
                                         placeholder="Bu refleksiya haqida izohingizni yozing..."
                                         className="min-h-[80px] text-sm rounded-lg border-slate-200 
                                                    resize-none"
                                       />
                                       <div className="flex gap-2">
                                         <Button
                                           onClick={() => handleSaveNote(a.id)}
                                           disabled={savingNote}
                                           className="h-8 px-4 rounded-lg bg-[#0056d2] text-white 
                                                      text-xs font-medium"
                                         >
                                           {savingNote
                                             ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                             : "Saqlash"
                                           }
                                         </Button>
                                         <Button
                                           variant="outline"
                                           onClick={() => setEditingNoteId(null)}
                                           className="h-8 px-4 rounded-lg text-xs font-medium 
                                                      border-slate-200"
                                         >
                                           Bekor qilish
                                         </Button>
                                       </div>
                                     </div>
                                   ) : notes[a.id] ? (
                                     <p className="text-sm text-slate-600 bg-amber-50 rounded-lg 
                                                   p-3 border border-amber-100 leading-relaxed">
                                       {notes[a.id]}
                                     </p>
                                   ) : (
                                     <p className="text-xs text-slate-400 italic">
                                       Hozircha izoh yo'q
                                     </p>
                                   )}
                                 </div>

                                 {/* Tarix tugmasi */}
                                 <div className="border-t border-slate-100 pt-4 flex items-center 
                                                 justify-between">
                                   <Button
                                     variant="ghost"
                                     onClick={() => {
                                       setHistoryStudent({
                                         userId: a.user_id,
                                         name: a.profiles?.full_name || "Talaba"
                                       });
                                       fetchStudentHistory(a.user_id);
                                     }}
                                     className="h-8 px-3 rounded-lg text-xs font-medium text-slate-500 
                                                hover:text-[#0056d2] hover:bg-blue-50 gap-1.5"
                                   >
                                     <History className="h-3.5 w-3.5" />
                                     Refleksiya tarixini ko'rish
                                   </Button>

                                   <Button
                                     onClick={() => navigate("/teacher/messages")}
                                     className="h-8 px-4 rounded-lg bg-white border border-slate-200 
                                                text-slate-700 hover:bg-slate-50 font-semibold 
                                                text-xs gap-1.5 shadow-sm"
                                   >
                                     <MessageSquare className="h-3.5 w-3.5" />
                                     Xabar yuborish
                                   </Button>
                                 </div>
                               </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  );
                })
              ) : (
                <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-4">
                   <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                      <Brain className="h-8 w-8" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">Ma'lumotlar topilmadi</h3>
                      <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                         Hozircha hech qanday talaba refleksiya yubormagan yoki qidiruvingiz bo'yicha natija yo'q.
                      </p>
                   </div>
                   <Button onClick={() => setSearchTerm("")} variant="link" className="text-[#0056d2] font-semibold text-sm mt-2">Filtrni tozalash</Button>
                </div>
              )}
        </div>
      </div>

      <Dialog
        open={!!historyStudent}
        onOpenChange={() => setHistoryStudent(null)}
      >
        <DialogContent className="rounded-xl p-0 max-w-2xl border 
                                   border-slate-200 shadow-lg bg-white 
                                   overflow-hidden max-h-[85vh]">
          <div className="bg-slate-50 border-b border-slate-200 p-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 
                                      flex items-center gap-2">
                <History className="h-5 w-5 text-[#0056d2]" />
                {historyStudent?.name} — Refleksiya tarixi
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto p-5 space-y-4">
            {historyLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0056d2] 
                                    mx-auto mb-3" />
                <p className="text-sm text-slate-500">Yuklanmoqda...</p>
              </div>
            ) : historyData.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">
                  Hozircha refleksiyalar yo'q
                </p>
              </div>
            ) : (
              historyData.map((h, idx) => {
                const [q1] = parseReflection(h.reflection);
                const calibration = h.predicted_score !== null &&
                                    h.actual_score !== null
                  ? Math.abs(h.predicted_score - h.actual_score)
                  : null;

                return (
                  <div key={h.id}
                       className="p-4 bg-white rounded-xl border 
                                  border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {h.lessons?.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {h.lessons?.courses?.title} · 
                          {new Date(h.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i}
                                  className={`h-3.5 w-3.5 ${
                                    i < h.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200"
                                  }`} />
                          ))}
                        </div>
                        {calibration !== null && (
                          <span className={`text-[10px] font-semibold px-2 
                                           py-0.5 rounded-full ${
                            calibration === 0
                              ? "bg-emerald-50 text-emerald-700"
                              : calibration <= 1
                                ? "bg-blue-50 text-blue-700"
                                : "bg-rose-50 text-rose-700"
                          }`}>
                            {calibration === 0 ? "Mukammal"
                              : calibration <= 1 ? "Yaxshi"
                              : "Tafovut"}
                          </span>
                        )}
                      </div>
                    </div>
                    {q1 && (
                      <p className="text-sm text-slate-600 bg-slate-50 
                                    rounded-lg p-3 leading-relaxed">
                        "{q1}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeacherSelfAssessments;
