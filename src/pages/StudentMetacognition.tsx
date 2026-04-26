import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, TrendingUp, Zap, Target, ArrowUpRight, 
  Activity, Lightbulb, Clock, CheckCircle2, ChevronRight 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Insight {
  title: string;
  tag: string;
  desc: string;
  color: string;
}

interface MetacognitiveStats {
  accuracy: number;
  reflectionDepth: string;
  learningSpeed: string;
  trend: number;
}

const StudentMetacognition = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<MetacognitiveStats>({
    accuracy: 0,
    reflectionDepth: "Tahlil qilinmoqda",
    learningSpeed: "1.0x",
    trend: 0
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetacognitiveData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: assessments, error } = await supabase
          .from("self_assessments")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        if (assessments && assessments.length > 0) {
          // Calibration tahlili (Predicted vs Actual)
          let totalGap = 0;
          let count = 0;

          (assessments as unknown as { predicted_score: number | null; actual_score: number | null }[]).forEach((a) => {
            if (a.predicted_score !== null && a.actual_score !== null) {
              totalGap += Math.abs(a.predicted_score - a.actual_score);
              count++;
            }
          });

          const avgGap = count > 0 ? totalGap / count : 0;
          const accuracy = Math.round(Math.max(0, 100 - (avgGap * 20)));

          setStats({
            accuracy,
            reflectionDepth: assessments.length > 3 ? "Yuqori" : "O'rta",
            learningSpeed: "1.2x",
            trend: 12
          });

          // AI Insights generator
          const generatedInsights: Insight[] = [
            {
              title: "Kalibratsiya darajasi",
              tag: accuracy > 80 ? "MUKAMMAL" : "YAXSHILASH KERAK",
              desc: accuracy > 80 
                ? "Siz o'z bilimingizni juda aniq baholayapsiz. Bu metakognitiv mahoratning yuqori darajasi." 
                : "Siz o'z bilimingizga biroz yuqori baho beryapsiz. Darsdan oldin maqsadlarni aniqroq qo'yishga harakat qiling.",
              color: accuracy > 80 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            },
            {
              title: "Refleksiya odati",
              tag: "DAVOMIYLIK",
              desc: "Oxirgi 3 ta darsda muntazam refleksiya yozdingiz. Bu sizning tahliliy fikrlashingizni oshiradi.",
              color: "bg-indigo-50 text-indigo-600"
            }
          ];
          setInsights(generatedInsights);
        }
      } catch (err) {
        console.error("Metacognitive fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetacognitiveData();
  }, [user]);

  const StatBox = ({ title, value, icon: Icon, color, trend }: { title: string; value: string; icon: React.ElementType; color: string; trend?: number }) => (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
      <CardContent className="p-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-7 w-7" />
          </div>
          {trend && (
            <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest">
              +{trend}%
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 font-serif">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50">
           <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Brain className="h-6 w-6" />
                 </div>
                 <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic">Metacognitive Dashboard</Badge>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold font-serif text-slate-800 uppercase tracking-tight">Raqamli Metakognitsiya</h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg">O'z o'rganish jarayoningizni AI yordamida tahlil qiling va strategiyangizni yaxshilang.</p>
           </div>
           
           <div className="flex gap-4">
              <Button className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-2xl">Yangi Tahlil</Button>
           </div>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <StatBox title="Metakognitiv Aniqlik" value={`${stats.accuracy}%`} icon={Zap} color="bg-amber-500" trend={stats.trend} />
           <StatBox title="Refleksiya Chuqurligi" value={stats.reflectionDepth} icon={Brain} color="bg-indigo-600" />
           <StatBox title="O'rganish Tezligi" value={stats.learningSpeed} icon={Activity} color="bg-purple-600" />
           <StatBox title="Maqsadlarga Erishish" value="8/10" icon={Target} color="bg-rose-500" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Calibration Analysis Chart Area */}
           <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden">
              <CardHeader className="p-12 pb-6 flex flex-row items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold font-serif uppercase text-slate-800">Kalibratsiya Tahlili</CardTitle>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sizning taxminingiz va haqiqiy natija o'rtasidagi farq</p>
                 </div>
                 <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><TrendingUp className="h-6 w-6" /></div>
              </CardHeader>
              <CardContent className="p-12 pt-6">
                 <div className="h-[300px] w-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px]" />
                    <div className="text-center space-y-4 relative z-10">
                       <Progress value={stats.accuracy} className="w-64 h-3 mx-auto bg-indigo-100" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Hozirgi holat: {stats.accuracy}% Aniqlik</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* AI Insights List */}
           <div className="space-y-8">
              <div className="flex items-center gap-4 px-2">
                 <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Lightbulb className="h-5 w-5" />
                 </div>
                 <h2 className="text-2xl font-bold font-serif text-slate-800 uppercase tracking-tight">AI Insights</h2>
              </div>

              <div className="space-y-6">
                 {insights.map((insight, idx) => (
                    <Card key={idx} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden border border-slate-50">
                       <CardContent className="p-8">
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                                <Badge className={`${insight.color} border-none font-black text-[9px] tracking-widest px-3 py-1 rounded-full`}>{insight.tag}</Badge>
                                <ChevronRight className="h-4 w-4 text-slate-300" />
                             </div>
                             <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{insight.title}</h4>
                             <p className="text-slate-500 leading-relaxed text-sm font-medium">{insight.desc}</p>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
                 {insights.length === 0 && !loading && (
                    <p className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">Ma'lumotlar yetarli emas</p>
                 )}
              </div>
           </div>

        </div>
      </div>
    </Layout>
  );
};

export default StudentMetacognition;
