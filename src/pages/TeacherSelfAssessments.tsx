import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Star, MessageSquareQuote, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TeacherSelfAssessments = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAssessments();
  }, [user]);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      // 1. O'qituvchiga tegishli kurslarni va darslarni olish
      const { data: myCourses } = await supabase.from("courses").select("id, title").eq("teacher_id", user?.id);
      const courseIds = (myCourses || []).map(c => c.id);

      if (courseIds.length === 0) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      const { data: lessonsData } = await supabase.from("lessons").select("id, title, course_id").in("course_id", courseIds);
      const lessonIds = (lessonsData || []).map(l => l.id);

      if (lessonIds.length === 0) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      // 2. Self-assessments ni olish
      const { data: assessmentsData, error } = await supabase
        .from("self_assessments")
        .select("*")
        .in("lesson_id", lessonIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const safeAssessments = assessmentsData || [];

      // 3. Profillarni alohida olish
      const userIds = [...new Set(safeAssessments.map(a => a.user_id))];
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("*").in("user_id", userIds);
        profiles = profilesData || [];
      }

      // Ma'lumotlarni birlashtirish
      const enriched = safeAssessments.map(a => {
        const lesson = (lessonsData || []).find(l => l.id === a.lesson_id);
        const course = (myCourses || []).find(c => c.id === lesson?.course_id);
        const profile = profiles.find(p => p.user_id === a.user_id);
        
        return {
          ...a,
          profiles: profile || { full_name: "Noma'lum", avatar_url: null },
          lessons: {
            ...lesson,
            courses: course
          }
        };
      });

      setAssessments(enriched);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight text-primary flex items-center gap-3">
              <Brain className="h-8 w-8" /> Self-Assessment Natijalari
            </h1>
            <p className="text-muted-foreground mt-1">O'quvchilarning o'zini qanday baholayotganini tahlil qiling.</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-sm font-bold border border-primary/20">
            <TrendingUp className="h-4 w-4" /> Metakognitiv tahlil
          </div>
        </div>

        <div className="grid gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
          ) : assessments.length > 0 ? (
            assessments.map((a) => (
              <Card key={a.id} className="border-none shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <Avatar>
                        <AvatarImage src={a.profiles.avatar_url} />
                        <AvatarFallback className="bg-primary/5 text-primary">{a.profiles.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-sm">{a.profiles.full_name}</h4>
                        <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-2">
                         <span className="text-xs font-medium text-muted-foreground">Kurs: {a.lessons.courses.title}</span>
                         <span className="text-muted-foreground/30">|</span>
                         <span className="text-xs font-bold text-primary">Dars: {a.lessons.title}</span>
                       </div>
                       
                       <div className="flex items-center gap-1 mb-2">
                         {Array(5).fill(0).map((_, i) => (
                           <Star key={i} className={`h-3 w-3 ${i < a.rating ? "text-yellow-500 fill-yellow-500" : "text-muted/30"}`} />
                         ))}
                       </div>

                       <div className="bg-muted/10 p-3 rounded-xl border border-muted flex gap-3 italic text-sm text-muted-foreground">
                         <MessageSquareQuote className="h-5 w-5 text-primary shrink-0 opacity-40" />
                         "{a.reflection || "Fikr qoldirilmagan."}"
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed py-20 text-center bg-muted/20 rounded-3xl">
              <Star className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-serif font-bold text-muted-foreground">Hali baholashlar yo'q</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Talabalar darslarni tugatgandan so'ng o'zlarini baholashadi va fikr qoldirishadi.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TeacherSelfAssessments;
