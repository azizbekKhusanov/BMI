import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, Star, MessageSquare, TrendingUp,
  Search, ChevronRight, Target, Activity,
  Sparkles, Calendar, RefreshCcw
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filtered = (data as any || []).filter((a: any) => a.lessons?.courses?.teacher_id === user.id);
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
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8 space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
           <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                 <div className="h-10 w-10 rounded-lg bg-blue-50 text-[#0056d2] flex items-center justify-center shadow-sm">
                    <Brain className="h-5 w-5" />
                 </div>
                 <Badge className="bg-blue-50 text-[#0056d2] border-none font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded">
                    Metakognitiv Tahlillar
                 </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                 Self-Assessment Tahlili
              </h1>
              <p className="text-slate-500 font-medium text-sm max-w-xl">
                 Talabalarning o'z o'rganish jarayoniga bergan baholari va chuqur refleksiyalarini ko'rib chiqing.
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchAssessments}
                className="h-10 w-10 p-0 rounded-lg border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#0056d2]" />
                 <Input 
                   placeholder="Talaba yoki dars nomi..." 
                   className="h-10 pl-9 rounded-lg border-slate-200 bg-white shadow-sm w-full lg:w-[300px] font-medium text-sm focus-visible:ring-[#0056d2]"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* Assessments List */}
        <div className="grid gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)
              ) : filteredAssessments.length > 0 ? (
                filteredAssessments.map((a) => {
                  const [q1, q2, q3] = parseReflection(a.reflection);
                  const calibration = a.predicted_score !== null && a.actual_score !== null
                    ? Math.abs(a.predicted_score - a.actual_score)
                    : null;

                  return (
                      <Card key={a.id} className="border border-slate-200 shadow-sm hover:shadow-md bg-white rounded-xl overflow-hidden transition-shadow">
                        <CardContent className="p-6 lg:p-8">
                          <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left: Profile & Calibration */}
                            <div className="lg:w-1/4 flex flex-col space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-8 shrink-0">
                               <div className="flex items-center lg:flex-col lg:items-start gap-4">
                                  <Avatar className="h-16 w-16 lg:h-20 lg:w-20 rounded-xl border border-slate-200 shadow-sm">
                                     <AvatarImage src={a.profiles.avatar_url || ""} />
                                     <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xl">{a.profiles.full_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                     <h4 className="font-bold text-base lg:text-lg text-slate-900 leading-tight">{a.profiles.full_name}</h4>
                                     <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs mt-1">
                                        <Calendar className="h-3 w-3" /> {new Date(a.created_at).toLocaleDateString('uz-UZ')}
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-4">
                                  <div className="space-y-1.5">
                                     <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Talaba Bahosi</p>
                                     <div className="flex items-center gap-1.5">
                                        {Array(5).fill(0).map((_, i) => (
                                          <Star key={i} className={`h-4 w-4 ${i < a.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-50"}`} />
                                        ))}
                                        <span className="text-sm font-bold text-slate-900 ml-1">{a.rating}/5</span>
                                     </div>
                                  </div>

                                  {calibration !== null && (
                                    <div className="space-y-1.5">
                                       <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Kalibrlash (Aniqlik)</p>
                                       <Badge className={`rounded px-2.5 py-0.5 border-none font-semibold text-[10px] uppercase tracking-wide ${calibration === 0 ? 'bg-emerald-50 text-emerald-700' : calibration <= 1 ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'}`}>
                                          {calibration === 0 ? "Mukammal" : calibration <= 1 ? "Yaxshi" : "Yuqori tafovut"}
                                       </Badge>
                                    </div>
                                  )}
                               </div>
                            </div>

                            {/* Right: Reflection Content */}
                            <div className="flex-1 space-y-6">
                               <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="space-y-1">
                                     <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{a.lessons.courses.title}</p>
                                     <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        {a.lessons.title} <ChevronRight className="h-4 w-4 text-slate-300" />
                                     </h3>
                                  </div>
                                  <Badge className="bg-slate-100 text-slate-700 rounded px-3 py-1 font-semibold text-[10px] uppercase tracking-wide border-none self-start">Tahliliy Refleksiya</Badge>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {[
                                    { q: "Qiyinchiliklar", v: q1, icon: Target, color: "text-rose-600 bg-rose-50" },
                                    { q: "Sabablar", v: q2, icon: Activity, color: "text-[#0056d2] bg-blue-50" },
                                    { q: "Kelgusi reja", v: q3, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" }
                                  ].map((box, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className={`h-8 w-8 rounded-md ${box.color} flex items-center justify-center`}>
                                          <box.icon className="h-4 w-4" />
                                        </div>
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{box.q}</span>
                                      </div>
                                      <p className="text-sm text-slate-700 font-medium">
                                         "{box.v || "Talaba fikr bildirmadi"}"
                                      </p>
                                    </div>
                                  ))}
                               </div>

                               <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                                  <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0056d2]">
                                      <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                       <p className="text-sm font-bold text-slate-900">Talaba bilan bog'lanish</p>
                                       <p className="text-slate-500 font-medium text-xs">Refleksiya bo'yicha shaxsiy tavsiyalar bering.</p>
                                    </div>
                                  </div>
                                  <Button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-4 h-9 rounded-md transition-colors shadow-sm">
                                     Xabar yuborish <Sparkles className="h-3 w-3 ml-2 text-amber-500" />
                                  </Button>
                               </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  );
                })
              ) : (
                <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-4">
                   <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                      <Brain className="h-8 w-8" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900">Ma'lumotlar topilmadi</h3>
                      <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                         Hozircha hech qanday talaba refleksiya yubormagan yoki qidiruvingiz bo'yicha natija yo'q.
                      </p>
                   </div>
                   <Button onClick={() => setSearchTerm("")} variant="link" className="text-[#0056d2] font-semibold text-sm mt-2">Filterni tozalash</Button>
                </div>
              )}
        </div>
      </div>
  );
};

export default TeacherSelfAssessments;
