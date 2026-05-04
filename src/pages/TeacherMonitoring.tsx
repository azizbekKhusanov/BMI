import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, Users, Brain, Zap, AlertTriangle, 
  Clock, CheckCircle2, MessageCircle, Info, Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface MonitoringData {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  lesson_title: string;
  predicted: number;
  actual: number;
  gap: number;
  rating: number;
  reflection: string | null;
  time: string;
  created_at: string;
}

interface StatsData {
  totalStudents: number;
  avgCalibration: number;
  criticalCount: number;
  reflectionCount: number;
}

const TeacherMonitoring = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "reflections">("activity");
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    avgCalibration: 0,
    criticalCount: 0,
    reflectionCount: 0
  });

  const fetchMonitoring = useCallback(async () => {
    try {
      // 1 — self_assessments dan real ma'lumot
      const { data: assessments, error } = await supabase
        .from("self_assessments")
        .select(`
          id,
          user_id,
          predicted_score,
          actual_score,
          rating,
          reflection,
          created_at,
          profiles (full_name, avatar_url),
          lessons (title)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formatted = ((assessments || []) as any[]).map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        user_name: a.profiles?.full_name || "Noma'lum",
        avatar_url: a.profiles?.avatar_url,
        lesson_title: a.lessons?.title || "Mavzu topilmadi",
        predicted: a.predicted_score || 0,
        actual: a.actual_score || 0,
        gap: Math.abs((a.predicted_score || 0) - (a.actual_score || 0)),
        rating: a.rating || 0,
        reflection: a.reflection,
        time: new Date(a.created_at).toLocaleTimeString('uz-UZ', {
          hour: '2-digit', minute: '2-digit'
        }),
        created_at: a.created_at
      }));

      setData(formatted);

      // 2 — Statistikani hisoblash
      const uniqueUsers = new Set(formatted.map(f => f.user_id)).size;
      const calibrations = formatted.filter(
        f => f.predicted > 0 && f.actual > 0
      );
      const avgCalib = calibrations.length > 0
        ? Math.round(
            calibrations.reduce((sum, f) => {
              // Kalibrlash: taxmin va haqiqiy orasidagi farq qanchalik kichik
              const accuracy = Math.max(0, 100 - (f.gap * 20));
              return sum + accuracy;
            }, 0) / calibrations.length
          )
        : 0;
      const criticals = formatted.filter(f => f.gap > 1).length;
      const withReflection = formatted.filter(
        f => f.reflection && f.reflection.trim().length > 10
      ).length;

      setStats({
        totalStudents: uniqueUsers,
        avgCalibration: avgCalib,
        criticalCount: criticals,
        reflectionCount: withReflection
      });

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
      .on(
        'postgres_changes' as any, 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'self_assessments' 
        }, 
        () => {
          fetchMonitoring();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonitoring]);

  const StatsCard = ({ title, value, icon: Icon, color, trend, bg }: { title: string; value: string; icon: React.ElementType; color: string; trend?: string; bg: string }) => (
    <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
      <CardContent className="p-6 relative">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className={`h-12 w-12 rounded-lg ${bg} ${color} flex items-center justify-center`}>
              <Icon className="h-6 w-6" />
            </div>
            {trend && (
              <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide">
                {trend}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 leading-none">{value}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
      <div className="max-w-full mx-auto py-8 px-6 lg:px-8 space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                 <Badge className="bg-[#0056d2] text-white border-none px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide">
                    Jonli monitoring
                 </Badge>
                 <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Real vaqt sinxronizatsiyasi</span>
                 </div>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                 Jarayon monitoringi
              </h1>
              <p className="text-slate-500 font-medium text-sm max-w-xl">
                 O'quvchilarning metakognitiv jarayonini va darslardagi faolligini real vaqt rejimida boshqarish markazi.
              </p>
           </div>
           
           <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 text-[#0056d2] flex items-center justify-center">
                 <Users className="h-6 w-6" />
              </div>
              <div>
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hozirda faol</p>
                 <p className="text-2xl font-bold text-slate-900 leading-none">
                    {stats.totalStudents}
                    <span className="text-xs text-slate-400 font-medium ml-1">Talaba</span>
                 </p>
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Faol talabalar"
            value={`${stats.totalStudents} ta`}
            icon={Users}
            color="text-[#0056d2]"
            bg="bg-blue-50"
          />
          <StatsCard
            title="O'rtacha kalibrlash"
            value={stats.avgCalibration > 0 ? `${stats.avgCalibration}%` : "—"}
            icon={Activity}
            color="text-amber-500"
            bg="bg-amber-50"
            trend={
              stats.avgCalibration >= 70 ? "Yaxshi" :
              stats.avgCalibration >= 50 ? "O'rta" : "Past"
            }
          />
          <StatsCard
            title="Kritik uzilishlar"
            value={`${stats.criticalCount} ta`}
            icon={AlertTriangle}
            color="text-rose-500"
            bg="bg-rose-50"
            trend={stats.criticalCount > 0 ? "Diqqat talab etadi" : undefined}
          />
          <StatsCard
            title="Refleksiya yozganlar"
            value={`${stats.reflectionCount} ta`}
            icon={Brain}
            color="text-purple-600"
            bg="bg-purple-50"
          />
        </div>

        {/* Monitoring Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Table */}
          <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-200">
               <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                     <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#0056d2]" /> Oxirgi harakatlar
                     </h3>
                     <p className="text-slate-500 font-medium text-xs">Oxirgi metakognitiv baholash natijalari.</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-semibold text-[10px] tracking-wide px-2 py-0.5">JONLI</Badge>
               </div>

               <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                 <button
                   onClick={() => setActiveTab("activity")}
                   className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-md
                               transition-all ${
                     activeTab === "activity"
                       ? "bg-white text-slate-900 shadow-sm"
                       : "text-slate-500 hover:text-slate-700"
                   }`}
                 >
                   Kalibrlash
                 </button>
                 <button
                   onClick={() => setActiveTab("reflections")}
                   className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-md
                               transition-all ${
                     activeTab === "reflections"
                       ? "bg-white text-slate-900 shadow-sm"
                       : "text-slate-500 hover:text-slate-700"
                   }`}
                 >
                   Refleksiyalar
                 </button>
               </div>
            </div>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    {activeTab === "activity" ? (
                      <tr className="bg-white border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Talaba</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Darslik</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Kalibrlash</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Vaqt</th>
                      </tr>
                    ) : (
                      <tr className="bg-white border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Talaba</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Darslik</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Refleksiya</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Vaqt</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                       {activeTab === "activity" ? (
                         data.map((item) => (
                           <tr 
                             key={item.id} 
                             className="hover:bg-slate-50 transition-colors"
                           >
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <Avatar className="h-10 w-10 border border-slate-200">
                                    <AvatarImage src={item.avatar_url} />
                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">{item.user_name.substring(0,2)}</AvatarFallback>
                                 </Avatar>
                                 <span className="text-sm font-bold text-slate-900">{item.user_name}</span>
                               </div>
                             </td>
                             <td className="px-6 py-4">
                                <div className="space-y-1">
                                   <p className="text-sm font-medium text-slate-700 line-clamp-1">{item.lesson_title}</p>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                               <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                       <span className="text-[10px] font-semibold text-slate-400 uppercase">Taxmin</span>
                                       <span className="text-sm font-bold text-[#0056d2]">{item.predicted}</span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-slate-200" />
                                    <div className="flex flex-col items-center">
                                       <span className="text-[10px] font-semibold text-slate-400 uppercase">Haqiqiy</span>
                                       <span className="text-sm font-bold text-emerald-600">{item.actual}</span>
                                    </div>
                                  </div>
                                  <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                     <div 
                                       style={{ width: `${Math.max(10, 100 - (item.gap * 20))}%` }}
                                       className={`h-full ${item.gap > 1 ? 'bg-rose-500' : 'bg-[#0056d2]'}`} 
                                     />
                                  </div>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-1.5 text-slate-500 font-medium text-xs">
                                 <Clock className="h-3.5 w-3.5" /> {item.time}
                               </div>
                             </td>
                           </tr>
                         ))
                       ) : (
                         data.filter(item => item.reflection && item.reflection.trim()).map((item) => (
                           <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <Avatar className="h-9 w-9 border border-slate-200">
                                   <AvatarImage src={item.avatar_url} />
                                   <AvatarFallback className="bg-slate-100 text-slate-600
                                                               font-bold text-xs">
                                     {item.user_name.substring(0, 2)}
                                   </AvatarFallback>
                                 </Avatar>
                                 <span className="text-sm font-bold text-slate-900">
                                   {item.user_name}
                                 </span>
                               </div>
                             </td>
                             <td className="px-6 py-4">
                               <p className="text-xs font-medium text-slate-500 mb-1">
                                 {item.lesson_title}
                               </p>
                             </td>
                             <td className="px-6 py-4 max-w-xs">
                               <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                                 "{item.reflection}"
                               </p>
                               <div className="flex items-center gap-1 mt-2">
                                 {[1,2,3,4,5].map(star => (
                                   <div
                                     key={star}
                                     className={`h-1.5 w-4 rounded-full ${
                                       star <= item.rating
                                         ? "bg-[#0056d2]"
                                         : "bg-slate-100"
                                     }`}
                                   />
                                 ))}
                                 <span className="text-[10px] text-slate-400 ml-1 font-medium">
                                   {item.rating}/5
                                 </span>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end gap-1.5
                                               text-slate-500 font-medium text-xs">
                                 <Clock className="h-3.5 w-3.5" /> {item.time}
                               </div>
                             </td>
                           </tr>
                         ))
                       )}
                    
                    {data.length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4">
                              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                 <Monitor className="h-8 w-8" />
                              </div>
                              <p className="text-sm font-medium text-slate-500">Hali hech qanday harakat qayd etilmadi</p>
                           </div>
                        </td>
                      </tr>
                    )}

                    {activeTab === "reflections" &&
                     data.filter(i => i.reflection && i.reflection.trim()).length === 0 && !loading && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-14 w-14 rounded-full bg-slate-50
                                            flex items-center justify-center text-slate-300">
                              <Brain className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">
                              Hozircha refleksiyalar yo'q
                            </p>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-rose-500" /> Kritik uzilishlar
               </h2>
               <Badge className="bg-rose-50 text-rose-600 border-none font-semibold text-[10px] uppercase px-2 py-0.5 rounded">Muhim</Badge>
            </div>
            
              {data.filter(i => i.gap > 1).map((item) => (
                  <Card key={item.id} className="border border-rose-100 shadow-sm rounded-xl bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-1 bg-rose-500" />
                    <CardContent className="p-6 space-y-4 pl-7">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 rounded-lg border border-slate-100">
                               <AvatarImage src={item.avatar_url} />
                               <AvatarFallback className="bg-rose-50 text-rose-600 font-bold text-xs">{item.user_name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-bold text-slate-900">{item.user_name}</span>
                         </div>
                         <span className="text-[10px] font-semibold text-slate-500">{item.time}</span>
                      </div>
                      
                      <div className="space-y-2">
                         <p className="text-sm text-slate-600 font-medium">
                            Ushbu talaba o'z bilimiga YUQORI baho berdi ({item.predicted}), lekin natija PAST bo'ldi ({item.actual}).
                         </p>
                      </div>

                      <div className="pt-3 flex items-center gap-2">
                         <Button
                           onClick={() => navigate("/teacher/messages")}
                           className="flex-1 h-9 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 gap-2"
                         >
                            <MessageCircle className="h-3.5 w-3.5" /> Bog'lanish
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
              ))}

            {data.filter(i => i.gap > 1).length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                   <CheckCircle2 className="h-7 w-7" />
                </div>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Hozircha kritik metakognitiv uzilishlar kuzatilmadi. Barcha talabalar o'z bilimini to'g'ri baholamoqda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default TeacherMonitoring;
