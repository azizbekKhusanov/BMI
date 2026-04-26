import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, Star, MessageSquare as MessageIcon, TrendingUp,
  Search, Filter, ChevronRight, Target, Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SelfAssessment {
  id: string;
  user_id: string;
  lesson_id: string;
  rating: number;
  reflection: string | null;
  predicted_score: number | null;
  actual_score: number | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
  lessons: {
    title: string;
    courses: {
      title: string;
      teacher_id: string;
    };
  };
}

const TeacherSelfAssessments = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<SelfAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAssessments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("self_assessments")
        .select(`
          *,
          profiles (full_name, avatar_url),
          lessons (
            title,
            courses (title, teacher_id)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Faqat shu o'qituvchiga tegishli kurslar natijasini filtrlash (yoki join da filtrlash)
      const filtered = (data as unknown as SelfAssessment[] || []).filter((a) => a.lessons?.courses?.teacher_id === user.id);
      setAssessments(filtered);
    } catch (error) {
      console.error("Error fetching assessments:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Refleksiyani 3 qismga bo'lish funksiyasi
  const parseReflection = (text: string | null) => {
    if (!text) return ["Fikr bildirilmagan", "", ""];
    const parts = text.split('|');
    return parts.map(p => p.split(':')[1]?.trim() || p.trim());
  };

  const filteredAssessments = assessments.filter(a =>
    a.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.lessons.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Brain className="h-6 w-6" />
              </div>
              <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Feedback Center</Badge>
            </div>
            <h1 className="text-4xl font-bold font-serif text-slate-800 uppercase tracking-tight">Self-Assessment Tahlili</h1>
            <p className="text-slate-400 font-medium">Talabalarning o'z o'rganish jarayoniga bergan baholari va refleksiyalari.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Talaba yoki dars nomi..."
                className="pl-12 h-14 w-full sm:w-[300px] rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2">
              <Filter className="h-4 w-4" /> Saralash
            </Button>
          </div>
        </div>

        <div className="grid gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)
          ) : filteredAssessments.length > 0 ? (
            filteredAssessments.map((a) => {
              const [q1, q2, q3] = parseReflection(a.reflection);
              const calibration = a.predicted_score !== null && a.actual_score !== null
                ? Math.abs(a.predicted_score - a.actual_score)
                : null;

              return (
                <Card key={a.id} className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="p-1 sm:p-2 bg-gradient-to-r from-indigo-50 to-white" />
                  <CardContent className="p-8 lg:p-12">
                    <div className="flex flex-col lg:flex-row gap-12">
                      {/* Left: User Profile & Quick Stats */}
                      <div className="lg:w-1/4 space-y-8">
                        <div className="flex items-center gap-5">
                          <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                            <AvatarImage src={a.profiles.avatar_url || ""} />
                            <AvatarFallback className="bg-indigo-600 text-white text-xl font-bold">{a.profiles.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h4 className="font-bold text-xl text-slate-800 tracking-tight">{a.profiles.full_name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(a.created_at).toLocaleDateString('uz-UZ')}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Self-Rating</span>
                            <div className="flex items-center gap-1">
                              {Array(5).fill(0).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < a.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>

                          {calibration !== null && (
                            <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${calibration <= 1 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                              <span className="text-[10px] font-black uppercase tracking-widest">Aniqlik</span>
                              <span className="text-sm font-black">{calibration === 0 ? "Mukammal" : calibration <= 1 ? "Yaxshi" : "Past"}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Reflection Content */}
                      <div className="flex-1 space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">{a.lessons.courses.title}</p>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                              {a.lessons.title} <ChevronRight className="h-5 w-5 text-slate-300" />
                            </h3>
                          </div>
                          <Badge className="bg-slate-900 text-white rounded-xl px-4 py-2 self-start sm:self-center">BATAFSIL TAHLIL</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { q: "Qiyinchiliklar", v: q1, icon: Target, color: "text-red-500 bg-red-50" },
                            { q: "Sabablar", v: q2, icon: Activity, color: "text-indigo-500 bg-indigo-50" },
                            { q: "Kelgusi reja", v: q3, icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" }
                          ].map((box, idx) => (
                            <div key={idx} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4 hover:bg-white hover:shadow-lg transition-all duration-300">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-xl ${box.color} flex items-center justify-center`}>
                                  <box.icon className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{box.q}</span>
                              </div>
                              <p className="text-sm text-slate-700 font-medium leading-relaxed italic">"{box.v || "Javob berilmagan"}"</p>
                            </div>
                          ))}
                        </div>

                        <div className="p-6 rounded-3xl bg-indigo-600 text-white flex items-center justify-between shadow-xl shadow-indigo-100">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                              <MessageIcon className="h-5 w-5 text-white" />
                            </div>
                            <p className="text-sm font-bold">Talaba bilan muloqotni boshlang</p>
                          </div>
                          <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-black text-[10px] uppercase px-6 py-4 h-auto rounded-xl">Chat Ochish</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-2 border-dashed border-slate-200 py-32 text-center bg-slate-50 rounded-[4rem]">
              <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Brain className="h-12 w-12 text-slate-200" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-slate-400 uppercase tracking-tight">Ma'lumotlar topilmadi</h3>
              <p className="text-slate-400 mt-4 max-w-sm mx-auto font-medium">
                Hozircha hech qanday talaba refleksiya yubormagan yoki qidiruvingiz bo'yicha natija yo'q.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

const MessageSquareQuote = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 9h8" /><path d="M8 13h6" />
  </svg>
);

export default TeacherSelfAssessments;
