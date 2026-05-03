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
        return;
      }
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });
      if (enrollError) throw enrollError;
      const safeEnrollments = (enrollmentsData as Enrollment[]) || [];
      const userIds = [...new Set(safeEnrollments.map(e => e.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("*").in("user_id", userIds);
        const enriched = safeEnrollments.map(e => ({
          ...e,
          profiles: (profilesData as Profile[] || []).find(p => p.user_id === e.user_id),
          courses: (myCourses || []).find(c => c.id === e.course_id)
        }));
        setEnrollments(enriched);
        
        const uniqueUserIds = [...new Set(enriched.map(e => e.user_id))];
        const fetchAllStudentMeta = async (userIds: string[]) => {
          if (userIds.length === 0) return;
          try {
            const [testRes, reflectionRes, selfAssessRes] = await Promise.all([
              supabase
                .from("test_results")
                .select("user_id, is_correct")
                .in("user_id", userIds),
              supabase
                .from("self_assessments")
                .select("user_id, rating")
                .in("user_id", userIds),
              supabase
                .from("self_assessments")
                .select("user_id, rating")
                .in("user_id", userIds)
            ]);

            const tests = (testRes.data || []) as {
              user_id: string; is_correct: boolean
            }[];
            const reflections = (reflectionRes.data || []) as {
              user_id: string; rating: number
            }[];

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
          } catch (error) {
            console.error("Meta fetch error:", error);
          }
        };
        fetchAllStudentMeta(uniqueUserIds);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
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

  return (
    <>
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0056d2]">
                    <Users className="h-5 w-5" />
                 </div>
                 <h1 className="text-2xl font-bold text-slate-900 leading-tight">Talabalar ro'yxati</h1>
              </div>
              <p className="text-slate-500 text-sm font-medium">
                 Talabalarning o'quv jarayonini kuzatib boring va muloqot qiling.
              </p>
           </div>
           <Button onClick={fetchEnrollments} variant="outline" className="h-10 px-4 rounded-lg border-slate-200 font-medium text-slate-600 gap-2 bg-white">
              <Activity className="h-4 w-4 text-[#0056d2]" /> Yangilash
           </Button>
        </div>

        {/* Global Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             {
               label: "Jami talabalar",
               value: enrollments.length,
               icon: Users,
               color: "text-[#0056d2]",
               bg: "bg-blue-50"
             },
             {
               label: "Faol talabalar",
               value: enrollments.filter(e => getStudentStatus(e) === "active").length,
               icon: UserCheck,
               color: "text-emerald-600",
               bg: "bg-emerald-50"
             },
             {
               label: "Diqqat talab etadi",
               value: enrollments.filter(e => getStudentStatus(e) === "attention").length,
               icon: Activity,
               color: "text-amber-500",
               bg: "bg-amber-50"
             },
             {
               label: "O'rtacha kalibrlash",
               value: (() => {
                 const scores = Object.values(studentMetaCache)
                   .map(m => m.calibrationScore)
                   .filter(s => s > 0);
                 return scores.length > 0
                   ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`
                   : "—";
               })(),
               icon: Brain,
               color: "text-purple-600",
               bg: "bg-purple-50"
             }
           ].map((s, i) => (
             <Card key={i} className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => {
                 if (i === 1) setStatusFilter("active");
                 else if (i === 2) setStatusFilter("attention");
                 else setStatusFilter("all");
               }}
             >
               <CardContent className="p-6">
                 <div className={`h-10 w-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center mb-4`}>
                   <s.icon className="h-5 w-5" />
                 </div>
                 <p className="text-2xl font-bold text-slate-900 leading-none">{s.value}</p>
                 <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-2">{s.label}</p>
               </CardContent>
             </Card>
           ))}
        </div>

        {/* Filters and Search */}
        {/* Filters and Search */}
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Qidiruv */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Talaba ismini kiriting..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="h-10 pl-9 rounded-lg border-slate-200 font-medium text-sm w-full focus-visible:ring-[#0056d2]"
              />
            </div>

            {/* Filtrlar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Kurs filtri */}
              <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-xs font-medium min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Barcha kurslar" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200">
                  <SelectItem value="all">Barcha kurslar</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Holat filtri */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                {[
                  { value: "all", label: "Barchasi" },
                  { value: "active", label: "Faol" },
                  { value: "attention", label: "Diqqat" },
                  { value: "inactive", label: "Harakat yo'q" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setStatusFilter(value as any); setCurrentPage(1); }}
                    className={`h-7 px-3 rounded-md text-[11px] font-semibold transition-all ${
                      statusFilter === value
                        ? "bg-white text-[#0056d2] shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Saralash */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-white text-xs font-medium min-w-[170px]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-slate-400" />
                    <SelectValue placeholder="Tartiblash" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200">
                  <SelectItem value="date">Oxirgi qo'shilganlar</SelectItem>
                  <SelectItem value="name">Ism (A-Z)</SelectItem>
                  <SelectItem value="progress">Progress (Yuqori)</SelectItem>
                  <SelectItem value="calibration">Kalibrlash (Yuqori)</SelectItem>
                  <SelectItem value="reflection">Refleksiyalar soni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Faol filtrlar ko'rsatgichi */}
          {(selectedCourse !== "all" || statusFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Faol filtrlar:</span>
              {selectedCourse !== "all" && (
                <button
                  onClick={() => setSelectedCourse("all")}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1
                             bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                >
                  {courses.find(c => c.id === selectedCourse)?.title}
                  <X className="h-3 w-3" />
                </button>
              )}
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1
                             bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors"
                >
                  {getStatusLabel(statusFilter).label}
                  <X className="h-3 w-3" />
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1
                             bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
                >
                  "{searchQuery}"
                  <X className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedCourse("all");
                  setStatusFilter("all");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-medium ml-auto transition-colors"
              >
                Tozalash
              </button>
            </div>
          )}
        </Card>

        {/* Student List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <GraduationCap className="h-5 w-5 text-[#0056d2]" /> Talabalar ro'yxati
              </h2>
              <Badge className="bg-slate-100 text-slate-500 border-none font-semibold text-xs px-2 py-0.5 rounded">{sortedAndFiltered.length} Talaba</Badge>
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
                    <Card
                      key={e.id}
                      onClick={() => fetchStudentAnalytics(e)}
                      className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md
                                 bg-white p-5 cursor-pointer transition-all hover:border-slate-300"
                    >
                      <div className="flex items-start gap-4">
                
                        {/* Avatar */}
                        <Avatar className="h-12 w-12 border border-slate-100 flex-shrink-0">
                          <AvatarImage src={e.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">
                            {e.profiles?.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                
                        {/* Asosiy ma'lumot */}
                        <div className="flex-1 min-w-0">
                
                          {/* Ism + badge + holat */}
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="text-base font-semibold text-slate-800 truncate">
                              {e.profiles?.full_name || "Noma'lum"}
                            </h3>
                            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-md
                                             bg-slate-100 text-slate-500">
                              {e.courses?.title}
                            </span>
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md
                                             ${statusInfo.bg} ${statusInfo.text} ml-auto`}>
                              {statusInfo.label}
                            </span>
                          </div>
                
                          {/* Progress */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#185FA5] transition-all"
                                style={{ width: `${e.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-700 shrink-0">
                              {Math.round(e.progress)}%
                            </span>
                          </div>
                
                          {/* 3 ta metakognitiv ko'rsatkich */}
                          <div className="grid grid-cols-3 gap-2">
                
                            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                Testlar
                              </p>
                              <p className="text-sm font-bold text-slate-900 mt-0.5">
                                {meta.testCount > 0
                                  ? `${meta.correctCount}/${meta.testCount}`
                                  : "—"
                                }
                              </p>
                            </div>
                
                            <div className={`rounded-lg p-2.5 border ${
                              meta.calibrationScore >= 70
                                ? "bg-emerald-50 border-emerald-100"
                                : meta.calibrationScore >= 40
                                  ? "bg-amber-50 border-amber-100"
                                  : meta.calibrationScore > 0
                                    ? "bg-red-50 border-red-100"
                                    : "bg-slate-50 border-slate-100"
                            }`}>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                Kalibrlash
                              </p>
                              <p className={`text-sm font-bold mt-0.5 ${
                                meta.calibrationScore >= 70
                                  ? "text-emerald-700"
                                  : meta.calibrationScore >= 40
                                    ? "text-amber-700"
                                    : meta.calibrationScore > 0
                                      ? "text-red-700"
                                      : "text-slate-400"
                              }`}>
                                {meta.calibrationScore > 0 ? `${meta.calibrationScore}%` : "—"}
                              </p>
                            </div>
                
                            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                Refleksiya
                              </p>
                              <p className="text-sm font-bold text-slate-900 mt-0.5">
                                {meta.reflectionCount > 0 ? `${meta.reflectionCount} ta` : "—"}
                              </p>
                            </div>
                
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="py-24 text-center space-y-4 bg-white rounded-xl border border-slate-200">
                   <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400"><Users className="h-8 w-8" /></div>
                   <h3 className="text-lg font-bold text-slate-900">Talabalar topilmadi</h3>
                   <p className="text-slate-500 text-sm font-medium">Qidiruv parametrlarini o'zgartirib ko'ring.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Student Analytics Sidebar */}
      <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <SheetContent className="sm:max-w-md md:max-w-lg rounded-l-xl border-l border-slate-200 shadow-xl p-0 overflow-hidden bg-white flex flex-col">
           {selectedStudent && (
             <>
               {/* Sidebar Header */}
               <div className="bg-slate-50 border-b border-slate-200 p-8">
                  <div className="flex items-center gap-6">
                     <Avatar className="h-20 w-20 border border-slate-200 shadow-sm bg-white">
                        <AvatarImage src={selectedStudent.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-2xl font-bold">{selectedStudent.profiles?.full_name?.[0]}</AvatarFallback>
                     </Avatar>
                     <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedStudent.profiles?.full_name}</h2>
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                           <BookOpen className="h-3 w-3" /> {selectedStudent.courses?.title}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                     <Card className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                           <TrendingUp className="h-4 w-4 text-slate-400" />
                           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">O'zlashtirish</p>
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900">{Math.round(selectedStudent.progress)}%</h4>
                     </Card>
                     <Card className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                        <div className="flex items-center gap-2">
                           <ClipboardList className="h-4 w-4 text-slate-400" />
                           <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Testlar</p>
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900">{studentAnalytics.tests.length} ta</h4>
                     </Card>
                  </div>

                  {/* Chat Section */}
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#0056d2]" /> Xabarlar
                     </h3>
                     <Card className="rounded-lg bg-white border border-slate-200 shadow-sm flex flex-col h-[400px]">
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

                  {/* Reflections List */}
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Brain className="h-4 w-4 text-[#0056d2]" /> Metakognitiv mulohazalar
                     </h3>
                     <div className="space-y-3">
                        {studentAnalytics.reflections.length > 0 ? studentAnalytics.reflections.map((ref) => (
                          <Card key={ref.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                             <div className="flex items-center justify-between">
                                <Badge className="bg-slate-100 text-slate-600 border-none font-semibold text-[10px] uppercase tracking-wide">
                                   {ref.lessons?.title || "Dars"}
                                </Badge>
                                <div className="flex gap-1">
                                   {Array(5).fill(0).map((_, i) => <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < ref.rating ? 'bg-[#0056d2]' : 'bg-slate-200'}`} />)}
                                </div>
                             </div>
                             <p className="text-sm text-slate-700">
                                "{ref.reflection}"
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
