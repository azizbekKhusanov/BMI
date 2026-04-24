import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Plus, BookOpen, Search, Filter, MoreVertical, Edit, Trash2, Sparkles, Wand2, LayoutGrid } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New course state
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    image_url: ""
  });

  useEffect(() => {
    if (user) fetchTeacherCourses();
  }, [user]);

  const fetchTeacherCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("teacher_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Kurslarni yuklashda xatolik");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!newCourse.title) {
      toast.error("Kurs nomini kiriting");
      return;
    }

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

    if (error) {
      toast.error("Kurs yaratishda xatolik");
    } else {
      toast.success("Kurs muvaffaqiyatli yaratildi!");
      setCourses([data, ...courses]);
      setIsDialogOpen(false);
      setIsDialogOpen(false);
      setNewCourse({ title: "", description: "", image_url: "" });
      navigate(`/teacher/courses/${data.id}`);
    }
  };

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
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
              <DialogHeader className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                  <Wand2 className="h-6 w-6" />
                </div>
                <DialogTitle className="text-2xl font-serif font-bold text-slate-800 uppercase tracking-tight">Yangi Kurs Yaratish</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-sm">
                  Kurs nomini va qisqacha tavsifini kiriting. Keyingi qadamda darslarni qo'shishingiz mumkin bo'ladi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kurs Nomi</label>
                  <Input 
                    placeholder="Masalan: Metakognitsiya asoslari" 
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Muqova rasmi</label>
                  <div 
                    onClick={() => document.getElementById('course-image-upload')?.click()}
                    className="group relative h-48 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden"
                  >
                    {newCourse.image_url ? (
                      <img src={newCourse.image_url} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                        <Plus className="h-10 w-10 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Rasm yuklash</span>
                        <span className="text-[8px] mt-1 opacity-60">PNG, JPG (Maks. 2MB)</span>
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

                        toast.promise(
                          async () => {
                            const { error: uploadError } = await supabase.storage
                              .from('course_images')
                              .upload(filePath, file);

                            if (uploadError) {
                              console.error("Supabase Storage Error:", uploadError);
                              throw uploadError;
                            }

                            const { data } = supabase.storage
                              .from('course_images')
                              .getPublicUrl(filePath);

                            setNewCourse({ ...newCourse, image_url: data.publicUrl });
                            return data.publicUrl;
                          },
                          {
                            loading: 'Rasm yuklanmoqda...',
                            success: 'Rasm muvaffaqiyatli yuklandi!',
                            error: (err) => `Xatolik: ${err.message || "Yuklashda muammo bo'ldi"}`,
                          }
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tavsif</label>
                  <Textarea 
                    placeholder="Kurs haqida qisqacha ma'lumot..." 
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                    className="min-h-[120px] rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-medium py-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-widest text-slate-400">Bekor qilish</Button>
                <Button onClick={handleCreateCourse} className="rounded-2xl h-12 px-10 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Kursni yaratish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Kurslaringiz orasidan qidiring..." 
              className="w-full h-16 pl-16 pr-6 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <Button variant="outline" className="h-16 px-8 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] font-bold text-[10px] uppercase tracking-widest text-slate-500 gap-2">
            <Filter className="h-4 w-4" /> Barcha holatlar
          </Button>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-slate-200">
            <CardContent className="space-y-6">
              <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-[#1e293b] uppercase">Kurslaringiz yo'q</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Hozircha birorta kurs yaratmagansiz. Birinchi kursingizni hoziroq ishga tushiring!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="border-none shadow-md rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white flex flex-col h-full cursor-pointer relative">
                <Link to={`/teacher/courses/${course.id}`} className="absolute inset-0 z-0" />
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={course.image_url || "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&auto=format&fit=crop&q=60"} 
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt={course.title} 
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${course.is_published ? "bg-emerald-500" : "bg-amber-500"} text-white border-none px-3 py-1 font-bold text-[9px] uppercase shadow-md`}>
                      {course.is_published ? "E'lon qilingan" : "Qoralama"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col flex-1 gap-4 relative z-10 pointer-events-none">
                  <h3 className="text-xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {course.description || "Ushbu kurs uchun tavsif berilmagan."}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherCourses;
