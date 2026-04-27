import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
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
    // 1. Search Filter (Safe undefined check added)
    const titleMatch = (enrollment.courses?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Archive Filter
    const isArchived = archivedIds.includes(enrollment.course_id);
    
    // 3. Tab Filter
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
    <Layout>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mening Kurslarim</h1>
          <p className="text-slate-600">Jami {enrollments.length} ta kursda o'qiyapsiz. O'qishda davom eting!</p>
        </div>
        
        {/* AI Insight Badge */}
        {enrollments.length > 0 && (
          <div 
            onClick={() => navigate(`/student/courses/${enrollments[0].course_id}`)}
            className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-full px-6 py-3 cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <div className="h-10 w-10 rounded-full bg-indigo-500 text-white flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">AI Maslahati</div>
              <div className="text-sm font-semibold text-slate-700">"{enrollments[0]?.courses?.title || 'Kurs'}" bo'yicha darsni davom ettiring.</div>
            </div>
            <ArrowRight className="h-4 w-4 text-indigo-400 ml-2" />
          </div>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab("faol")}
            className={`flex items-center gap-2 pb-4 -mb-4 border-b-2 font-semibold transition-all ${activeTab === "faol" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <PlayCircle className="h-4 w-4" /> Faol Kurslar
          </button>
          <button 
            onClick={() => setActiveTab("tamomlangan")}
            className={`flex items-center gap-2 pb-4 -mb-4 border-b-2 font-semibold transition-all ${activeTab === "tamomlangan" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <CheckCircle2 className="h-4 w-4" /> Tamomlangan
          </button>
          <button 
            onClick={() => setActiveTab("arxiv")}
            className={`flex items-center gap-2 pb-4 -mb-4 border-b-2 font-semibold transition-all ${activeTab === "arxiv" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <Archive className="h-4 w-4" /> Arxivlangan
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Kurslarni qidirish..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded shadow-sm transition-colors ${viewMode === "grid" ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded shadow-sm transition-colors ${viewMode === "list" ? "bg-white text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`grid gap-6 mb-12 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className={`rounded-3xl ${viewMode === "grid" ? "h-96 w-full" : "h-32 w-full"}`} />
           ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mb-12 animate-fade-in">
           <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
             <BookOpen className="h-8 w-8 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">Hozircha kurslar yo'q</h3>
           <p className="text-slate-500 mb-6">Platformadagi mavjud kurslar bilan tanishing va o'rganishni boshlang.</p>
           <Link to="/student/courses">
             <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 font-semibold">
               Katalogni ochish
             </Button>
           </Link>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm mb-12 animate-fade-in">
           <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
             <Search className="h-8 w-8 text-slate-400" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">Hech narsa topilmadi</h3>
           <p className="text-slate-500 mb-6">Boshqa so'z bilan qidirib ko'ring yoki boshqa bo'limni tanlang.</p>
        </div>
      ) : (
        <div className={`grid gap-6 mb-12 animate-fade-in ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {filteredEnrollments.map((enrollment) => (
            viewMode === "grid" ? (
              // GRID VIEW
              <Card key={enrollment.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
                <div className="h-48 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                   {enrollment.courses?.image_url ? (
                     <img src={enrollment.courses.image_url} alt={enrollment.courses.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-40 group-hover:scale-105 transition-transform duration-500" />
                   )}
                   <Badge className="absolute top-4 left-4 bg-white/90 text-indigo-600 hover:bg-white border-none font-bold rounded-full">
                     {enrollment.courses?.category || "Fan"}
                   </Badge>
                </div>
                
                <CardContent className="p-6 flex-1 flex flex-col bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2 pr-4">{enrollment.courses?.title || "Nomsiz Kurs"}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="text-slate-400 hover:text-slate-600 focus:outline-none shrink-0 p-1">
                        <MoreVertical className="h-5 w-5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => toggleArchive(enrollment.course_id)} className="cursor-pointer">
                          {archivedIds.includes(enrollment.course_id) ? (
                            <><RotateCcw className="mr-2 h-4 w-4" /> Arxivdan chiqarish</>
                          ) : (
                            <><FolderArchive className="mr-2 h-4 w-4" /> Arxivga qo'shish</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">O'qituvchi: {enrollment.courses?.profiles?.full_name}</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">O'zlashtirish</span>
                        <span className="text-indigo-600">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2 bg-slate-100 [&>div]:bg-indigo-600" />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Oxirgi faollik:</span>
                      <span>{enrollment.last_accessed ? new Date(enrollment.last_accessed).toLocaleDateString() : "Bugun"}</span>
                    </div>
                    
                    <Link to={`/student/courses/${enrollment.course_id}`} className="block">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold h-11 mt-2 shadow-sm transition-all">
                        <PlayCircle className="mr-2 h-5 w-5" /> O'qishni davom ettirish
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // LIST VIEW
              <Card key={enrollment.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col md:flex-row bg-white">
                <div className="w-full md:w-48 h-48 md:h-auto bg-slate-100 relative shrink-0">
                  {enrollment.courses?.image_url ? (
                    <img src={enrollment.courses.image_url} alt={enrollment.courses.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-40" />
                  )}
                  <Badge className="absolute top-3 left-3 bg-white/90 text-indigo-600 border-none font-bold rounded-full">
                    {enrollment.courses?.category || "Fan"}
                  </Badge>
                </div>
                
                <CardContent className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{enrollment.courses?.title || "Nomsiz Kurs"}</h3>
                    <p className="text-sm text-slate-500">O'qituvchi: {enrollment.courses?.profiles?.full_name}</p>
                    <div className="flex items-center gap-4 pt-2">
                       <div className="flex-1 max-w-[200px] space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-600">Progress</span>
                            <span className="text-indigo-600">{enrollment.progress}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600" />
                       </div>
                       <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                         <Clock className="h-3.5 w-3.5" /> Oxirgi: {enrollment.last_accessed ? new Date(enrollment.last_accessed).toLocaleDateString() : "Bugun"}
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <Link to={`/student/courses/${enrollment.course_id}`}>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold h-11 px-6 shadow-sm">
                        <PlayCircle className="mr-2 h-4 w-4" /> Davom ettirish
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => toggleArchive(enrollment.course_id)} className="cursor-pointer">
                          {archivedIds.includes(enrollment.course_id) ? (
                            <><RotateCcw className="mr-2 h-4 w-4" /> Arxivdan chiqarish</>
                          ) : (
                            <><FolderArchive className="mr-2 h-4 w-4" /> Arxivga qo'shish</>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* Discover Banner */}
      <div className="rounded-[2rem] bg-indigo-600 text-white p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-indigo-200">
        <div className="space-y-2 max-w-xl text-center sm:text-left">
          <h2 className="text-2xl font-bold">Yangi bilimlar olamiga sho'ng'ing</h2>
          <p className="text-indigo-100 font-medium leading-relaxed">
            MetaEdu AI sizning qiziqishlaringizga mos keladigan professional kurslarni tavsiya qiladi.
          </p>
        </div>
        <Link to="/student/courses" className="shrink-0 w-full sm:w-auto">
          <Button variant="secondary" className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl h-12 px-8 font-bold shadow-sm">
            Kurslarni Ko'rish <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Layout>
  );
};

export default StudentMyCourses;
