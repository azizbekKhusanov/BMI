import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Users, GraduationCap, Filter, 
  TrendingUp, BookOpen, Activity, Clock,
  ClipboardList, Brain, MessageSquare, ArrowRight, UserCheck, Star, X
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

interface Course {
  id: string;
  title: string;
  teacher_id?: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  created_at: string;
  profiles?: Profile;
  courses?: Course;
}

interface TestResult {
  id: string;
  test_id: string;
  user_id: string;
  is_correct: boolean;
  answer: string;
  created_at: string;
  tests?: {
    question: string;
    lesson_id: string;
    lessons: { title: string };
  };
}

interface SelfAssessment {
  id: string;
  user_id: string;
  lesson_id: string;
  rating: number;
  reflection: string | null;
  created_at: string;
  lessons?: { title: string };
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  course_id: string;
  content: string;
  created_at: string;
}

const TeacherStudents = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "progress" | "date" | "calibration" | "reflection">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "attention" | "inactive">("all");
  const [studentMetaCache, setStudentMetaCache] = useState<Record<string, {
    testCount: number;
    correctCount: number;
    reflectionCount: number;
    calibrationScore: number;
  }>>({});

  const [selectedStudent, setSelectedStudent] = useState<Enrollment | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<{ 
    tests: TestResult[], 
    reflections: SelfAssessment[] 
  }>({ tests: [], reflections: [] });
  const [isAnalyticLoading, setIsAnalyticLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("courses").select("id, title").eq("teacher_id", user.id);
    setCourses(data || []);
  }, [user]);

  const fetchEnrollments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: myCourses } = await supabase.from("courses").select("id, title").eq("teacher_id", user.id);
      const courseIds = (myCourses || []).map(c => c.id);
      
      if (courseIds.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      // 1. Fetch Enrollments
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses:course_id (id, title)
        `)
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (enrollError) throw enrollError;
      
      const enrolls = (enrollmentsData as any[]) || [];
      const userIds = [...new Set(enrolls.map(e => e.user_id))];

      if (userIds.length > 0) {
        // 2. Fetch Profiles, Tests and Reflections in Parallel
        const [profilesRes, testRes, reflectionRes] = await Promise.all([
          supabase.from("profiles").select("*").in("user_id", userIds),
          supabase.from("test_results").select("user_id, is_correct").in("user_id", userIds),
          supabase.from("self_assessments").select("user_id, rating").in("user_id", userIds)
        ]);

        const profilesData = profilesRes.data || [];
        const tests = (testRes.data || []) as { user_id: string; is_correct: boolean }[];
        const reflections = (reflectionRes.data || []) as { user_id: string; rating: number }[];

        // Enriched enrollment data
        const enriched = enrolls.map(e => ({
          ...e,
          profiles: profilesData.find(p => p.user_id === e.user_id)
        }));

        setEnrollments(enriched as Enrollment[]);

        // 3. Build Metadata Cache
        const cache: Record<string, {
          testCount: number;
          correctCount: number;
          reflectionCount: number;
          calibrationScore: number;
        }> = {};

        userIds.forEach(uid => {
          const userTests = tests.filter(t => t.user_id === uid);
          const userReflections = reflections.filter(r => r.user_id === uid);
          const correctCount = userTests.filter(t => t.is_correct).length;
          const totalTests = userTests.length;

          const avgRating = userReflections.length > 0
            ? userReflections.reduce((sum, r) => sum + r.rating, 0) / userReflections.length
            : 0;
          const calibrationScore = Math.round((avgRating / 5) * 100);

          cache[uid] = {
            testCount: totalTests,
            correctCount,
            reflectionCount: userReflections.length,
            calibrationScore
          };
        });

        setStudentMetaCache(cache);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, [fetchCourses, fetchEnrollments]);

  const fetchMessages = useCallback(async (student: Enrollment) => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .or(`sender_id.eq.${student.user_id},recipient_id.eq.${student.user_id}`)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
  }, [user]);

  const fetchStudentAnalytics = async (student: Enrollment) => {
    setSelectedStudent(student);
    setIsAnalyticLoading(true);
    try {
      const [testRes, reflectionRes] = await Promise.all([
        supabase.from("test_results").select("*, tests(*, lessons(title))").eq("user_id", student.user_id),
        supabase.from("self_assessments").select("*, lessons(title)").eq("user_id", student.user_id)
      ]);
      setStudentAnalytics({
        tests: (testRes.data as any[]) || [],
        reflections: (reflectionRes.data as any[]) || []
      });
      fetchMessages(student);
    } catch (error) {
       console.error(error);
    } finally {
      setIsAnalyticLoading(false);
    }
  };

  const getStudentStatus = (enrollment: Enrollment) => {
    const meta = studentMetaCache[enrollment.user_id];
    if (!meta) return "inactive";
    if (enrollment.progress === 0 && meta.testCount === 0) return "inactive";
    if (meta.calibrationScore < 50 || enrollment.progress < 30) return "attention";
    return "active";
  };

  const getStatusLabel = (status: string) => ({
    active: { label: "Faol", bg: "bg-emerald-50", text: "text-emerald-700" },
    attention: { label: "Diqqat talab etadi", bg: "bg-amber-50", text: "text-amber-700" },
    inactive: { label: "Harakatsiz", bg: "bg-slate-100", text: "text-slate-500" },
  }[status] || { label: "Noma'lum", bg: "bg-slate-100", text: "text-slate-500" });

  const sortedAndFiltered = enrollments
    .filter((e) => {
      const matchesCourse = selectedCourse === "all" || e.course_id === selectedCourse;
      const studentName = e.profiles?.full_name || "";
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getStudentStatus(e);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesCourse && matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.profiles?.full_name || "").localeCompare(b.profiles?.full_name || "");
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "calibration") {
        const aScore = studentMetaCache[a.user_id]?.calibrationScore || 0;
        const bScore = studentMetaCache[b.user_id]?.calibrationScore || 0;
        return bScore - aScore;
      }
      if (sortBy === "reflection") {
        const aCount = studentMetaCache[a.user_id]?.reflectionCount || 0;
        const bCount = studentMetaCache[b.user_id]?.reflectionCount || 0;
        return bCount - aCount;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const currentItems = sortedAndFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedStudent || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: selectedStudent.user_id,
        course_id: selectedStudent.course_id,
        content: newMessage.trim()
      });
      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div className="w-full pt-8 px-8 space-y-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-20 w-full rounded-xl mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <>
      <div className="w-full pb-8 pt-8 px-8 space-y-8 pb-20">
        
        {/* 1. Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Talabalar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {enrollments.length} ta talaba · 
              {enrollments.filter(e => getStudentStatus(e) === "attention").length} ta 
              diqqat talab etadi
            </p>
          </div>
          <Button
            onClick={fetchEnrollments}
            variant="outline"
            className="h-9 px-4 rounded-lg border-slate-200 font-medium 
                       text-slate-600 text-sm gap-2 bg-white"
          >
            <Activity className="h-4 w-4" /> Yangilash
          </Button>
        </div>

        {/* 2. Stat Kartalar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* 1 — Jami talabalar */}
          <div
            onClick={() => setStatusFilter("all")}
            className={`bg-white rounded-xl border p-5 cursor-pointer 
                        transition-all hover:shadow-md ${
              statusFilter === "all" 
                ? "border-[#0056d2] ring-1 ring-[#0056d2]" 
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 
                              flex items-center justify-center">
                <Users className="h-4 w-4 text-[#0056d2]" />
              </div>
              <span className="text-[10px] font-medium text-slate-400 
                               uppercase tracking-wide">Jami</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {enrollments.length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              ta talaba
            </p>
          </div>

          {/* 2 — Faol */}
          <div
            onClick={() => setStatusFilter("active")}
            className={`bg-white rounded-xl border p-5 cursor-pointer 
                        transition-all hover:shadow-md ${
              statusFilter === "active"
                ? "border-emerald-500 ring-1 ring-emerald-500"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 
                              flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 
                                animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-600">
                  Faol
                </span>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {enrollments.filter(e => getStudentStatus(e) === "active").length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              ta faol talaba
            </p>
          </div>

          {/* 3 — Diqqat talab etadi */}
          <div
            onClick={() => setStatusFilter("attention")}
            className={`bg-white rounded-xl border p-5 cursor-pointer 
                        transition-all hover:shadow-md ${
              statusFilter === "attention"
                ? "border-amber-500 ring-1 ring-amber-500"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 
                              flex items-center justify-center">
                <Activity className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-[10px] font-medium text-amber-600 
                               uppercase tracking-wide">Diqqat</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {enrollments.filter(e => getStudentStatus(e) === "attention").length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              ta talaba
            </p>
          </div>

          {/* 4 — O'rtacha kalibrlash */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 
                              flex items-center justify-center">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-[10px] font-medium text-slate-400 
                               uppercase tracking-wide">Kalibrlash</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">
              {(() => {
                const scores = Object.values(studentMetaCache)
                  .map(m => m.calibrationScore).filter(s => s > 0);
                return scores.length > 0
                  ? `${Math.round(scores.reduce((a,b) => a+b,0) / scores.length)}%`
                  : "—";
              })()}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1.5">
              o'rtacha aniqlik
            </p>
          </div>

        </div>

        {/* 3. Filter Paneli */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">

            {/* Qidiruv */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 
                                 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Talaba ismini kiriting..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-10 pl-9 rounded-lg border-slate-200 text-sm 
                           font-medium focus-visible:ring-[#0056d2]"
              />
            </div>

            {/* Kurs filtri */}
            <Select value={selectedCourse}
              onValueChange={(v) => { setSelectedCourse(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 
                                        bg-white text-sm font-medium w-full sm:w-48">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder="Barcha kurslar" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha kurslar</SelectItem>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Saralash */}
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200 
                                        bg-white text-sm font-medium w-full sm:w-52">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                  <SelectValue placeholder="Tartiblash" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Oxirgi qo'shilganlar</SelectItem>
                <SelectItem value="name">Ism (A-Z)</SelectItem>
                <SelectItem value="progress">Progress (Yuqori)</SelectItem>
                <SelectItem value="calibration">Kalibrlash (Yuqori)</SelectItem>
                <SelectItem value="reflection">Refleksiya soni</SelectItem>
              </SelectContent>
            </Select>

          </div>

          {/* Holat filtri — chip uslubida */}
          <div className="flex items-center gap-2 mt-3 pt-3 
                          border-t border-slate-100 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Holat:</span>
            {[
              { value: "all", label: "Barchasi" },
              { value: "active", label: "Faol", 
                on: "bg-emerald-100 text-emerald-700 border-emerald-200",
                off: "bg-white text-slate-600 border-slate-200" },
              { value: "attention", label: "Diqqat talab etadi",
                on: "bg-amber-100 text-amber-700 border-amber-200",
                off: "bg-white text-slate-600 border-slate-200" },
              { value: "inactive", label: "Harakatsiz",
                on: "bg-slate-200 text-slate-700 border-slate-300",
                off: "bg-white text-slate-600 border-slate-200" },
            ].map(({ value, label, on, off }) => (
              <button
                key={value}
                onClick={() => { setStatusFilter(value as any); setCurrentPage(1); }}
                className={`h-7 px-3 rounded-full text-[11px] font-semibold 
                            border transition-all ${
                  statusFilter === value
                    ? (on || "bg-[#0056d2] text-white border-[#0056d2]")
                    : (off || "bg-white text-slate-600 border-slate-200 hover:border-slate-300")
                }`}
              >
                {label}
              </button>
            ))}

            {/* Faol filtrlar tozalash */}
            {(selectedCourse !== "all" || statusFilter !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCourse("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="ml-auto text-[11px] text-slate-400 
                           hover:text-slate-600 font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Tozalash
              </button>
            )}
          </div>
        </div>

        {/* 4. Talabalar Ro'yxati */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">
                {sortedAndFiltered.length} ta talaba
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
            ) : currentItems.length > 0 ? (
              currentItems.map((e) => {
                const meta = studentMetaCache[e.user_id] || {
                  testCount: 0, correctCount: 0,
                  reflectionCount: 0, calibrationScore: 0
                };
                const status = getStudentStatus(e);
                const statusInfo = getStatusLabel(status);

                return (
                  <div
                    key={e.id}
                    onClick={() => fetchStudentAnalytics(e)}
                    className="bg-white rounded-xl border border-slate-200 
                               hover:border-[#0056d2] hover:shadow-md 
                               cursor-pointer transition-all duration-200 p-5"
                  >
                    <div className="flex items-center gap-4">

                      {/* Avatar + holat dot */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-11 w-11 border-2 border-white 
                                           shadow-sm ring-1 ring-slate-100">
                          <AvatarImage src={e.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-[#0056d2] text-white 
                                                      font-bold text-sm">
                            {e.profiles?.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {/* Holat indikatori */}
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 
                                         rounded-full border-2 border-white ${
                          status === "active" ? "bg-emerald-500" :
                          status === "attention" ? "bg-amber-400" : "bg-slate-300"
                        }`} />
                      </div>

                      {/* Ism va kurs */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {e.profiles?.full_name || "Noma'lum"}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 
                                           rounded-full flex-shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate">
                          {e.courses?.title}
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="hidden sm:flex flex-col items-end gap-1.5 
                                      flex-shrink-0 w-32">
                        <div className="flex items-center gap-1.5 w-full">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                e.progress >= 70 ? "bg-emerald-500" :
                                e.progress >= 30 ? "bg-[#0056d2]" : "bg-slate-300"
                              }`}
                              style={{ width: `${e.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8 text-right">
                            {Math.round(e.progress)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          O'zlashtirish
                        </span>
                      </div>

                      {/* 3 ta metakognitiv ko'rsatkich */}
                      <div className="hidden md:flex items-center gap-2 flex-shrink-0">

                        {/* Testlar */}
                        <div className="text-center min-w-[48px]">
                          <p className="text-sm font-bold text-slate-900">
                            {meta.testCount > 0
                              ? `${meta.correctCount}/${meta.testCount}`
                              : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Test
                          </p>
                        </div>

                        <div className="w-px h-8 bg-slate-100" />

                        {/* Kalibrlash */}
                        <div className="text-center min-w-[52px]">
                          <p className={`text-sm font-bold ${
                            meta.calibrationScore >= 70 ? "text-emerald-600" :
                            meta.calibrationScore >= 40 ? "text-amber-600" :
                            meta.calibrationScore > 0 ? "text-red-500" : "text-slate-400"
                          }`}>
                            {meta.calibrationScore > 0 
                              ? `${meta.calibrationScore}%` : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Kalibr
                          </p>
                        </div>

                        <div className="w-px h-8 bg-slate-100" />

                        {/* Refleksiya */}
                        <div className="text-center min-w-[48px]">
                          <p className="text-sm font-bold text-slate-900">
                            {meta.reflectionCount > 0 
                              ? `${meta.reflectionCount}` : "—"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Refleks
                          </p>
                        </div>

                      </div>

                      {/* O'q */}
                      <ArrowRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    </div>

                    {/* Mobile uchun progress va metakognitiv */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0056d2]"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {Math.round(e.progress)}%
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span className="text-xs text-slate-500">
                          Test: <strong className="text-slate-900">
                            {meta.testCount > 0 ? `${meta.correctCount}/${meta.testCount}` : "—"}
                          </strong>
                        </span>
                        <span className="text-xs text-slate-500">
                          Kalibrlash: <strong className={
                            meta.calibrationScore >= 70 ? "text-emerald-600" :
                            meta.calibrationScore >= 40 ? "text-amber-600" : "text-slate-400"
                          }>
                            {meta.calibrationScore > 0 ? `${meta.calibrationScore}%` : "—"}
                          </strong>
                        </span>
                        <span className="text-xs text-slate-500">
                          Refleksiya: <strong className="text-slate-900">
                            {meta.reflectionCount || "—"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-white rounded-xl 
                              border border-dashed border-slate-200">
                <div className="h-14 w-14 rounded-full bg-slate-50 
                                flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Talabalar topilmadi
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Qidiruv yoki filtr parametrlarini o'zgartiring
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {sortedAndFiltered.length > itemsPerPage && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-slate-500 font-medium">
                {sortedAndFiltered.length} ta dan {(currentPage-1)*itemsPerPage+1}–
                {Math.min(currentPage*itemsPerPage, sortedAndFiltered.length)} ko'rsatilmoqda
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-lg border-slate-200 text-xs font-medium"
                >
                  Oldingi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p+1)}
                  disabled={currentPage * itemsPerPage >= sortedAndFiltered.length}
                  className="h-8 px-3 rounded-lg border-slate-200 text-xs font-medium"
                >
                  Keyingi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Yon Panel (Sheet) */}
      <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <SheetContent className="sm:max-w-md md:max-w-lg rounded-l-xl border-l border-slate-200 shadow-xl p-0 overflow-hidden bg-white flex flex-col">
          {selectedStudent && (
            <>
              {/* Sheet header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-slate-100">
                    <AvatarImage src={selectedStudent.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#0056d2] text-white text-xl font-bold">
                      {selectedStudent.profiles?.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {selectedStudent.profiles?.full_name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                      {selectedStudent.courses?.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`h-2 w-2 rounded-full ${
                        getStudentStatus(selectedStudent) === "active" 
                          ? "bg-emerald-500" 
                          : getStudentStatus(selectedStudent) === "attention"
                            ? "bg-amber-400" : "bg-slate-300"
                      }`} />
                      <span className="text-[11px] font-medium text-slate-500">
                        {getStatusLabel(getStudentStatus(selectedStudent)).label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheet stat kartalar */}
              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  { label: "O'zlashtirish", value: `${Math.round(selectedStudent.progress)}%`, icon: TrendingUp, color: "text-[#0056d2]", bg: "bg-blue-50" },
                  { label: "Testlar", value: `${studentAnalytics.tests.length} ta`, icon: ClipboardList, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Kalibrlash", value: studentMetaCache[selectedStudent.user_id]?.calibrationScore > 0 ? `${studentMetaCache[selectedStudent.user_id].calibrationScore}%` : "—", icon: Brain, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Refleksiya", value: `${studentAnalytics.reflections.length} ta`, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className={`h-7 w-7 rounded-md ${s.bg} ${s.color} 
                                     flex items-center justify-center mb-2`}>
                      <s.icon className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">{s.value}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase 
                                 tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Chat va refleksiyalar wrapper */}
              <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-8 custom-scrollbar">

                {/* Xabarlar */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 
                                 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#0056d2]" /> Xabarlar
                  </h3>
                  <Card className="rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col h-[350px]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
                      {messages.length > 0 ? messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-lg text-sm font-medium ${
                            msg.sender_id === user?.id 
                              ? 'bg-[#0056d2] text-white' 
                              : 'bg-white text-slate-800 border border-slate-200'
                          }`}>
                            {msg.content}
                            <div className={`text-[10px] mt-1 text-right ${msg.sender_id === user?.id ? 'text-blue-200' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                          <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                          <p className="text-xs font-medium">Hozircha xabarlar yo'q</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                      <Input 
                        placeholder="Xabaringizni yozing..." 
                        className="h-10 rounded-md border-slate-200 text-sm focus-visible:ring-[#0056d2]"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={isSending || !newMessage.trim()}
                        className="h-10 px-4 rounded-md bg-[#0056d2] text-white hover:bg-[#00419e] transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Refleksiyalar */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 
                                 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" /> Refleksiyalar
                  </h3>
                  <div className="space-y-3">
                    {studentAnalytics.reflections.length > 0 ? studentAnalytics.reflections.map((ref) => (
                      <Card key={ref.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-slate-100 text-slate-600 border-none font-semibold text-[10px] uppercase tracking-wide">
                            {ref.lessons?.title || "Dars"}
                          </Badge>
                          <div className="flex gap-1">
                            {Array(5).fill(0).map((_, i) => (
                              <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < ref.rating ? 'bg-[#0056d2]' : 'bg-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          "{ref.reflection}"
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium text-right">
                          {new Date(ref.created_at).toLocaleDateString()}
                        </p>
                      </Card>
                    )) : (
                      <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-500 font-medium text-sm">
                        Refleksiya mavjud emas
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default TeacherStudents;
