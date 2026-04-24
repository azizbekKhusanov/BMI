import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Clock, Activity, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StudentMyCourses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMyCourses = async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses (
            id,
            title,
            description,
            image_url,
            teacher:profiles (full_name)
          )
        `)
        .eq("user_id", user.id);
      
      if (error) console.error(error);
      setEnrollments(data || []);
      setLoading(false);
    };

    fetchMyCourses();
  }, [user]);

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#1e293b] font-serif tracking-tight flex items-center gap-3 uppercase">
                Mening Kurslarim
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                Siz hozirda o'rganayotgan va tugatgan kurslar tarixi
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none px-6 py-2 rounded-full text-xs font-black shadow-sm h-10 flex items-center uppercase tracking-widest">
            {enrollments.length} ta Kurs
          </Badge>
        </div>

        {loading ? (
          <div className="grid gap-8">
            {[1, 2].map(i => (
              <div key={i} className="h-48 rounded-[2.5rem] bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-slate-200">
            <CardContent className="space-y-6">
              <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-[#1e293b] uppercase">Kurslar Topilmadi</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Siz hali birorta kursga yozilmagansiz</p>
              </div>
              <Button asChild className="rounded-full h-14 px-10 bg-[#1e293b] hover:bg-[#334155] font-bold text-xs tracking-widest uppercase shadow-lg transition-all">
                <Link to="/courses">Kurslarni Ko'rish</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-none shadow-md rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-80 h-64 lg:h-auto overflow-hidden relative">
                    <img 
                      src={enrollment.courses?.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={enrollment.courses?.title} 
                    />
                    <div className="absolute inset-0 bg-indigo-900/10" />
                  </div>
                  <CardContent className="p-8 lg:p-10 flex-1 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <Activity className="h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Faol o'rganishda</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-slate-700">4.9</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight">
                        {enrollment.courses?.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 max-w-2xl">
                        {enrollment.courses?.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O'zlashtirish darajasi</p>
                          <p className="text-sm font-black text-indigo-600">{Math.round(enrollment.progress)}%</p>
                        </div>
                        <Progress value={Number(enrollment.progress)} className="h-2 bg-slate-100" />
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Oxirgi faollik</span>
                            <span className="text-xs font-bold text-slate-700">Bugun</span>
                          </div>
                        </div>
                        <Button asChild className="rounded-2xl h-14 px-8 bg-[#1e293b] hover:bg-[#334155] font-bold text-xs tracking-widest uppercase shadow-lg transition-all gap-2">
                          <Link to={`/student/courses/${enrollment.course_id}`}>
                            Davom Ettirish <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentMyCourses;
