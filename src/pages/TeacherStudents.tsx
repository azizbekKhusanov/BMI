import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Users, GraduationCap, Filter, Mail, Calendar, 
  ArrowUpRight, TrendingUp, BookOpen, Activity, Clock,
  ClipboardList, Brain, MessageSquare, CheckCircle2, Sparkles,
  ChevronRight, ArrowRight, UserCheck, UserX, Star
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

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

const MOCK_CHART_DATA = [
  { name: 'Dush', value: 40 },
  { name: 'Sesh', value: 30 },
  { name: 'Chor', value: 65 },
  { name: 'Pay', value: 45 },
  { name: 'Jum', value: 80 },
  { name: 'Shan', value: 55 },
  { name: 'Yak', value: 90 },
];

const TeacherStudents = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "progress" | "date">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tests: (testRes.data as any[]) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reflections: (reflectionRes.data as any[]) || []
      });
      fetchMessages(student);
    } catch (error) {
       console.error(error);
    } finally {
      setIsAnalyticLoading(false);
    }
  };

  const sortedAndFiltered = enrollments
    .filter((e) => {
      const matchesCourse = selectedCourse === "all" || e.course_id === selectedCourse;
      const studentName = e.profiles?.full_name || "";
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCourse && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.profiles?.full_name || "").localeCompare(b.profiles?.full_name || "");
      if (sortBy === "progress") return b.progress - a.progress;
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
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-12 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Users className="h-7 w-7" />
                 </div>
                 <div>
                    <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 mb-1">Talabalar Monitoringi</Badge>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Akademiya A'zolari</h1>
                 </div>
              </div>
              <p className="text-slate-400 text-sm font-medium max-w-2xl italic leading-relaxed">
                 Talabalarning o'quv jarayonini kuzatib boring, tahliliy natijalarni ko'ring va muloqot orqali yordam bering.
              </p>
           </div>
           <Button onClick={fetchEnrollments} variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 shadow-sm font-black uppercase text-[10px] tracking-widest gap-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" /> Ma'lumotlarni Yangilash
           </Button>
        </div>

        {/* Global Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: "Jami Talabalar", value: enrollments.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50", progress: 100 },
             { label: "O'rtacha Progress", value: `${Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / (enrollments.length || 1))}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", progress: 75 },
             { label: "Hozir Faol", value: enrollments.filter(e => e.progress > 0).length, icon: Star, color: "text-amber-500", bg: "bg-amber-50", progress: 45 },
           ].map((s, i) => (
             <Card key={i} className="premium-card border-none overflow-hidden group">
                <CardContent className="p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className={`h-14 w-14 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                         <s.icon className="h-7 w-7" />
                      </div>
                      <div className="h-10 w-24">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_CHART_DATA}>
                               <Area type="monotone" dataKey="value" stroke="currentColor" fill="currentColor" fillOpacity={0.1} />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                   <div>
                      <p className="text-3xl font-black text-slate-900 leading-none">{s.value}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{s.label}</p>
                   </div>
                   <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden"><div className={`h-full ${s.bg.replace('bg-', 'bg-').split(' ')[0]} ${s.color.replace('text-', 'bg-')}`} style={{ width: `${s.progress}%` }} /></div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Filters and Search */}
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-4 flex flex-col lg:flex-row items-center gap-6">
           <div className="flex-1 relative w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Talaba ismini kiriting..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-16 pl-16 rounded-2xl border-none bg-slate-50/50 text-base font-bold focus-visible:ring-primary/10 transition-all"
              />
           </div>
           <div className="flex gap-4 w-full lg:w-auto">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                 <SelectTrigger className="h-16 px-8 rounded-2xl border-none bg-slate-50 text-[10px] font-black uppercase tracking-widest min-w-[220px]">
                    <div className="flex items-center gap-3"><Filter className="h-4 w-4 text-primary" /><SelectValue placeholder="Barcha Kurslar" /></div>
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="all">Barcha Kurslar</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                 </SelectContent>
              </Select>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                 <SelectTrigger className="h-16 px-8 rounded-2xl border-none bg-slate-50 text-[10px] font-black uppercase tracking-widest min-w-[200px]">
                    <div className="flex items-center gap-3"><TrendingUp className="h-4 w-4 text-primary" /><SelectValue placeholder="Tartiblash" /></div>
                 </SelectTrigger>
                 <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="date">Oxirgi qo'shilganlar</SelectItem>
                    <SelectItem value="name">Ism (A-Z)</SelectItem>
                    <SelectItem value="progress">Progress (Yuqori)</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </Card>

        {/* Student List */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-6">
              <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
                 <GraduationCap className="h-6 w-6 text-primary" /> Talabalar Ro'yxati
              </h2>
              <Badge className="bg-slate-900 text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">{sortedAndFiltered.length} Talaba</Badge>
           </div>

           <div className="grid gap-6">
              {loading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-[2.5rem]" />)
              ) : currentItems.length > 0 ? (
                currentItems.map((e) => (
                  <motion.div key={e.id} whileHover={{ scale: 1.01 }} className="group">
                    <Card 
                      onClick={() => fetchStudentAnalytics(e)}
                      className="rounded-[3rem] border-none shadow-sm hover:shadow-2xl hover:shadow-primary/5 bg-white p-6 cursor-pointer transition-all duration-500 overflow-hidden relative"
                    >
                       <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="flex flex-col md:flex-row items-center gap-8 px-4">
                          <div className="relative">
                             <Avatar className="h-16 w-16 lg:h-20 lg:w-20 border-[5px] border-white ring-2 ring-slate-50 shadow-xl">
                                <AvatarImage src={e.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary text-white font-black text-xl">{e.profiles?.full_name?.[0]}</AvatarFallback>
                             </Avatar>
                             <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-emerald-500 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                                <UserCheck className="h-3 w-3 text-white" />
                             </div>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                             <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none group-hover:text-primary transition-colors">{e.profiles?.full_name || "Noma'lum Talaba"}</h3>
                                <Badge className="bg-primary/5 text-primary border-none font-bold text-[9px] uppercase tracking-widest px-3 py-0.5 rounded-lg">{e.courses?.title}</Badge>
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 italic">
                                <Clock className="h-3 w-3" /> Qo'shildi: {new Date(e.created_at).toLocaleDateString()}
                             </p>
                          </div>

                          <div className="w-full md:w-64 space-y-3">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">O'zlashtirish</span>
                                <span className="text-sm font-black text-slate-900">{Math.round(e.progress)}%</span>
                             </div>
                             <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${e.progress}%` }} />
                             </div>
                          </div>

                          <div className="flex items-center gap-3">
                             <Button variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-primary/5 text-slate-400 hover:text-primary transition-all">
                                <MessageSquare className="h-6 w-6" />
                             </Button>
                             <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                                <ChevronRight className="h-6 w-6" />
                             </div>
                          </div>
                       </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="py-32 text-center space-y-6">
                   <div className="h-24 w-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto opacity-50"><Users className="h-10 w-10 text-slate-400" /></div>
                   <h3 className="text-2xl font-black text-slate-900 uppercase italic">Talabalar topilmadi</h3>
                   <p className="text-slate-400 text-sm font-medium italic">Qidiruv parametrlarini o'zgartirib ko'ring.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Student Analytics Sidebar */}
      <Sheet open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl rounded-l-[4rem] border-none shadow-2xl p-0 overflow-hidden bg-slate-50/50 flex flex-col">
           {selectedStudent && (
             <>
               {/* Sidebar Header */}
               <div className="bg-slate-900 p-10 lg:p-14 text-white relative">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary opacity-20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
                  <div className="flex items-center gap-8 relative z-10">
                     <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-[6px] border-white/10 shadow-2xl">
                        <AvatarImage src={selectedStudent.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-white text-3xl font-black">{selectedStudent.profiles?.full_name?.[0]}</AvatarFallback>
                     </Avatar>
                     <div className="space-y-3">
                        <Badge className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">Talaba Tahlili</Badge>
                        <h2 className="text-3xl lg:text-4xl font-black uppercase italic tracking-tight">{selectedStudent.profiles?.full_name}</h2>
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                           <BookOpen className="h-4 w-4" /> {selectedStudent.courses?.title}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-10 lg:p-14 space-y-12 custom-scrollbar">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-6">
                     <Card className="rounded-[2.5rem] bg-white border-none p-8 space-y-4 shadow-xl shadow-slate-200/50">
                        <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center"><TrendingUp className="h-6 w-6" /></div>
                        <div>
                           <h4 className="text-3xl font-black text-slate-900 leading-none">{Math.round(selectedStudent.progress)}%</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">O'zlashtirish</p>
                        </div>
                     </Card>
                     <Card className="rounded-[2.5rem] bg-white border-none p-8 space-y-4 shadow-xl shadow-slate-200/50">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><ClipboardList className="h-6 w-6" /></div>
                        <div>
                           <h4 className="text-3xl font-black text-slate-900 leading-none">{studentAnalytics.tests.length} ta</h4>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Test natijalari</p>
                        </div>
                     </Card>
                  </div>

                  {/* Chat Section */}
                  <div className="space-y-6">
                     <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-primary" /> Muloqot Markazi
                     </h3>
                     <Card className="rounded-[3rem] bg-white border-none shadow-2xl overflow-hidden flex flex-col h-[500px]">
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
                           {messages.length > 0 ? messages.map((msg) => (
                             <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-6 rounded-3xl text-sm font-medium shadow-sm leading-relaxed ${
                                  msg.sender_id === user?.id 
                                    ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/10' 
                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-50'
                                }`}>
                                   {msg.content}
                                   <div className={`text-[9px] font-black uppercase mt-3 opacity-50 ${msg.sender_id === user?.id ? 'text-white' : 'text-slate-400'}`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                </div>
                             </div>
                           )) : (
                             <div className="h-full flex flex-col items-center justify-center text-center opacity-40 italic space-y-4">
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center"><MessageSquare className="h-8 w-8" /></div>
                                <p className="text-sm font-bold uppercase tracking-widest">Hozircha xabarlar yo'q</p>
                             </div>
                           )}
                        </div>
                        <div className="p-6 bg-white border-t border-slate-50 flex gap-4">
                           <Input 
                             placeholder="Xabaringizni yozing..." 
                             className="h-16 rounded-2xl border-none bg-slate-50 px-8 text-base font-medium focus-visible:ring-primary/10"
                             value={newMessage}
                             onChange={(e) => setNewMessage(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                           />
                           <Button 
                             onClick={sendMessage}
                             disabled={isSending || !newMessage.trim()}
                             className="h-16 w-16 rounded-2xl bg-slate-900 text-white shadow-xl hover:scale-105 transition-all"
                           >
                              <ArrowRight className="h-6 w-6" />
                           </Button>
                        </div>
                     </Card>
                  </div>

                  {/* Reflections List */}
                  <div className="space-y-6">
                     <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-3">
                        <Brain className="h-5 w-5 text-primary" /> Metakognitiv Mulohazalar
                     </h3>
                     <div className="space-y-4">
                        {studentAnalytics.reflections.length > 0 ? studentAnalytics.reflections.map((ref) => (
                          <Card key={ref.id} className="rounded-[2.5rem] border-none bg-white p-8 space-y-4 shadow-sm group hover:shadow-xl transition-all">
                             <div className="flex items-center justify-between">
                                <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                                   {ref.lessons?.title || "Dars"}
                                </Badge>
                                <div className="flex gap-1">
                                   {Array(5).fill(0).map((_, i) => <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < ref.rating ? 'bg-primary' : 'bg-slate-100'}`} />)}
                                </div>
                             </div>
                             <p className="text-sm font-medium text-slate-600 leading-relaxed italic italic group-hover:text-slate-900 transition-colors">
                                "{ref.reflection}"
                             </p>
                          </Card>
                        )) : (
                          <div className="py-12 text-center bg-slate-100/50 rounded-[3rem] italic text-slate-400 font-bold text-sm uppercase tracking-widest">
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
    </Layout>
  );
};

export default TeacherStudents;
