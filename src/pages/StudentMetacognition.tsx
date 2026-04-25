import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, TrendingUp, Zap, Target, MessageSquare, 
  Sparkles, Activity, PieChart, Lightbulb, ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const StudentMetacognition = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating AI analysis fetch
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const AnalysisCard = ({ title, value, desc, icon: Icon, color }: any) => (
    <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden hover:shadow-2xl transition-all duration-500 group">
      <CardContent className="p-8">
        <div className="flex items-start justify-between gap-4">
          <div className={`h-16 w-16 rounded-2xl ${color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 font-serif">{value}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header */}
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-12 lg:p-20 text-white shadow-2xl">
           <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[100px]" />
           </div>
           <div className="relative z-10 max-w-4xl space-y-8">
              <div className="flex items-center gap-3">
                 <Badge className="bg-white/10 text-indigo-300 border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">AI Tahlil Tizimi</Badge>
                 <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aktiv Monitoring</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold font-serif leading-tight tracking-tight uppercase">
                Metakognitiv <br /> <span className="text-indigo-400">Analitika</span>
              </h1>
              <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed max-w-2xl">
                Hurmatli {profile?.full_name || "Talaba"}, AI tizimimiz sizning o'rganish xulq-atvoringizni tahlil qilib, metakognitiv ko'nikmalaringizni shakllantirmoqda.
              </p>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <AnalysisCard 
             title="Diqqat Indeksi" 
             value="84%" 
             desc="Video darslarni ko'rishdagi faollik darajasi." 
             icon={Activity} 
             color="bg-indigo-500" 
           />
           <AnalysisCard 
             title="Mustaqil Tahlil" 
             value="High" 
             desc="Refleksiya savollariga berilgan javoblar sifati." 
             icon={Brain} 
             color="bg-purple-500" 
           />
           <AnalysisCard 
             title="Tezlik" 
             value="1.2x" 
             desc="Siz uchun eng qulay o'zlashtirish tezligi." 
             icon={Zap} 
             color="bg-amber-500" 
           />
           <AnalysisCard 
             title="Natija Trendi" 
             value="+12%" 
             desc="O'tgan haftaga nisbatan o'sish ko'rsatkichi." 
             icon={TrendingUp} 
             color="bg-emerald-500" 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           {/* Detailed AI Insights */}
           <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Sparkles className="h-5 w-5" />
                 </div>
                 <h2 className="text-3xl font-bold font-serif text-slate-800 uppercase tracking-tight">AI Insights & Tavsiyalar</h2>
              </div>

              <div className="space-y-6">
                 {[
                   {
                     title: "Mavzu o'zlashtirish tahlili",
                     desc: "C++ darslarida 'Massivlar' bo'limida videoni 2 marta qayta ko'rgansiz. AI buni ushbu mavzu siz uchun murakkabroq ekanini bildiradi.",
                     tag: "TAVSIYA",
                     color: "text-amber-600 bg-amber-50"
                   },
                   {
                     title: "O'rganish vaqti optimalligi",
                     desc: "Sizning eng yuqori natijalaringiz kechki soat 20:00 - 22:00 oralig'ida qayd etilmoqda. Muhim testlarni shu vaqtda topshirish tavsiya etiladi.",
                     tag: "INFO",
                     color: "text-blue-600 bg-blue-50"
                   },
                   {
                     title: "Diqqatni jamlash",
                     desc: "Oxirgi darsda videoni tez-tez to'xtatganingiz kuzatildi. AI bu vaqtda chalg'iyotganingizni yoki mavzu og'ir ekanini taxmin qilmoqda.",
                     tag: "DIQQAT",
                     color: "text-rose-600 bg-rose-50"
                   }
                 ].map((insight, idx) => (
                   <Card key={idx} className="border-none shadow-sm rounded-3xl bg-white hover:shadow-md transition-all group overflow-hidden">
                      <CardContent className="p-8 flex items-start gap-6">
                         <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Lightbulb className="h-6 w-6" />
                         </div>
                         <div className="space-y-3 flex-1">
                            <div className="flex items-center justify-between">
                               <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{insight.title}</h4>
                               <Badge className={`${insight.color} border-none font-black text-[9px] tracking-[0.2em] px-3 py-1`}>{insight.tag}</Badge>
                            </div>
                            <p className="text-slate-500 leading-relaxed text-sm">{insight.desc}</p>
                            <Button variant="ghost" className="p-0 h-auto text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:bg-transparent group/link">
                               Batafsil ko'rish <ArrowUpRight className="h-3 w-3 ml-1 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </Button>
                         </div>
                      </CardContent>
                   </Card>
                 ))}
              </div>
           </div>

           {/* Metacognitive Skills Radar/Pie Chart Mockup */}
           <div className="space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <PieChart className="h-5 w-5" />
                 </div>
                 <h2 className="text-2xl font-bold font-serif text-slate-800 uppercase tracking-tight">Ko'nikmalar</h2>
              </div>

              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 space-y-10">
                 <div className="space-y-6">
                    {[
                      { label: "O'z-o'zini nazorat", value: 75, color: "bg-indigo-500" },
                      { label: "Xatolar ustida ishlash", value: 90, color: "bg-emerald-500" },
                      { label: "Strategik rejalashtirish", value: 60, color: "bg-amber-500" },
                      { label: "Axborotni saralash", value: 85, color: "bg-purple-500" }
                    ].map((skill, idx) => (
                      <div key={idx} className="space-y-3">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>{skill.label}</span>
                            <span>{skill.value}%</span>
                         </div>
                         <Progress value={skill.value} className={`h-2 bg-slate-100 ${skill.color}`} />
                      </div>
                    ))}
                 </div>

                 <div className="p-8 rounded-3xl bg-indigo-50 space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600">
                       <Zap className="h-5 w-5" />
                       <span className="text-xs font-black uppercase tracking-widest">Super Tavsiya</span>
                    </div>
                    <p className="text-indigo-900/70 text-xs font-medium leading-relaxed italic">
                      "Sizning xatolar ustida ishlash qobiliyatingiz juda yuqori. Bu sizga murakkab algoritmlarni tezroq o'zlashtirishga yordam beradi."
                    </p>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentMetacognition;
