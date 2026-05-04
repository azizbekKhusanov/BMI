import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, BookOpen, Search, Filter,
  Users, ArrowRight, Clock, 
  Loader2, Camera, Brain, MessageSquare, Target, Upload
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  avgProgress?: number;
}

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    image_url: "",
    meta_pre_lesson: false,
    meta_calibration: false,
    meta_reflection: false
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
          supabase.from("enrollments").select("course_id, progress"),
          supabase.from("lessons").select("course_id")
        ]);

        const allEnrollments = enrollmentsRes.data || [];
        const allLessons = lessonsRes.data || [];

        const mappedCourses = (coursesData as Course[]).map(course => {
          const courseEnrolls = allEnrollments.filter(e => e.course_id === course.id);
          const studentCount = courseEnrolls.length;
          const avgProgress = studentCount > 0 
            ? Math.round(courseEnrolls.reduce((acc, e) => acc + e.progress, 0) / studentCount)
            : 0;

          return {
            ...course,
            studentCount,
            lessonCount: allLessons.filter(l => l.course_id === course.id).length,
            avgProgress
          };
        });
        
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

    setIsCreating(true);
    try {
      let uploadedImageUrl = newCourse.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60";

      if (imageFile && user) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('course_images')
          .upload(filePath, imageFile);

        if (uploadError) {
          toast.error("Rasm yuklashda xatolik: " + uploadError.message);
          setIsCreating(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('course_images')
          .getPublicUrl(filePath);

        uploadedImageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: newCourse.title,
          description: newCourse.description,
          image_url: uploadedImageUrl,
          teacher_id: user?.id,
          is_published: false
        })
        .select()
        .single();

      if (error) throw error;

      const metaSettings = {
        meta_pre_lesson: newCourse.meta_pre_lesson,
        meta_calibration: newCourse.meta_calibration,
        meta_reflection: newCourse.meta_reflection,
      };
      localStorage.setItem(`course_meta_${data.id}`, JSON.stringify(metaSettings));

      toast.success("Kurs muvaffaqiyatli yaratildi!");
      setIsDialogOpen(false);
      setNewCourse({ 
        title: "", 
        description: "", 
        image_url: "",
        meta_pre_lesson: false,
        meta_calibration: false,
        meta_reflection: false
      });
      setImageFile(null);
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

  if (loading) return (
    <div className="w-full pt-8 px-8 space-y-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
      </div>
    </div>
  );

  return (
      <div className="w-full py-8 px-8 space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#0056d2] font-semibold text-xs uppercase tracking-wide mb-2">
                <BookOpen className="h-4 w-4" /> Kurslarni Boshqarish
              </div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">Mening Kurslarim</h1>
           </div>

           <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogTrigger asChild>
                    <Button className="h-10 px-6 rounded-lg bg-[#0056d2] hover:bg-[#00419e] text-white font-medium shadow-sm gap-2">
                       <Plus className="h-4 w-4" /> Yangi kurs yaratish
                    </Button>
                 </DialogTrigger>
                 <DialogContent className="rounded-xl border border-slate-200 shadow-lg p-0 max-w-2xl bg-white overflow-y-auto max-h-[90vh]">
                    <div className="bg-slate-50 border-b border-slate-200 p-6">
                       <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-slate-900">Yangi Kurs Yaratish</DialogTitle>
                       </DialogHeader>
                    </div>
                    <div className="p-6 space-y-6">
                       <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kurs Nomi</Label>
                          <Input 
                            placeholder="Masalan: Metakognitiv Psixologiya" 
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                            className="h-10 rounded-lg border-slate-200 font-medium"
                          />
                       </div>

                       <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Muqova rasmi</Label>
                          <div className="relative border-2 border-dashed border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                             <input 
                               type="file" 
                               accept="image/*"
                               onChange={(e) => {
                                 if (e.target.files && e.target.files[0]) {
                                   setImageFile(e.target.files[0]);
                                 }
                               }}
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                             {imageFile ? (
                               <div className="flex flex-col items-center gap-2">
                                  <img 
                                    src={URL.createObjectURL(imageFile)} 
                                    alt="Preview" 
                                    className="h-20 w-32 object-cover rounded-md border border-slate-200 shadow-sm"
                                  />
                                  <span className="text-xs font-medium text-slate-600 line-clamp-1">{imageFile.name}</span>
                               </div>
                             ) : (
                               <div className="flex flex-col items-center gap-2 text-slate-400">
                                  <Upload className="h-6 w-6" />
                                  <span className="text-sm font-medium">Rasmni yuklash uchun bosing yoki shu yerga tashlang</span>
                                  <span className="text-xs text-slate-400">PNG, JPG, WEBP (max 5MB)</span>
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kurs Tavsifi</Label>
                          <Textarea 
                            placeholder="Kursning maqsad va vazifalari haqida..." 
                            value={newCourse.description}
                            onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                            className="min-h-[100px] rounded-lg border-slate-200 p-3 font-medium text-sm"
                          />
                       </div>

                       <div className="border-t border-slate-100 pt-6">
                         <div className="flex items-center gap-2 mb-4">
                           <Brain className="h-4 w-4 text-[#0056d2]" />
                           <Label className="text-sm font-semibold text-slate-900">
                             Metakognitiv Sozlamalar
                           </Label>
                           <span className="text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 ml-1">
                             Ixtiyoriy
                           </span>
                         </div>
                         <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                           Quyidagi sozlamalarni yoqsangiz, talabalar har bir darsda 
                           metakognitiv ko'nikmalarini rivojlantiruvchi qo'shimcha 
                           mashqlarni bajaradilar.
                         </p>

                         <div className="space-y-4">
                           
                           {/* 1 — Pre-lesson savol */}
                           <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                             <div className="flex items-start gap-3">
                               <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                 <Target className="h-4 w-4 text-[#0056d2]" />
                               </div>
                               <div>
                                 <p className="text-sm font-semibold text-slate-900">
                                   Darsdan oldingi savol
                                 </p>
                                 <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                   Dars boshida talabaga "Bu darsda nimalarni o'rganaman deb o'ylaysiz?" degan savol beriladi.
                                 </p>
                               </div>
                             </div>
                             <Switch
                               checked={newCourse.meta_pre_lesson}
                               onCheckedChange={(v) => 
                                 setNewCourse({...newCourse, meta_pre_lesson: v})
                               }
                             />
                           </div>

                           {/* 2 — Kalibrlash testi */}
                           <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                             <div className="flex items-start gap-3">
                               <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                 <Brain className="h-4 w-4 text-purple-600" />
                               </div>
                               <div>
                                 <p className="text-sm font-semibold text-slate-900">
                                   Kalibrlash testi
                                 </p>
                                 <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                   Talaba test savolini ko'rib, avval ishonch darajasini baholaydi. Taxmin va haqiqiy natija taqqoslanadi.
                                 </p>
                               </div>
                             </div>
                             <Switch
                               checked={newCourse.meta_calibration}
                               onCheckedChange={(v) => 
                                 setNewCourse({...newCourse, meta_calibration: v})
                               }
                             />
                           </div>

                           {/* 3 — Majburiy refleksiya */}
                           <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
                             <div className="flex items-start gap-3">
                               <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                 <MessageSquare className="h-4 w-4 text-emerald-600" />
                               </div>
                               <div>
                                 <p className="text-sm font-semibold text-slate-900">
                                   Majburiy refleksiya
                                 </p>
                                 <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                   Talaba keyingi darsga o'tishdan oldin refleksiya yozishi shart bo'ladi.
                                 </p>
                               </div>
                             </div>
                             <Switch
                               checked={newCourse.meta_reflection}
                               onCheckedChange={(v) => 
                                 setNewCourse({...newCourse, meta_reflection: v})
                               }
                             />
                           </div>

                         </div>
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                       <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 flex-1 rounded-lg font-medium text-slate-600 border-slate-200">Bekor qilish</Button>
                       <Button 
                         onClick={handleCreateCourse} 
                         disabled={isCreating}
                         className="h-10 flex-[2] rounded-lg bg-[#0056d2] hover:bg-[#00419e] text-white font-medium shadow-sm transition-all"
                       >
                         {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tasdiqlash"}
                       </Button>
                    </div>
                 </DialogContent>
              </Dialog>
           </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input 
             placeholder="Kurslarni qidirish..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white shadow-sm focus-visible:ring-1 focus-visible:ring-blue-100 font-medium text-sm"
           />
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-slate-200 shadow-sm">
             <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                <BookOpen className="h-8 w-8 text-slate-400" />
             </div>
             <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Hozircha kurslar yo'q</h3>
                <p className="text-slate-500 font-medium text-sm">Ilk kursingizni yaratib, bilimlaringizni ulashishni boshlang!</p>
             </div>
             <Button onClick={() => setIsDialogOpen(true)} className="h-10 px-6 rounded-lg bg-blue-50 text-[#0056d2] font-medium border border-blue-100 hover:bg-blue-100">Boshlash</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredCourses.map((course) => (
                <Link key={course.id} to={`/teacher/courses/${course.id}`} className="group block h-full">
                  <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
                     <div className="h-48 relative border-b border-slate-100 bg-slate-100">
                        <img 
                          src={course.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60"} 
                          className="h-full w-full object-cover"
                          alt={course.title} 
                        />
                        <div className="absolute top-3 left-3">
                           <Badge className={`${course.is_published ? "bg-emerald-500" : "bg-amber-500"} text-white border-none px-3 py-1 font-semibold text-[10px] uppercase tracking-wide rounded-md shadow-sm`}>
                              {course.is_published ? "Nashr etilgan" : "Qoralama"}
                           </Badge>
                        </div>
                     </div>
                     
                     <CardContent className="p-5 flex flex-col flex-1">
                        <div className="space-y-2 flex-1">
                           <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-[#0056d2] transition-colors">
                              {course.title}
                           </h3>
                           <p className="text-slate-500 text-sm font-normal line-clamp-2">
                              {course.description || "Ushbu kurs haqida batafsil ma'lumot tez orada qo'shiladi."}
                           </p>
                        </div>

                        <div className="mt-6 space-y-4">
                           <div className="space-y-1">
                              <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>O'zlashtirish</span>
                                <span>{course.avgProgress || 0}%</span>
                              </div>
                              <Progress value={course.avgProgress || 0} className="h-2 rounded-full bg-slate-100" />
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm text-slate-500">
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-1.5 font-medium">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span>{course.studentCount || 0}</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 font-medium">
                                    <BookOpen className="h-4 w-4 text-slate-400" />
                                    <span>{course.lessonCount || 0}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                                 <Clock className="h-3.5 w-3.5" />
                                 {new Date(course.created_at).toLocaleDateString()}
                              </div>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
                </Link>
             ))}
          </div>
        )}
      </div>
  );
};

export default TeacherCourses;
