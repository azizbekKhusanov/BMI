import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, Users, Brain, Zap, AlertTriangle, 
  ArrowUpRight, Clock, CheckCircle2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface MonitoringData {
  id: string;
  user_name: string;
  lesson_title: string;
  predicted: number;
  actual: number;
  gap: number;
  time: string;
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
          profiles (full_name),
          lessons (title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (assessments) {
        const formatted = (assessments as unknown as { id: string; profiles: { full_name: string } | null; lessons: { title: string } | null; predicted_score: number; actual_score: number; created_at: string }[]).map((a) => ({
          id: a.id,
          user_name: a.profiles?.full_name || "Noma'lum",
          lesson_title: a.lessons?.title || "Mavzu topilmadi",
          predicted: a.predicted_score || 0,
          actual: a.actual_score || 0,
          gap: Math.abs((a.predicted_score || 0) - (a.actual_score || 0)),
          time: new Date(a.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
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

  const StatsCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: string; icon: React.ElementType; color: string; trend?: string }) => (
    <Card className="border-none shadow-lg rounded-[2rem] overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-full text-[10px] font-black tracking-widest">
              {trend}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 font-serif">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
               <Badge className="bg-indigo-600 text-white border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Live Monitor</Badge>
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold font-serif tracking-tight text-slate-800 uppercase">Progress Monitoring</h1>
            <p className="text-slate-400 font-medium">Talabalarning metakognitiv jarayonini real vaqtda kuzatish.</p>
          </div>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <Users className="h-10 w-10 text-indigo-500" />
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hozir faol</p>
               <p className="text-xl font-bold text-slate-800">12 ta talaba</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="O'rtacha Aniqlik" 
            value="84%" 
            icon={Zap} 
            color="bg-amber-500" 
            trend="+5%"
          />
          <StatsCard 
            title="Refleksiya Chuqurligi" 
            value="O'rta" 
            icon={Brain} 
            color="bg-purple-500"
          />
          <StatsCard 
            title="Kritik Xatolar" 
            value="2 ta" 
            icon={AlertTriangle} 
            color="bg-red-500"
            trend="DIQQAT!"
          />
        </div>

        {/* Monitoring Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 p-8 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold font-serif uppercase tracking-tight flex items-center gap-3">
                  <Activity className="h-5 w-5 text-emerald-400" /> Oxirgi harakatlar
                </CardTitle>
                <Badge className="bg-white/10 text-emerald-400 border-none font-black text-[9px] tracking-widest px-4">LIVE UPDATE</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Talaba</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Dars</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tahlil (Calibration)</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.map((item) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={item.id} 
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-white group-hover:shadow-md transition-all">
                              {item.user_name[0]}
                            </div>
                            <span className="text-sm font-bold text-slate-700">{item.user_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-slate-500">{item.lesson_title}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col items-center gap-2">
                             <div className="flex items-center gap-3 text-[11px] font-bold">
                               <span className="text-indigo-400">P: {item.predicted}</span>
                               <span className="h-1 w-1 rounded-full bg-slate-300" />
                               <span className="text-emerald-500">A: {item.actual}</span>
                             </div>
                             <div className="w-24">
                                <Progress value={Math.max(0, 100 - (item.gap * 20))} className="h-1.5" />
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 text-slate-400 font-black text-[10px]">
                            <Clock className="h-3 w-3" /> {item.time}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {data.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                          Hali hech qanday harakat qayd etilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Critical Metacognitive Gaps */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-bold font-serif text-slate-800 uppercase">Kritik Uzilishlar</h2>
            </div>
            
            {data.filter(i => i.gap > 1).map((item) => (
              <Card key={item.id} className="border-none shadow-lg rounded-3xl bg-red-50/50 border border-red-100 overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-red-500 text-white border-none font-black text-[9px] tracking-widest">DIQQAT!</Badge>
                    <span className="text-[10px] font-bold text-red-400">{item.time}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    <span className="font-bold text-red-600">{item.user_name}</span> o'z bilimiga juda yuqori baho berdi ({item.predicted}/5), lekin natija past bo'ldi ({item.actual}/5).
                  </p>
                  <Button variant="outline" className="w-full rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-[10px] uppercase tracking-widest h-12">
                    Maslahat yuborish <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
            {data.filter(i => i.gap > 1).length === 0 && (
              <div className="p-10 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Hozircha kritik metakognitiv uzilishlar kuzatilmadi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherMonitoring;
