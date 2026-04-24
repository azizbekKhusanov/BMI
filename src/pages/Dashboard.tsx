import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Trophy, Target, TrendingUp, Search, 
  RefreshCcw, UserCheck, GraduationCap, Brain, Activity, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("enrollments")
      .select("*, courses(title, description, image_url)")
      .eq("user_id", user.id)
      .then(({ data }) => setEnrollments(data || []));

    supabase
      .from("test_results")
      .select("*, tests(question)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentResults(data || []));
  }, [user]);

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + Number(e.progress), 0) / enrollments.length)
    : 0;

  const StatCard = ({ title, value, icon: Icon, color, sparklineColor }: any) => (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-500 bg-white">
      <CardContent className="p-8">
        <div className="flex items-center justify-between gap-4">
          <div className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800 font-serif">{value}</span>
            </div>
          </div>
          {/* Simple SVG Sparkline */}
          <div className="w-20 h-12 opacity-30 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 40" className="w-full h-full">
              <path 
                d="M0 35 Q 25 35, 40 20 T 70 25 T 100 5" 
                fill="none" 
                stroke={sparklineColor} 
                strokeWidth="4" 
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
                Mening Ta'lim Panelim
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                O'zlashtirish faolligi va metakognitiv natijalar boshqaruv paneli
              </p>
            </div>
          </div>
          <Button variant="outline" className="rounded-2xl h-12 px-6 border-slate-200 bg-white shadow-sm hover:bg-slate-50 gap-2 font-bold text-[10px] uppercase tracking-widest text-slate-500 transition-all">
            <RefreshCcw className="h-4 w-4" /> Yangilash
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard 
            title="Jami Kurslarim" 
            value={enrollments.length} 
            icon={BookOpen} 
            color="bg-indigo-500" 
            sparklineColor="#6366f1"
          />
          <StatCard 
            title="O'rtacha Progress" 
            value={`${avgProgress}%`} 
            icon={Activity} 
            color="bg-amber-500" 
            sparklineColor="#f59e0b"
          />
          <StatCard 
            title="Faol Testlar" 
            value={recentResults.length} 
            icon={Target} 
            color="bg-sky-500" 
            sparklineColor="#0ea5e9"
          />
        </div>

        {/* Search & Filter bar like in the image */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <Input 
              placeholder="Kurs yoki dars nomini kiriting..." 
              className="w-full h-16 pl-16 pr-6 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-16 px-8 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] font-bold text-[10px] uppercase tracking-widest text-slate-500">
              Barcha kurslar
            </Button>
            <Button variant="outline" className="h-16 px-8 rounded-[2rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] font-bold text-[10px] uppercase tracking-widest text-slate-500">
              Sana bo'yicha
            </Button>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-bold text-[#1e293b] font-serif uppercase tracking-tight">Kurslarim Ro'yxati</h2>
            <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
              {enrollments.length} ta natija
            </Badge>
          </div>

          <div className="grid gap-6">
            {enrollments.length === 0 ? (
              <Card className="border-dashed border-2 py-32 text-center bg-slate-50/50 rounded-[3rem] border-slate-200">
                <CardContent className="space-y-6">
                  <div className="h-24 w-24 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto">
                    <BookOpen className="h-10 w-10 text-slate-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-bold text-[#1e293b] uppercase">Kurslar Topilmadi</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Kurslaringizda hali darslar yo'q yoki qidiruv natijasi bo'sh</p>
                  </div>
                  <Button asChild className="rounded-full h-14 px-10 bg-[#1e293b] hover:bg-[#334155] font-bold text-xs tracking-widest uppercase shadow-lg transition-all">
                    <Link to="/courses">Barcha kurslarga o'tish</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((e) => (
                  <Card key={e.id} className="border-none shadow-md rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white">
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={e.courses?.image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={e.courses?.title} 
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 backdrop-blur-md text-indigo-600 border-none px-3 py-1 font-bold text-[10px]">
                          {Math.round(e.progress)}% TUGALLANDI
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-8 space-y-4">
                      <h3 className="text-xl font-bold font-serif text-[#1e293b] group-hover:text-indigo-600 transition-colors leading-tight">
                        {e.courses?.title}
                      </h3>
                      <Progress value={Number(e.progress)} className="h-1.5 bg-slate-100" />
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-slate-200" />
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" asChild className="rounded-xl text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-50">
                          <Link to={`/student/courses/${e.course_id}`}>O'rganishni davom ettirish</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
