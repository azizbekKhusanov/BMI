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
  ClipboardList, Brain, MessageSquare, ArrowRight, UserCheck, Star
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
    <>
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0056d2]">
                    <Users className="h-5 w-5" />
                 </div>
                 <h1 className="text-2xl font-bold text-slate-900 leading-tight">Talabalar Ro'yxati</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Jami Talabalar", value: enrollments.length, icon: Users, color: "text-[#0056d2]", bg: "bg-blue-50" },
             { label: "O'rtacha Progress", value: `${Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / (enrollments.length || 1))}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
             { label: "Progress boshlagan", value: enrollments.filter(e => e.progress > 0).length, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
           ].map((s, i) => (
             <Card key={i} className="rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                      <div className={`h-12 w-12 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                         <s.icon className="h-6 w-6" />
                      </div>
                   </div>
                   <div>
                      <p className="text-3xl font-bold text-slate-900 leading-none">{s.value}</p>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-2">{s.label}</p>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Filters and Search */}
        <Card className="rounded-xl border border-slate-200 shadow-sm bg-white p-4 flex flex-col lg:flex-row items-center gap-4">
           <div className="flex-1 relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0056d2]" />
              <Input 
                placeholder="Talaba ismini kiriting..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 rounded-lg border-slate-200 font-medium text-sm w-full focus-visible:ring-[#0056d2]"
              />
           </div>
           <div className="flex gap-3 w-full lg:w-auto">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                 <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-xs font-medium min-w-[180px]">
                    <div className="flex items-center gap-2"><Filter className="h-3 w-3 text-slate-400" /><SelectValue placeholder="Barcha Kurslar" /></div>
                 </SelectTrigger>
                 <SelectContent className="rounded-lg border-slate-200">
                    <SelectItem value="all">Barcha Kurslar</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                 </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                 <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white text-xs font-medium min-w-[160px]">
                    <div className="flex items-center gap-2"><TrendingUp className="h-3 w-3 text-slate-400" /><SelectValue placeholder="Tartiblash" /></div>
                 </SelectTrigger>
                 <SelectContent className="rounded-lg border-slate-200">
                    <SelectItem value="date">Oxirgi qo'shilganlar</SelectItem>
                    <SelectItem value="name">Ism (A-Z)</SelectItem>
                    <SelectItem value="progress">Progress (Yuqori)</SelectItem>
                 </SelectContent>
              </Select>
           </div>
        </Card>

        {/* Student List */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <GraduationCap className="h-5 w-5 text-[#0056d2]" /> Talabalar Ro'yxati
              </h2>
              <Badge className="bg-slate-100 text-slate-500 border-none font-semibold text-xs px-2 py-0.5 rounded">{sortedAndFiltered.length} Talaba</Badge>
           </div>

           <div className="grid gap-4">
              {loading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
              ) : currentItems.length > 0 ? (
                currentItems.map((e) => (
                    <Card 
                      key={e.id}
                      onClick={() => fetchStudentAnalytics(e)}
                      className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md bg-white p-4 cursor-pointer transition-shadow"
                    >
                       <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="relative">
                             <Avatar className="h-14 w-14 border border-slate-100">
                                <AvatarImage src={e.profiles?.avatar_url || undefined} />
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">{e.profiles?.full_name?.[0]}</AvatarFallback>
                             </Avatar>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-1 text-center md:text-left">
                             <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900 truncate">{e.profiles?.full_name || "Noma'lum Talaba"}</h3>
                                <Badge className="bg-slate-100 text-slate-600 border-none font-semibold text-[10px] uppercase tracking-wide w-fit mx-auto md:mx-0">{e.courses?.title}</Badge>
                             </div>
                             <p className="text-xs font-medium text-slate-500 flex items-center justify-center md:justify-start gap-1">
                                <Clock className="h-3 w-3" /> Qo'shildi: {new Date(e.created_at).toLocaleDateString()}
                             </p>
                          </div>

                          <div className="w-full md:w-48 space-y-2">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">O'zlashtirish</span>
                                <span className="text-sm font-bold text-slate-900">{Math.round(e.progress)}%</span>
                             </div>
                             <Progress value={e.progress} className="h-2 rounded-full bg-slate-100" />
                          </div>

                          <div className="flex items-center gap-2 justify-center mt-2 md:mt-0">
                             <Button variant="ghost" className="h-10 w-10 p-0 rounded-lg text-slate-400 hover:text-[#0056d2] hover:bg-blue-50">
                                <MessageSquare className="h-5 w-5" />
                             </Button>
                          </div>
                       </div>
                    </Card>
                ))
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
                        <Brain className="h-4 w-4 text-[#0056d2]" /> Metakognitiv Mulohazalar
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
