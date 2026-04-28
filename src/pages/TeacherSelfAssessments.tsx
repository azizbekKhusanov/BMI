import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, Star, MessageSquare, TrendingUp,
  Search, Filter, ChevronRight, Target, Activity,
  Sparkles, MessageCircle, Calendar, RefreshCcw, Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="max-w-7xl mx-auto py-10 px-6 lg:px-12 space-y-12 animate-fade-in">
        
        {/* Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <Brain className="h-6 w-6" />
                 </div>
                 <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 bg-white">
                    Metacognitive Insights
                 </Badge>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 uppercase italic tracking-tight leading-none">
                 Self-Assessment <span className="text-primary">Tahlili</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-lg max-w-2xl leading-relaxed">
                 Talabalarning o'z o'rganish jarayoniga bergan baholari va chuqur refleksiyalarini ko'rib chiqing.
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={fetchAssessments}
                className="h-16 w-16 rounded-[2rem] border-slate-100 shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                <RefreshCcw className={`h-6 w-6 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                 <Input 
                   placeholder="Talaba yoki dars nomi..." 
                   className="h-16 pl-16 pr-10 rounded-[2rem] border-none bg-white shadow-2xl w-full lg:w-[350px] font-bold text-slate-700 placeholder:text-slate-300"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </div>

        {/* Assessments List */}
        <div className="grid gap-10">
           <AnimatePresence mode="popLayout">
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-[4rem]" />)
              ) : filteredAssessments.length > 0 ? (
                filteredAssessments.map((a, index) => {
                  const [q1, q2, q3] = parseReflection(a.reflection);
                  const calibration = a.predicted_score !== null && a.actual_score !== null
                    ? Math.abs(a.predicted_score - a.actual_score)
                    : null;

                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="border-none shadow-xl hover:shadow-2xl bg-white rounded-[4rem] overflow-hidden transition-all duration-700 relative group">
                        <div className="absolute top-0 left-0 w-4 h-full bg-slate-50 group-hover:bg-primary transition-all duration-700" />
                        <CardContent className="p-10 lg:p-14">
                          <div className="flex flex-col lg:flex-row gap-16">
                            {/* Left: Profile & Calibration */}
                            <div className="lg:w-1/4 space-y-10 border-b lg:border-b-0 lg:border-r border-slate-50 pb-10 lg:pb-0 lg:pr-16 shrink-0">
                               <div className="flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
                                  <Avatar className="h-28 w-28 rounded-[2.5rem] border-8 border-slate-50 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                     <AvatarImage src={a.profiles.avatar_url || ""} />
                                     <AvatarFallback className="bg-primary text-white text-2xl font-black">{a.profiles.full_name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-2">
                                     <h4 className="font-black text-2xl text-slate-900 uppercase italic tracking-tight">{a.profiles.full_name}</h4>
                                     <div className="flex items-center justify-center lg:justify-start gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest italic">
                                        <Calendar className="h-3.5 w-3.5" /> {new Date(a.created_at).toLocaleDateString('uz-UZ')}
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-6">
                                  <div className="space-y-3">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Talaba Bahosi</p>
                                     <div className="flex items-center gap-2">
                                        {Array(5).fill(0).map((_, i) => (
                                          <Star key={i} className={`h-4 w-4 ${i < a.rating ? "text-amber-400 fill-amber-400" : "text-slate-100"}`} />
                                        ))}
                                        <span className="text-sm font-black text-slate-900 ml-2 italic">{a.rating}/5</span>
                                     </div>
                                  </div>

                                  {calibration !== null && (
                                    <div className="space-y-3">
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Calibration (Aniqlik)</p>
                                       <Badge className={`rounded-xl px-5 py-2.5 border-none font-black text-[10px] uppercase tracking-widest shadow-lg ${calibration === 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : calibration <= 1 ? 'bg-primary text-white shadow-primary/20' : 'bg-rose-500 text-white shadow-rose-200'}`}>
                                          {calibration === 0 ? "Perfect Match" : calibration <= 1 ? "Good Calibration" : "High Gap"}
                                       </Badge>
                                    </div>
                                  )}
                               </div>
                            </div>

                            {/* Right: Reflection Content */}
                            <div className="flex-1 space-y-12">
                               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                  <div className="space-y-2">
                                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">{a.lessons.courses.title}</p>
                                     <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">
                                        {a.lessons.title} <ChevronRight className="h-6 w-6 text-slate-100" />
                                     </h3>
                                  </div>
                                  <Badge className="bg-slate-900 text-white rounded-2xl px-6 py-3 font-black text-[10px] uppercase tracking-widest italic border-none shadow-xl self-start lg:self-center">Tahliliy Refleksiya</Badge>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  {[
                                    { q: "Qiyinchiliklar", v: q1, icon: Target, color: "text-rose-500 bg-rose-50" },
                                    { q: "Sabablar", v: q2, icon: Activity, color: "text-primary bg-primary/5" },
                                    { q: "Kelgusi reja", v: q3, icon: TrendingUp, color: "text-emerald-500 bg-emerald-50" }
                                  ].map((box, idx) => (
                                    <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-50 space-y-6 hover:bg-white hover:shadow-2xl transition-all duration-500 group/box">
                                      <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-2xl ${box.color} flex items-center justify-center shadow-inner group-hover/box:scale-110 transition-transform`}>
                                          <box.icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">{box.q}</span>
                                      </div>
                                      <p className="text-base text-slate-600 font-medium leading-relaxed italic group-hover/box:text-slate-900 transition-colors">
                                         "{box.v || "Talaba fikr bildirmadi"}"
                                      </p>
                                    </div>
                                  ))}
                               </div>

                               <div className="p-10 rounded-[3rem] bg-slate-900 text-white flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group/chat">
                                  <div className="absolute top-0 right-0 h-40 w-40 bg-primary/20 rounded-full blur-3xl -translate-y-20 translate-x-10" />
                                  <div className="flex items-center gap-6 relative z-10">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 backdrop-blur-xl flex items-center justify-center text-primary shadow-2xl group-hover/chat:scale-110 transition-transform duration-500">
                                      <MessageSquare className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                       <p className="text-xl font-black uppercase italic tracking-tight">Talaba bilan bog'lanish</p>
                                       <p className="text-slate-400 font-medium italic text-sm">Refleksiya bo'yicha shaxsiy tavsiyalar bering.</p>
                                    </div>
                                  </div>
                                  <Button className="w-full lg:w-auto bg-white text-slate-900 hover:bg-primary hover:text-white font-black text-xs uppercase tracking-widest px-10 h-16 rounded-[1.5rem] shadow-2xl transition-all relative z-10">
                                     Chatni Boshlash <Sparkles className="h-4 w-4 ml-3" />
                                  </Button>
                               </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-40 bg-white rounded-[5rem] shadow-2xl border border-slate-50 flex flex-col items-center gap-10"
                >
                   <div className="h-32 w-32 rounded-[3.5rem] bg-slate-50 flex items-center justify-center text-slate-200 relative">
                      <div className="absolute inset-0 bg-primary/5 rounded-[3.5rem] animate-pulse" />
                      <Brain className="h-16 w-16 relative z-10" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Ma'lumotlar topilmadi</h3>
                      <p className="text-slate-400 font-medium italic text-lg max-w-md mx-auto leading-relaxed">
                         Hozircha hech qanday talaba refleksiya yubormagan yoki qidiruvingiz bo'yicha natija yo'q.
                      </p>
                   </div>
                   <Button onClick={() => setSearchTerm("")} variant="link" className="text-primary font-black uppercase text-xs tracking-[0.3em] hover:scale-105 transition-transform">Reset Filters</Button>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
  );
};

export default TeacherSelfAssessments;
