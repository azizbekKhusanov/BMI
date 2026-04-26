import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Plus, BookOpen, Search, Filter, MoreVertical, Edit, Trash2, Sparkles, Wand2, LayoutGrid, Users, GraduationCap, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  SelectValue,
} from "@/components/ui/select";
import { useCallback } from "react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  is_published: boolean;
  teacher_id: string;
  created_at: string;
  studentCount?: number;
  lessonCount?: number;
}

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New course state
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    image_url: ""
  });

  const fetchTeacherCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (coursesData && coursesData.length > 0) {
        const [enrollmentsRes, lessonsRes] = await Promise.all([
          supabase.from("enrollments").select("course_id"),
          supabase.from("lessons").select("course_id")
        ]);

        const allEnrollments = enrollmentsRes.data || [];
        const allLessons = lessonsRes.data || [];

        const mappedCourses = (coursesData as Course[]).map(course => ({
          ...course,
          studentCount: allEnrollments.filter(e => e.course_id === course.id).length,
          lessonCount: allLessons.filter(l => l.course_id === course.id).length
        }));
        
        setCourses(mappedCourses);
      } else {
        setCourses([]);
      }
    } catch (error) {
      toast.error("Kurslarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeacherCourses();
  }, [fetchTeacherCourses]);

  const handleCreateCourse = async () => {
    if (!newCourse.title) {
      toast.error("Kurs nomini kiriting");
      return;
    }

    if (isUploading) {
      toast.error("Rasm yuklanishini kuting");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          image_url: newCourse.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60",
          teacher_id: user?.id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Kurs muvaffaqiyatli yaratildi!");
      setCourses([data, ...courses]);
      setIsDialogOpen(false);
      setNewCourse({ title: "", description: "", image_url: "" });
      navigate(`/teacher/courses/${data.id}`);
    } catch (error) {
      toast.error("Kurs yaratishda xatolik");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5">
                  Kurslar Boshqaruvi
                </Badge>
              </div>
              <h1 className="text-4xl font-bold text-[#1e293b] font-serif tracking-tight flex items-center gap-3 uppercase mt-1">
                Mening Kurslarim
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                O'quv dasturlaringizni yarating, tahrirlang va talabalar faoliyatini nazorat qiling
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-widest uppercase shadow-lg shadow-indigo-100 transition-all gap-2">
                <Plus className="h-5 w-5" /> Yangi kurs yaratish
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg overflow-hidden">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl font-serif font-bold text-slate-800 uppercase tracking-tight">Yangi Kurs Yaratish</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  Kurs ma'lumotlarini kiriting
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4 px-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurs Nomi</label>
                  <Input 
                    placeholder="Masalan: JavaScript asoslari" 
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="h-14 rounded-xl border-slate-100 bg-slate-50/50 shadow-inner px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Muqova rasmi</label>
                  <div 
                    onClick={() => document.getElementById('course-image-upload')?.click()}
                    className="group relative h-40 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all overflow-hidden shadow-inner"
                  >
                    {newCourse.image_url ? (
                      <img src={newCourse.image_url} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Plus className="h-8 w-8 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Rasm yuklash</span>
                        <span className="text-[7px] mt-1 opacity-60">Maks. 2MB</span>
                      </div>
                    )}
                    <input 
                      id="course-image-upload"
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Rasm hajmi 2MB dan oshmasligi kerak");
                          return;
                        }

                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `${fileName}`;

                        setIsUploading(true);
                        toast.promise(
                          async () => {
                            const { error: uploadError } = await supabase.storage
                              .from('course_images')
                              .upload(filePath, file);

                            if (uploadError) throw uploadError;

                            const { data } = supabase.storage
                              .from('course_images')
                              .getPublicUrl(filePath);

                            setNewCourse(prev => ({ ...prev, image_url: data.publicUrl }));
                            setIsUploading(false);
                            return data.publicUrl;
                          },
                          {
                            loading: 'Rasm yuklanmoqda...',
                            success: 'Rasm muvaffaqiyatli yuklandi!',
                            error: (err) => {
                              setIsUploading(false);
                              return `Xatolik: ${err.message}`;
                            },
                          }
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tavsif</label>
                  <Textarea 
                    placeholder="Kurs haqida qisqacha ma'lumot..." 
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50/50 shadow-inner p-5 text-sm font-bold focus:ring-2 focus:ring-indigo-600 transition-all"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-slate-50">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isCreating || isUploading} className="rounded-xl h-12 px-6 font-bold text-[10px] uppercase tracking-widest text-slate-400">Bekor qilish</Button>
                <Button 
                  onClick={handleCreateCourse} 
                  disabled={isCreating || isUploading}
                  className="rounded-xl h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 min-w-[160px]"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Kursni yaratish"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Kurslaringiz orasidan qidiring..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-16 pl-16 pr-6 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-slate-200">
            <CardContent className="space-y-6">
              <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto">
                <Search className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-[#1e293b] uppercase">Kurslar topilmadi</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Qidiruv bo'yicha hech qanday kurs topilmadi.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Link key={course.id} to={`/teacher/courses/${course.id}`} className="group/card">
                <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-xl transition-all duration-700 bg-white flex flex-col h-full hover:-translate-y-1">
                  <div className="h-52 overflow-hidden relative">
                    <img 
                      src={course.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60"} 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      alt={course.title} 
                    />
                    <div className="absolute top-5 left-5">
                      <Badge className={`${course.is_published ? "bg-emerald-500" : "bg-amber-500"} text-white border-none px-3 py-1 font-black text-[9px] uppercase shadow-lg tracking-widest rounded-full`}>
                        {course.is_published ? "FAOL" : "QORALAMA"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8 flex flex-col flex-1 gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">O'quv kursi</span>
                      </div>
                      <h3 className="text-xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2 uppercase tracking-tight">
                        {course.title}
                      </h3>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                        {course.description || "Tavsif berilmagan."}
                      </p>
                    </div>

                    <div className="mt-auto space-y-5">
                      <div className="flex items-center justify-between py-3 border-y border-slate-50">
                        <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-slate-300" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{course.studentCount || 0} Talaba</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-slate-300" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{course.lessonCount || 0} Dars</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            <Clock className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yaratilgan vaqt</span>
                            <span className="text-[11px] font-bold text-slate-700 truncate">{new Date(course.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="w-full rounded-2xl h-14 bg-[#1e293b] group-hover:bg-indigo-600 text-white font-black text-[10px] tracking-[0.1em] uppercase transition-all flex items-center justify-center gap-2">
                        Boshqarish <ArrowRight className="h-3.5 w-3.5 group-hover/card:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherCourses;
