import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Users, GraduationCap, Filter, Mail, Calendar, 
  ArrowUpRight, TrendingUp, BookOpen, Activity, Clock,
  ClipboardList, Brain, MessageSquare, CheckCircle2, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip 
} from "recharts";

const MOCK_CHART_DATA = [
  { name: 'Dushanba', value: 40 },
  { name: 'Seshanba', value: 30 },
  { name: 'Chorshanba', value: 65 },
  { name: 'Payshanba', value: 45 },
  { name: 'Juma', value: 80 },
  { name: 'Shanba', value: 55 },
  { name: 'Yakshanba', value: 90 },
];

const TeacherStudents = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Sorting & Pagination states
  const [sortBy, setSortBy] = useState<"name" | "progress" | "date">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Student analytics & messaging states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<{ 
    tests: any[], 
    reflections: any[] 
  }>({ tests: [], reflections: [] });
  const [isAnalyticLoading, setIsAnalyticLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchEnrollments();
    }
  }, [user]);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("id, title").eq("teacher_id", user?.id);
    setCourses(data || []);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. O'qituvchiga tegishli kurslarni olish (agar hali yo'q bo'lsa)
      const { data: myCourses } = await supabase.from("courses").select("id, title").eq("teacher_id", user.id);
      const courseIds = (myCourses || []).map(c => c.id);

      if (courseIds.length === 0) {
        setEnrollments([]);
        setLoading(false);
        return;
      }

      // 2. Enrollments ni olish (join siz)
      const { data: enrollmentsData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (enrollError) throw enrollError;

      const safeEnrollments = enrollmentsData || [];

      // 3. Profillarni alohida olish
      const userIds = [...new Set(safeEnrollments.map(e => e.user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", userIds);
        
        const enriched = safeEnrollments.map(e => ({
          ...e,
          profiles: (profilesData || []).find(p => p.user_id === e.user_id),
          courses: (myCourses || []).find(c => c.id === e.course_id)
        }));
        setEnrollments(enriched);
      } else {
        setEnrollments([]);
      }
    } catch (error) {
      console.error("Students list error:", error);
      toast.error("O'quvchilar ro'yxatini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAnalytics = async (student: any) => {
    setSelectedStudent(student);
    setIsAnalyticLoading(true);
    try {
      // 1. Test natijalarini olish
      const { data: testResultsData } = await supabase
        .from("test_results")
        .select(`
          *,
          tests (
            question,
            lesson_id,
            lessons (title)
          )
        `)
        .eq("user_id", student.user_id);

      // 2. Refleksiya (Self-assessment) natijalarini olish
      const { data: reflectionData } = await supabase
        .from("self_assessments")
        .select(`
          *,
          lessons (title)
        `)
        .eq("user_id", student.user_id);

      setStudentAnalytics({
        tests: testResultsData || [],
        reflections: reflectionData || []
      });

      // 3. Xabarlarni yuklash
      fetchMessages(student);
    } catch (error) {
       console.error("Analytics fetch error:", error);
    } finally {
      setIsAnalyticLoading(false);
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (progress >= 50) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-emerald-500 shadow-emerald-200";
    if (progress >= 50) return "bg-amber-500 shadow-amber-200";
    return "bg-rose-500 shadow-rose-200";
  };

  // Filter, Sort and Paginate
  const sortedAndFiltered = enrollments
    .filter((e) => {
      const matchesCourse = selectedCourse === "all" || e.course_id === selectedCourse;
      const studentName = e.profiles?.full_name || "Noma'lum Talaba";
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCourse && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.profiles?.full_name || "").localeCompare(b.profiles?.full_name || "");
      if (sortBy === "progress") return b.progress - a.progress;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const totalPages = Math.ceil(sortedAndFiltered.length / itemsPerPage);
  const currentItems = sortedAndFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchMessages = async (student: any) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
      .or(`sender_id.eq.${student.user_id},recipient_id.eq.${student.user_id}`)
      .order("created_at", { ascending: true });
    
    setMessages(data || []);
  };

  useEffect(() => {
    if (!user || !selectedStudent) return;

    // Realtime subscription (Messages)
    const channel = supabase
      .channel('teacher-students-messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_id === user.id && msg.recipient_id === selectedStudent.user_id) ||
            (msg.sender_id === selectedStudent.user_id && msg.recipient_id === user.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStudent, user]);

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
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setIsSending(false);
    }
  };

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesCourse = selectedCourse === "all" || e.course_id === selectedCourse;
    const studentName = e.profiles?.full_name || "Noma'lum Talaba";
    const courseTitle = e.courses?.title || "Kurs";
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

  const totalStudentsCount = new Set(enrollments.map(e => e.user_id)).size;
  const avgOverallProgress = enrollments.length > 0 
    ? Math.round(enrollments.reduce((sum, e) => sum + (Number(e.progress) || 0), 0) / enrollments.length) 
    : 0;

  return (
    <Layout>
      <div className="container py-4 space-y-6 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black font-serif tracking-tight flex items-center gap-3 text-slate-800 uppercase">
              <Users className="h-8 w-8 text-indigo-600" /> Talabalar nazorati
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] opacity-70">O'quvchilar faolligi va tahliliy natijalari boshqaruv paneli</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="rounded-xl h-10 px-4 border-2 hover:bg-slate-50 font-black text-[9px] uppercase tracking-widest transition-all gap-2" 
              onClick={fetchEnrollments}
            >
              <Activity className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> 
              Yangilash
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="p-5 flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-[1.2rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jami talabalar</p>
                    <p className="text-2xl font-black mt-0.5 text-slate-800 leading-none">{totalStudentsCount}</p>
                 </div>
               </div>
               <div className="h-12 w-24 opacity-40 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={MOCK_CHART_DATA}>
                        <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="h-0.5 w-full bg-indigo-500/10"><div className="h-full bg-indigo-500 w-2/3" /></div>
          </Card>
          
          <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="p-5 flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className={`h-12 w-12 rounded-[1.2rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${avgOverallProgress >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Activity className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">O'rtacha progress</p>
                    <p className={`text-2xl font-black mt-0.5 leading-none ${avgOverallProgress >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{avgOverallProgress}%</p>
                 </div>
               </div>
               <div className="h-12 w-24 opacity-40 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={MOCK_CHART_DATA}>
                        <Area type="monotone" dataKey="value" stroke={avgOverallProgress >= 70 ? "#10b981" : "#f59e0b"} fill={avgOverallProgress >= 70 ? "#10b981" : "#f59e0b"} fillOpacity={0.1} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="h-0.5 w-full bg-emerald-500/10"><div className={`h-full ${avgOverallProgress >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${avgOverallProgress}%` }} /></div>
          </Card>

          <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="p-5 flex items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-[1.2rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faol talabalar</p>
                    <p className="text-2xl font-black mt-0.5 text-blue-600 leading-none">{enrollments.filter(e => e.progress > 0).length}</p>
                 </div>
               </div>
               <div className="h-12 w-24 opacity-40 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={MOCK_CHART_DATA}>
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
            <div className="h-0.5 w-full bg-blue-500/10"><div className="h-full bg-blue-500 w-1/2" /></div>
          </Card>
        </div>

        {/* Alerts & Critical Info */}
        {enrollments.filter(e => e.progress === 0).length > 0 && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-left duration-500 shadow-sm">
             <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
             </div>
             <div>
                <p className="text-sm font-black text-rose-900 uppercase tracking-tight">Diqqat: Faol bo'lmagan talabalar</p>
                <p className="text-[11px] font-bold text-rose-700 opacity-80 uppercase tracking-widest leading-none mt-1">
                   {enrollments.filter(e => e.progress === 0).length} ta talaba kursni hali boshlamagan. Ularga xabar yuborishingizni tavsiya qilamiz.
                </p>
             </div>
          </div>
        )}

        {/* Filter & Sort Bar */}
        <Card className="border-none shadow-2xl bg-white rounded-[2rem] p-3 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <Input 
              placeholder="Talaba ismini kiriting..." 
              className="pl-12 rounded-xl h-12 bg-slate-50 border-none text-sm font-medium focus-visible:ring-indigo-600 shadow-inner transition-all focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 text-[10px] font-black uppercase tracking-widest shadow-inner px-5 text-slate-500 min-w-[180px]">
                <div className="flex items-center gap-3">
                  <Filter className="h-3.5 w-3.5 text-indigo-600" />
                  <SelectValue placeholder="Kurslar" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="all">Barcha Kurslar</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="rounded-xl h-12 border-none bg-slate-50 text-[10px] font-black uppercase tracking-widest shadow-inner px-5 text-slate-500 min-w-[180px]">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                  <SelectValue placeholder="Tartiblash" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                <SelectItem value="name">Alifbo bo'yicha (A-Z)</SelectItem>
                <SelectItem value="progress">Progress bo'yicha</SelectItem>
                <SelectItem value="date">Sana bo'yicha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Students List Container */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
             <h2 className="text-2xl font-bold font-serif flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-indigo-500" /> Ro'yxat
                <Badge variant="secondary" className="rounded-full h-6 bg-indigo-50 text-indigo-600 px-3 border-indigo-200">
                   {filteredEnrollments.length} ta natija
                </Badge>
             </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
               {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />)}
            </div>
          ) : filteredEnrollments.length > 0 ? (
            <>
              <div className="grid gap-4">
                 {currentItems.map((e) => (
                  <Card key={e.id} className="group border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all duration-500 border-l-[8px] border-l-indigo-500/30 hover:border-l-indigo-600">
                    <CardContent className="p-4 px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      
                      <div 
                         onClick={() => fetchStudentAnalytics(e)}
                         className="flex items-center gap-5 min-w-0 cursor-pointer group/profile"
                      >
                         <div className="relative">
                            <div className={`absolute -inset-1 rounded-full blur-md opacity-20 group-hover/profile:opacity-40 transition-opacity ${e.progress >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                            <Avatar className="h-14 w-14 border-4 border-white shadow-xl relative z-10">
                               <AvatarImage src={e.profiles?.avatar_url} />
                               <AvatarFallback className="bg-slate-50 text-indigo-600 text-base font-black uppercase leading-none">{e.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-white shadow-sm z-20 ${e.progress > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                               {e.progress > 0 ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-black text-slate-800 uppercase leading-none group-hover/profile:text-indigo-600 transition-colors tracking-tight">{e.profiles?.full_name || "Noma'lum"}</h4>
                              <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest border-none ${getStatusColor(e.progress)}`}>
                                 {e.progress >= 5 ? 'Active' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-full">
                                  <BookOpen className="h-3 w-3 text-indigo-400" /> {e.courses?.title}
                               </span>
                               <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1.5 opacity-60">
                                  <Clock className="h-3 w-3" /> Faollik: 2 soat avval
                               </span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex-1 max-w-xs w-full space-y-2">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">O'zlashtirish</span>
                            <span className={`text-[12px] font-black ${getStatusColor(e.progress).split(' ')[0]}`}>{Math.round(e.progress)}%</span>
                         </div>
                         <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner flex">
                            <div 
                               className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getProgressColor(e.progress)}`}
                               style={{ width: `${e.progress}%` }} 
                            />
                         </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button 
                                 onClick={() => fetchStudentAnalytics(e)}
                                 className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-11 w-11 p-0 text-white shadow-xl shadow-indigo-100 transition-all hover:scale-110 active:scale-95"
                               >
                                  <MessageSquare className="h-5 w-5" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent className="rounded-xl font-black uppercase text-[9px] tracking-widest bg-slate-800 text-white border-none py-2 px-4 shadow-2xl">Xabar yuborish</TooltipContent>
                           </Tooltip>

                           <Tooltip>
                             <TooltipTrigger asChild>
                               <Button 
                                 onClick={() => fetchStudentAnalytics(e)}
                                 className="rounded-2xl bg-slate-50 hover:bg-slate-100 h-11 w-11 p-0 text-slate-400 border-none transition-all hover:scale-110 active:scale-95 group/btn"
                               >
                                  <TrendingUp className="h-5 w-5 group-hover/btn:text-indigo-600 transition-colors" />
                               </Button>
                             </TooltipTrigger>
                             <TooltipContent className="rounded-xl font-black uppercase text-[9px] tracking-widest bg-slate-800 text-white border-none py-2 px-4 shadow-2xl">Batafsil tahlil</TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination UI */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Button 
                    variant="outline" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="rounded-xl font-black uppercase text-[9px] tracking-tighter"
                  >O'tgan</Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button 
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"}
                      className={`h-9 w-9 rounded-xl font-black ${currentPage === i + 1 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="rounded-xl font-black uppercase text-[9px] tracking-tighter"
                  >Keyingi</Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-32 bg-slate-50/30 border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center animate-in zoom-in-95 duration-1000 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <div className="h-32 w-32 rounded-full bg-white shadow-2xl flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-700">
                  <div className="h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Users className="h-12 w-12 text-indigo-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
               </div>
               <h3 className="text-4xl font-serif font-black text-slate-800 tracking-tighter uppercase relative z-10">O'quvchilar topilmadi</h3>
               <p className="text-slate-400 mt-4 max-w-sm text-sm font-bold uppercase tracking-[0.2em] leading-relaxed relative z-10 opacity-70">
                 Kurslaringizda hali talabalar yo'q yoki qidiruv natijasi bo'sh. Mazkur bo'limda talabalar tahlili ko'rinadi.
               </p>
               <Button 
                variant="outline" 
                className="mt-10 rounded-2xl h-12 px-8 border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-widest relative z-10"
                onClick={fetchEnrollments}
               >
                 Ro'yxatni yangilash
               </Button>
            </div>
          )}
        </div>
      </div>

      {/* Talaba Tahlili Yon Paneli */}
      <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <SheetContent className="sm:max-w-md md:max-w-lg rounded-l-[3.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col">
          {selectedStudent && (
            <>
              <div className="bg-indigo-600 p-8 text-white relative">
                <div className="flex items-center gap-4 relative z-10">
                  <Avatar className="h-16 w-16 border-4 border-white/20 shadow-2xl">
                     <AvatarImage src={selectedStudent.profiles?.avatar_url} />
                     <AvatarFallback className="bg-white/10 text-white text-xl font-black">{selectedStudent.profiles?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-normal leading-none">{selectedStudent.profiles?.full_name}</h2>
                    <p className="text-indigo-100 opacity-60 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                       <GraduationCap className="h-3 w-3" /> Talaba tahliliy hisoboti
                    </p>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-slate-50/30">
                {isAnalyticLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                    <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                    <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                  </div>
                ) : (
                  <>
                    {/* Analytics Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-5 rounded-[2.5rem] border-none bg-emerald-500 text-white shadow-xl shadow-emerald-100 flex flex-col justify-between h-32">
                        <Activity className="h-6 w-6 opacity-30" />
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Progress</div>
                          <div className="text-3xl font-black">{Math.round(selectedStudent.progress)}%</div>
                        </div>
                      </Card>
                      <Card className="p-5 rounded-[2.5rem] border-none bg-indigo-600 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between h-32">
                        <ClipboardList className="h-6 w-6 opacity-30" />
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Testlar</div>
                          <div className="text-3xl font-black">{studentAnalytics.tests.length} ta</div>
                        </div>
                      </Card>
                    </div>

                    {/* Muloqot (Chat) Section */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                        <MessageSquare className="h-3.5 w-3.5" /> Muloqot va Fikrlar
                      </h3>
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[400px] max-h-[500px]">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                          {messages.length > 0 ? messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                                msg.sender_id === user?.id 
                                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-white text-slate-800 rounded-tl-none border'
                              }`}>
                                {msg.content}
                                <div className={`text-[9px] mt-1 opacity-50 ${msg.sender_id === user?.id ? 'text-white' : 'text-slate-400'}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                              <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-600">
                                <MessageSquare className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest leading-loose">Hali muloqot boshlanmagan.</p>
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-white border-t flex gap-2">
                          <Input 
                            placeholder="Xabar yozing..." 
                            className="rounded-xl border-none bg-slate-100 focus-visible:ring-indigo-600"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          />
                          <Button 
                            onClick={sendMessage}
                            disabled={isSending || !newMessage.trim()}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 shadow-lg shadow-indigo-100"
                          >
                            <TrendingUp className="h-5 w-5 transform rotate-90" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Metakognitiv Refleksiya List */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Brain className="h-3.5 w-3.5" /> Talaba Mullohazalari
                      </h3>
                      {studentAnalytics.reflections.length > 0 ? studentAnalytics.reflections.map((ref: any) => (
                        <div key={ref.id} className="p-6 rounded-[2rem] bg-white border border-slate-100 space-y-4 relative overflow-hidden shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center justify-between relative z-10">
                            <p className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{ref.lessons?.title || 'Dars'}</p>
                            <div className="flex items-center gap-1">
                              {Array(5).fill(0).map((_, i) => (
                                <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < ref.rating ? 'bg-indigo-500' : 'bg-indigo-100'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-600 leading-relaxed italic relative z-10">
                            "{ref.reflection}"
                          </p>
                        </div>
                      )) : (
                        <div className="py-10 text-center bg-muted/20 rounded-[2.5rem] italic text-slate-400 font-bold text-sm">Refleksiya mavjud emas.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default TeacherStudents;
