import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, Users, Brain, Zap, AlertTriangle, 
  ArrowUpRight, Clock, CheckCircle2, Sparkles,
  MessageCircle, Info, ChevronRight, Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface MonitoringData {
  id: string;
  user_name: string;
  lesson_title: string;
  predicted: number;
  actual: number;
  gap: number;
  time: string;
  avatar_url?: string;
}

const TeacherMonitoring = () => {
  const [data, setData] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMonitoring = useCallback(async () => {
    try {
      const { data: assessments, error } = await supabase
        .from("self_assessments")
        .select(`
          id,
          predicted_score,
          actual_score,
          created_at,
          profiles (full_name, avatar_url),
          lessons (title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (assessments) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formatted = (assessments as any).map((a: any) => ({
          id: a.id,
          user_name: a.profiles?.full_name || "Noma'lum",
          lesson_title: a.lessons?.title || "Mavzu topilmadi",
          predicted: a.predicted_score || 0,
          actual: a.actual_score || 0,
          gap: Math.abs((a.predicted_score || 0) - (a.actual_score || 0)),
          time: new Date(a.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          avatar_url: a.profiles?.avatar_url
        }));
        setData(formatted);
      }
    } catch (err) {
      console.error("Monitoring fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoring();
    const channel = supabase
      .channel('monitoring_updates')
      .on('postgres_changes' as never, { event: 'INSERT', table: 'self_assessments' } as unknown as never, fetchMonitoring)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonitoring]);

  const StatsCard = ({ title, value, icon: Icon, color, trend, bg }: { title: string; value: string; icon: React.ElementType; color: string; trend?: string; bg: string }) => (
    <Card className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white group hover:shadow-2xl transition-all duration-700">
      <CardContent className="p-10 relative">
        <div className={`absolute top-0 right-0 h-32 w-32 ${bg} rounded-full -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform duration-700`} />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className={`h-14 w-14 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              <Icon className="h-7 w-7" />
            </div>
            {trend && (
              <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest italic">
                {trend}
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{title}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
      <div className="max-w-7xl mx-auto py-10 px-6 lg:px-12 space-y-12 animate-fade-in">
        
        {/* Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/40 backdrop-blur-xl p-10 rounded-[4rem] shadow-2xl border border-white/50 relative overflow-hidden">
           <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full blur-3xl -translate-y-32 translate-x-32" />
           <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                 <Badge className="bg-primary text-white border-none px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                    Live Monitor
                 </Badge>
                 <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Real-time Sync Active</span>
                 </div>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                 Progress <span className="text-primary">Monitoring</span>
              </h1>
              <p className="text-slate-400 font-medium italic text-lg max-w-xl leading-relaxed">
                 O'quvchilarning metakognitiv jarayonini va darslardagi faolligini real vaqt rejimida boshqarish markazi.
              </p>
           </div>
           
           <div className="flex items-center gap-6 bg-white shadow-2xl p-8 rounded-[2.5rem] border border-slate-50 relative z-10">
              <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center">
                 <Users className="h-8 w-8" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2 italic">Hozirda Faol</p>
                 <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">12 <span className="text-sm text-slate-300 font-medium italic">Talaba</span></p>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatsCard 
            title="O'rtacha Aniqlik" 
            value="84%" 
            icon={Zap} 
            color="text-amber-500" 
            bg="bg-amber-50"
            trend="+5% vs Last Week"
          />
          <StatsCard 
            title="Refleksiya Chuqurligi" 
            value="O'rta" 
            icon={Brain} 
            color="text-primary"
            bg="bg-primary/5"
            trend="Improving"
          />
          <StatsCard 
            title="Kritik Xatolar" 
            value="2 ta" 
            icon={AlertTriangle} 
            color="text-rose-500"
            bg="bg-rose-50"
            trend="Attention Required"
          />
        </div>

        {/* Monitoring Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Activity Table */}
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden border border-white">
            <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-4">
                     <Activity className="h-6 w-6 text-emerald-400" /> Oxirgi Harakatlar
                  </h3>
                  <p className="text-slate-400 font-medium italic text-xs">Oxirgi 10 ta metakognitiv baholash natijalari.</p>
               </div>
               <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] tracking-[0.2em] px-5 py-2 shadow-lg shadow-emerald-500/20">LIVE</Badge>
            </div>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Talaba</th>
                      <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Darslik</th>
                      <th className="px-10 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Calibration</th>
                      <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <AnimatePresence mode="popLayout">
                       {data.map((item, idx) => (
                         <motion.tr 
                           layout
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.05 }}
                           key={item.id} 
                           className="hover:bg-primary/5 transition-all duration-500 group"
                         >
                           <td className="px-10 py-8">
                             <div className="flex items-center gap-4">
                               <Avatar className="h-12 w-12 rounded-2xl shadow-xl border-4 border-white group-hover:scale-110 transition-transform duration-500">
                                  <AvatarImage src={item.avatar_url} />
                                  <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xs uppercase">{item.user_name.substring(0,2)}</AvatarFallback>
                               </Avatar>
                               <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{item.user_name}</span>
                             </div>
                           </td>
                           <td className="px-10 py-8">
                              <div className="space-y-1">
                                 <p className="text-xs font-bold text-slate-600 line-clamp-1">{item.lesson_title}</p>
                                 <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400">Lesson Topic</Badge>
                              </div>
                           </td>
                           <td className="px-10 py-8">
                             <div className="flex flex-col items-center gap-3">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-center">
                                     <span className="text-[9px] font-black text-slate-300 uppercase italic">Pred</span>
                                     <span className="text-sm font-black text-primary italic">{item.predicted}</span>
                                  </div>
                                  <div className="h-8 w-[1px] bg-slate-100" />
                                  <div className="flex flex-col items-center">
                                     <span className="text-[9px] font-black text-slate-300 uppercase italic">Actu</span>
                                     <span className="text-sm font-black text-emerald-500 italic">{item.actual}</span>
                                  </div>
                                </div>
                                <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                                   <motion.div 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${Math.max(10, 100 - (item.gap * 20))}%` }}
                                     className={`h-full ${item.gap > 1 ? 'bg-rose-500' : 'bg-primary'}`} 
                                   />
                                </div>
                             </div>
                           </td>
                           <td className="px-10 py-8 text-right">
                             <div className="flex items-center justify-end gap-3 text-slate-400 font-black text-[10px] italic">
                               <Clock className="h-4 w-4 text-primary/50" /> {item.time}
                             </div>
                           </td>
                         </motion.tr>
                       ))}
                    </AnimatePresence>
                    
                    {data.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="py-32 text-center">
                           <div className="flex flex-col items-center gap-6">
                              <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
                                 <Monitor className="h-12 w-12" />
                              </div>
                              <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic">Hali hech qanday harakat qayd etilmadi</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Critical Gaps Sidebar */}
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
               <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight flex items-center gap-4">
                  <AlertTriangle className="h-6 w-6 text-rose-500" /> Kritik Uzilishlar
               </h2>
               <Badge className="bg-rose-50 text-rose-500 border-none font-black text-[9px] uppercase px-3 py-1">Priority</Badge>
            </div>
            
            <AnimatePresence mode="popLayout">
              {data.filter(i => i.gap > 1).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-none shadow-2xl rounded-[3rem] bg-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border border-rose-50">
                    <div className="absolute top-0 left-0 h-full w-2 bg-rose-500" />
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 rounded-xl">
                               <AvatarImage src={item.avatar_url} />
                               <AvatarFallback className="bg-rose-50 text-rose-500 font-black text-[10px]">{item.user_name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-black text-slate-900 uppercase italic">{item.user_name}</span>
                         </div>
                         <span className="text-[10px] font-black text-slate-300 italic">{item.time}</span>
                      </div>
                      
                      <div className="space-y-3">
                         <p className="text-sm text-slate-500 font-medium italic leading-relaxed">
                            Ushbu talaba o'z bilimiga <span className="text-rose-500 font-black">YUQORI</span> baho berdi ({item.predicted}), lekin natija <span className="text-rose-500 font-black">PAST</span> bo'ldi ({item.actual}).
                         </p>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                         <Button className="flex-1 h-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest gap-2 shadow-xl hover:bg-primary transition-all">
                            Yordam Berish <MessageCircle className="h-3 w-3" />
                         </Button>
                         <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-50 transition-all">
                            <Info className="h-4 w-4 text-slate-400" />
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {data.filter(i => i.gap > 1).length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center bg-white rounded-[3rem] shadow-xl border border-slate-50 flex flex-col items-center gap-6"
              >
                <div className="h-20 w-20 rounded-[2rem] bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                   <CheckCircle2 className="h-10 w-10" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed italic">
                  Hozircha kritik metakognitiv uzilishlar kuzatilmadi. Barcha talabalar o'z bilimini to'g'ri baholamoqda.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
  );
};

export default TeacherMonitoring;
