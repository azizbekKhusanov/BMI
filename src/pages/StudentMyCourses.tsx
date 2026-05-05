import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Clock, ArrowRight, Search, 
  CheckCircle2, Archive, LayoutGrid, List,
  PlayCircle, MoreVertical, Sparkles, FolderArchive, RotateCcw
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  image_url?: string;
  teacher_id: string;
  profiles?: {
    full_name: string;
  };
}

interface Enrollment {
  id: string;
  course_id: string;
  progress: number;
  last_accessed: string;
  courses: Course;
}

const StudentMyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"faol" | "tamomlangan" | "arxiv">("faol");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  // Load archived courses from local storage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`archived_courses_${user.id}`);
      if (stored) {
        try {
          setArchivedIds(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user]);

  const toggleArchive = (courseId: string) => {
    if (!user) return;
    setArchivedIds(prev => {
      const newArchived = prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId];
      localStorage.setItem(`archived_courses_${user.id}`, JSON.stringify(newArchived));
      return newArchived;
    });
  };

  const { data: enrollments = [], isLoading: loading } = useQuery({
    queryKey: ['my-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: enrollData, error: enrollError } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", user.id);

      if (enrollError) throw enrollError;
      
      if (enrollData && enrollData.length > 0) {
        const courseIds = enrollData.map(e => e.course_id);
        
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .in("id", courseIds);
          
        if (coursesError) throw coursesError;

        let profilesData: any[] = [];
        if (coursesData && coursesData.length > 0) {
          const teacherIds = [...new Set(coursesData.map(c => c.teacher_id).filter(Boolean))];
          if (teacherIds.length > 0) {
            const { data: pData } = await supabase.from("profiles").select("user_id, full_name").in("user_id", teacherIds);
            if (pData) profilesData = pData;
          }
        }

        const completeEnrollments = enrollData.map(e => {
          const course = coursesData?.find(c => c.id === e.course_id);
          if (course) {
            const teacherProfile = profilesData.find(p => p.user_id === course.teacher_id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (course as any).profiles = { full_name: teacherProfile?.full_name || "O'qituvchi" };
          }
          return {
            ...e,
            courses: course || {}
          };
        });

        return completeEnrollments as unknown as Enrollment[];
      }
      return [];
    },
    enabled: !!user,
  });

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const titleMatch = (enrollment.courses?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const isArchived = archivedIds.includes(enrollment.course_id);
    
    let matchesTab = true;
    if (activeTab === "faol") {
      matchesTab = enrollment.progress < 100 && !isArchived;
    } else if (activeTab === "tamomlangan") {
      matchesTab = enrollment.progress >= 100 && !isArchived;
    } else if (activeTab === "arxiv") {
      matchesTab = isArchived;
    }

    return titleMatch && matchesTab;
  });

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 mt-2 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">Mening kurslarim</h1>
          <p className="text-slate-500 font-medium">Jami {enrollments.length} ta kursda o'qiyapsiz. O'qishda davom eting!</p>
        </div>
        
        {enrollments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/student/courses/${enrollments[0].course_id}`)}
            className="flex items-center gap-4 bg-blue-50/80 border border-blue-100 rounded-2xl px-5 py-3 cursor-pointer hover:bg-blue-100/50 transition-all shadow-sm group border-l-4 border-l-[#0056d2]"
          >
            <div className="h-10 w-10 rounded-xl bg-[#0056d2] text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 pr-2">
              <div className="text-[10px] font-black text-[#0056d2] uppercase tracking-[0.2em] mb-0.5">AI Tavsiyasi</div>
              <div className="text-sm font-bold text-slate-700 leading-tight">
                "{enrollments[0]?.courses?.title}" bo'yicha darsni davom ettiring
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#0056d2] shrink-0 group-hover:translate-x-1 transition-transform" />
          </motion.div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-0">
        <div className="flex items-center gap-8">
          {[
            { id: "faol", label: "Faol kurslar", icon: PlayCircle },
            { id: "tamomlangan", label: "Tamomlangan", icon: CheckCircle2 },
            { id: "arxiv", label: "Arxivlangan", icon: Archive }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 -mb-[2px] border-b-2 font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-[#0056d2] text-[#0056d2]" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 pb-4 sm:pb-0">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Kurslarim ichidan qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-[#0056d2] focus:bg-white transition-all font-medium"
            />
          </div>
          <div className="flex items-center bg-slate-100/50 rounded-lg p-1 border border-slate-100">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-white text-[#0056d2] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-white text-[#0056d2] shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`grid gap-8 mb-12 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`rounded-xl ${viewMode === "grid" ? "h-96 w-full" : "h-32 w-full"}`} />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-slate-100 shadow-sm mb-12 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
            <BookOpen className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Hozircha kurslar yo'q</h3>
          <p className="text-slate-500 mb-8 max-w-sm">Hali birorta kursga yozilmabsiz. Kurslar katalogidan o'zingizga ma'qulini toping.</p>
          <Link to="/student/courses">
            <Button className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-md px-10 h-12 font-bold transition-all shadow-md shadow-blue-100">
              Katalogni ochish
            </Button>
          </Link>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-slate-100 shadow-sm mb-12 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
            <Search className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Hech narsa topilmadi</h3>
          <p className="text-slate-500">Qidiruv natijasida kurslar topilmadi. Boshqa so'z bilan urinib ko'ring.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`grid gap-8 mb-12 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
          >
            {filteredEnrollments.map((enrollment) => (
              <motion.div
                key={enrollment.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {viewMode === "grid" ? (
                  <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group flex flex-col bg-white h-full">
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {enrollment.courses?.image_url ? (
                        <img src={enrollment.courses.image_url} alt={enrollment.courses.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 opacity-40 group-hover:scale-105 transition-transform duration-700" />
                      )}
                      <Badge className="absolute top-3 left-3 bg-[#0056d2] text-white border-none font-bold rounded-md px-3 py-1 shadow-sm">
                        {enrollment.courses?.category || "Fan"}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-6 flex-1 flex flex-col bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-slate-900 line-clamp-2 pr-4 tracking-tight leading-snug group-hover:text-[#0056d2] transition-colors">
                          {enrollment.courses?.title || "Nomsiz Kurs"}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-300 hover:text-slate-600 focus:outline-none">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg">
                            <DropdownMenuItem onClick={() => toggleArchive(enrollment.course_id)} className="cursor-pointer font-bold text-slate-700">
                              {archivedIds.includes(enrollment.course_id) ? (
                                <><RotateCcw className="mr-2 h-4 w-4 text-blue-500" /> Arxivdan chiqarish</>
                              ) : (
                                <><FolderArchive className="mr-2 h-4 w-4 text-slate-400" /> Arxivga qo'shish</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm font-bold text-slate-500 mb-6">O'qituvchi: {enrollment.courses?.profiles?.full_name}</p>
                      
                      <div className="mt-auto space-y-5">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                            <span className="text-slate-400">O'zlashtirish</span>
                            <span className="text-[#0056d2]">{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-2 bg-slate-100 [&>div]:bg-[#0056d2] rounded-full" />
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Oxirgi faollik:</span>
                          <span>{enrollment.last_accessed ? new Date(enrollment.last_accessed).toLocaleDateString() : "Bugun"}</span>
                        </div>
                        
                        <Link to={`/student/courses/${enrollment.course_id}`} className="block pt-2">
                          <Button className="w-full bg-[#0056d2] hover:bg-[#00419e] text-white rounded-md font-bold h-11 transition-all shadow-md shadow-blue-100">
                            <PlayCircle className="mr-2 h-5 w-5" /> Darsni davom ettirish
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all group flex flex-col md:flex-row bg-white h-full">
                    <div className="w-full md:w-56 h-48 md:h-auto bg-slate-100 relative shrink-0">
                      {enrollment.courses?.image_url ? (
                        <img src={enrollment.courses.image_url} alt={enrollment.courses.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 opacity-40 group-hover:scale-105 transition-transform duration-700" />
                      )}
                      <Badge className="absolute top-3 left-3 bg-[#0056d2] text-white border-none font-bold rounded-md px-3 py-1 shadow-sm">
                        {enrollment.courses?.category || "Fan"}
                      </Badge>
                    </div>
                    
                    <CardContent className="p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-3 flex-1">
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-[#0056d2] transition-colors">
                          {enrollment.courses?.title || "Nomsiz Kurs"}
                        </h3>
                        <p className="text-sm font-bold text-slate-500">O'qituvchi: {enrollment.courses?.profiles?.full_name}</p>
                        <div className="flex items-center gap-8 pt-2">
                           <div className="flex-1 max-w-[240px] space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-[#0056d2]">{enrollment.progress}%</span>
                              </div>
                              <Progress value={enrollment.progress} className="h-2 bg-slate-100 [&>div]:bg-[#0056d2] rounded-full" />
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap pt-4">
                             <Clock className="h-3.5 w-3.5" /> Oxirgi: {enrollment.last_accessed ? new Date(enrollment.last_accessed).toLocaleDateString() : "Bugun"}
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <Link to={`/student/courses/${enrollment.course_id}`}>
                          <Button className="bg-[#0056d2] hover:bg-[#00419e] text-white rounded-md font-bold h-12 px-8 shadow-md shadow-blue-100 transition-all">
                            <PlayCircle className="mr-2 h-5 w-5" /> Davom ettirish
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-12 w-12 p-0 rounded-md border-slate-200 text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-lg">
                            <DropdownMenuItem onClick={() => toggleArchive(enrollment.course_id)} className="cursor-pointer font-bold text-slate-700">
                              {archivedIds.includes(enrollment.course_id) ? (
                                <><RotateCcw className="mr-2 h-4 w-4 text-blue-500" /> Arxivdan chiqarish</>
                              ) : (
                                <><FolderArchive className="mr-2 h-4 w-4 text-slate-400" /> Arxivga qo'shish</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="relative rounded-2xl bg-white border border-slate-200 p-8 md:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden mt-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-60" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-60" />
        
        <div className="relative z-10 space-y-3 max-w-xl text-center sm:text-left">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Yangi bilimlar olamiga sho'ng'ing</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            IDROK AI sizning qiziqishlaringizga mos keladigan professional kurslarni tavsiya qiladi. Bilimingizni keyingi bosqichga olib chiqing.
          </p>
        </div>
        <Link to="/student/courses" className="relative z-10 shrink-0 w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#0056d2] text-white hover:bg-[#00419e] rounded-md h-14 px-10 font-bold shadow-md shadow-blue-100 transition-all">
            Kurslarni ko'rish <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </>
  );
};

export default StudentMyCourses;
