import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Search, Users } from "lucide-react";
import { toast } from "sonner";

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (user) fetchEnrollments();
  }, [user]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Kurslarni yuklashda xatolik:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    }
      
    setCourses(data || []);
    setLoading(false);
  };

  const fetchEnrollments = async () => {
    if (!user) return;
    const { data } = await supabase.from("enrollments").select("course_id").eq("user_id", user.id);
    setEnrolledIds(data?.map((e) => e.course_id) || []);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    if (error) {
      toast.error("Kursga yozilishda xatolik");
    } else {
      toast.success("Kursga muvaffaqiyatli yozildingiz!");
      setEnrolledIds([...enrolledIds, courseId]);
    }
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif">Kurslar</h1>
            <p className="text-muted-foreground">Barcha mavjud kurslar</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Kurs qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p className="text-lg">Kurslar topilmadi</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Card key={course.id} className="flex flex-col hover:shadow-md transition-shadow">
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="h-12 w-12 text-primary/40" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-serif line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {course.profiles?.full_name || "O'qituvchi"}
                  </p>
                  {enrolledIds.includes(course.id) ? (
                    <Link to={`/courses/${course.id}`}>
                      <Button variant="outline" className="w-full">Davom ettirish →</Button>
                    </Link>
                  ) : (
                    <Button className="w-full" onClick={() => handleEnroll(course.id)}>Kursga yozilish</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
