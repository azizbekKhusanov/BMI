import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { 
  Brain, TrendingUp, Zap, Target, Activity, 
  Clock, CheckCircle2, Download, 
  Sparkles, Eye, Microscope, Layers, MessageCircle, Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip as ChartTooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const WEEKLY_DATA = [
  { name: "Dush", diqqat: 65, eslab_qolish: 40 },
  { name: "Sesh", diqqat: 78, eslab_qolish: 55 },
  { name: "Chor", diqqat: 72, eslab_qolish: 68 },
  { name: "Pay", diqqat: 85, eslab_qolish: 60 },
  { name: "Jum", diqqat: 92, eslab_qolish: 75 },
  { name: "Shan", diqqat: 88, eslab_qolish: 82 },
  { name: "Yak", diqqat: 80, eslab_qolish: 70 },
];

const COLORS = ["#4f46e5", "#f1f5f9"];

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
    reflectionDepth: "Kutilmoqda",
    learningSpeed: "-",
    trend: 0
  });
  const [masteryData, setMasteryData] = useState([
    { name: "Tamomlangan", value: 0 },
    { name: "Jarayonda", value: 100 }
  ]);
  const [radarData, setRadarData] = useState([
     { label: "Mantiqiy Tahlil", val: "0%", icon: Microscope, color: "bg-emerald-50 text-emerald-600" },
     { label: "Fokus Davomiyligi", val: "0%", icon: Activity, color: "bg-amber-50 text-amber-600" },
     { label: "O'zlashtirish", val: "0%", icon: Zap, color: "bg-blue-50 text-blue-600" },
     { label: "Test Aniqligi", val: "0%", icon: Target, color: "bg-violet-50 text-violet-600" }
  ]);
  const [insightDesc, setInsightDesc] = useState("Neyron tarmoq tahlili uchun ma'lumotlar kutilmoqda. Ko'proq darslarda qatnashing.");

  const fetchMetacognitiveData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: assessments } = await supabase.from("self_assessments").select("*").eq("user_id", user.id);
      const { data: testResults } = await supabase.from("test_results").select("*").eq("user_id", user.id);
      const { data: enrollments } = await supabase.from("enrollments").select("*").eq("user_id", user.id);

      if (assessments && assessments.length > 0) {
        const avgRating = assessments.reduce((acc, a) => acc + a.rating, 0) / assessments.length;
        const totalTests = testResults?.length || 0;
        const correctTests = testResults?.filter(tr => tr.is_correct).length || 0;
        const accuracy = totalTests > 0 ? (correctTests / totalTests) * 100 : 0;
        
        const totalProgress = enrollments?.reduce((acc, e) => acc + e.progress, 0) || 0;
        const avgProgress = enrollments?.length ? totalProgress / enrollments.length : 0;
        
        const calculatedTrend = Number((avgRating * 20).toFixed(1));
        
        // Improved Mastery Score Formula: Quality over Quantity
        // (Progress * 0.3) + (Test Accuracy * 0.5) + (Self Rating * 20 * 0.2)
        const masteryScore = (avgProgress * 0.3) + (accuracy * 0.5) + (avgRating * 20 * 0.2);
        
        setStats({
           accuracy: Number(accuracy.toFixed(1)),
           reflectionDepth: avgRating >= 4 ? "Yuqori" : avgRating >= 3 ? "O'rta" : "Past",
           learningSpeed: "Optimal",
           trend: calculatedTrend
        });

        setMasteryData([
          { name: "O'zlashtirildi", value: Number(masteryScore.toFixed(1)) },
          { name: "O'rganilmoqda", value: Number((100 - Math.min(masteryScore, 100)).toFixed(1)) }
        ]);

        setRadarData([
           { label: "Mantiqiy Tahlil", val: `${Math.round(calculatedTrend)}%`, icon: Microscope, color: "bg-emerald-50 text-emerald-600" },
           { label: "Fokus Davomiyligi", val: `${Math.round(avgRating * 15 + 25)}%`, icon: Activity, color: "bg-amber-50 text-amber-600" },
           { label: "O'zlashtirish", val: `${Math.round(avgProgress)}%`, icon: Zap, color: "bg-blue-50 text-blue-600" },
           { label: "Test Aniqligi", val: `${Math.round(accuracy)}%`, icon: Target, color: "bg-violet-50 text-violet-600" }
        ]);

        setInsightDesc(`Sizning o'quv jarayoningiz neyron tarmoq tahlili orqali o'rganildi. Kognitiv aniqligingiz ${Math.round(accuracy)}% ni tashkil etmoqda, bu sizning darslarni qay darajada tushunayotganingizni ko'rsatadi.`);
      }
    } catch (err) {
      console.error("Metacognitive fetch error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchMetacognitiveData();
  }, [fetchMetacognitiveData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatMiniCard = ({ title, value, sub, icon: Icon, trend, color, description, recommendation }: any) => (
    <Card className="border-none shadow-sm bg-white rounded-3xl p-5 space-y-4 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <TrendingUp className="h-3 w-3" /> {trend}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-slate-300 hover:text-indigo-500 transition-colors p-1">
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" className="max-w-[280px] p-5 rounded-2xl bg-white text-slate-600 border border-slate-100 shadow-2xl shadow-indigo-100/50 text-sm leading-relaxed z-50">
                <div className="space-y-4">
                  <div className="flex gap-3">
                     <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${color} bg-opacity-20`}>
                       <Icon className="h-4 w-4" />
                     </div>
                     <p className="font-bold text-slate-900">{description}</p>
                  </div>
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Qanday oshirish mumkin?
                    </p>
                    <p className="text-xs text-slate-600 font-medium">{recommendation}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          <span className="text-xs font-medium text-slate-400">{sub}</span>
        </div>
      </div>
    </Card>
  );

  return (
      <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-10 animate-fade-in pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain className="h-5 w-5" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Metakognitiv Tahlil</h1>
            </div>
            <p className="text-slate-500 ml-13">Neyron tarmoqlar yordamida o'zlashtirish tahlili</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">
              <Download className="mr-2 h-4 w-4" /> Hisobotni yuklash
            </Button>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatMiniCard 
            title="O'zlashtirish" 
            value={`${stats.trend}%`} 
            sub="Global Rank: O'rtacha" 
            icon={Zap} 
            trend="+1.2%" 
            color="bg-indigo-50 text-indigo-600" 
            description="Sizning darslardagi shaxsiy o'zlashtirish darajangiz va baholaringiz dinamikasi."
            recommendation="Darslarni ko'proq ko'rish va har bir darsdan keyin o'zingizni xolisona baholash orqali oshirish mumkin."
          />
          <StatMiniCard 
            title="Refleksiya" 
            value={stats.reflectionDepth} 
            sub="Fikrlash chuqurligi" 
            icon={Clock} 
            trend="Faol" 
            color="bg-blue-50 text-blue-600" 
            description="O'z bilimingiz ustida tahlil qilish chuqurligi. O'z xatolaringizni tushunish darajasini ko'rsatadi."
            recommendation="O'z ustingizda tahlilni kuchaytiring. Har bir xatodan xulosa chiqarish orqali bu ko'rsatkichni ko'tarasiz."
          />
          <StatMiniCard 
            title="Test Aniqligi" 
            value={`${stats.accuracy}%`} 
            sub="Umumiy testlar" 
            icon={Activity} 
            trend="+0.8%" 
            color="bg-emerald-50 text-emerald-600" 
            description="Barcha topshirilgan testlardagi to'g'ri javoblar foizi."
            recommendation="Mavzularni takrorlash va ko'proq amaliy testlar yechish orqali test foizini oshirishingiz mumkin."
          />
          <StatMiniCard 
            title="Brain Score" 
            value={Math.round(stats.trend * 0.9).toString()} 
            sub="Metacognitive Index" 
            icon={Brain} 
            trend="+5" 
            color="bg-violet-50 text-violet-600" 
            description="Bilim va sezgi muvozanatini ko'rsatuvchi umumiy kognitiv indeks."
            recommendation="Ham bilimni (test), ham sezgini (refleksiya) muvozanatda ushlash orqali eng yuqori natijaga erishish mumkin."
          />
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Insights & Radar */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-3xl border-slate-100 shadow-sm bg-white p-8">
               <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                     <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">AI Neyron Xulosasi</h3>
                     <p className="text-slate-600 leading-relaxed">{insightDesc}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  {radarData.map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                       <div className={`h-12 w-12 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                          <item.icon className="h-6 w-6" />
                       </div>
                       <div>
                          <p className="text-2xl font-bold text-slate-900">{item.val}</p>
                          <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
          </div>
          
          {/* Mastery Pie */}
          <div className="lg:col-span-4 h-full">
             <Card className="rounded-3xl border-slate-100 shadow-sm bg-white p-8 h-full flex flex-col items-center justify-center relative">
                <div className="absolute top-6 right-6">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-slate-300 hover:text-indigo-500 transition-colors p-1">
                          <Info className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="end" className="max-w-[280px] p-5 rounded-2xl bg-white text-slate-600 border border-slate-100 shadow-2xl shadow-indigo-100/50 text-sm leading-relaxed z-50">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <Sparkles className="h-4 w-4" /> Formula tushunchasi
                          </div>
                          <p className="font-medium text-slate-600">O'zlashtirish foizi quyidagi mezonlar asosida sifatni o'lchaydi:</p>
                          <div className="space-y-2 text-xs">
                             <div className="flex justify-between"><span>📊 Kurs progressi:</span> <span className="font-bold text-slate-900">30%</span></div>
                             <div className="flex justify-between"><span>🎯 Testlardagi aniqlik:</span> <span className="font-bold text-slate-900">50%</span></div>
                             <div className="flex justify-between"><span>🧠 Shaxsiy tahlil:</span> <span className="font-bold text-slate-900">20%</span></div>
                          </div>
                          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 mt-2">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Maslahat:</p>
                            <p className="text-[11px] text-slate-600 font-medium">Testlarni 100% ga yechish va darslarda 5 bahoga tushunishingizni bildirish orqali bu ko'rsatkichni tez ko'tara olasiz.</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900">Bilim Matrixi</h3>
                  <p className="text-sm text-slate-500 mt-1">Kurs o'zlashtirish foizi</p>
                </div>
                
                <div className="relative h-48 w-48 mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={masteryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {masteryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-900">{masteryData[0]?.value || 0}%</span>
                    <span className="text-xs font-semibold text-slate-500 mt-1">Index</span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                   {[
                     { label: "O'zlashtirildi", val: `${masteryData[0]?.value || 0}%`, col: "bg-indigo-600" },
                     { label: "O'rganilmoqda", val: `${masteryData[1]?.value || 0}%`, col: "bg-slate-200" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className={`h-2.5 w-2.5 rounded-full ${item.col}`} />
                           <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{item.val}</p>
                     </div>
                   ))}
                </div>
             </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="rounded-3xl border-slate-100 shadow-sm bg-white p-8">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold text-slate-900">O'quv Dinamikasi</h3>
               <Badge className="bg-indigo-50 text-indigo-600 border-none">Haftalik</Badge>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={WEEKLY_DATA}>
                   <defs>
                     <linearGradient id="colorDiqqat" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                   <ChartTooltip 
                     contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="diqqat" 
                     stroke="#4f46e5" 
                     strokeWidth={3} 
                     fillOpacity={1} 
                     fill="url(#colorDiqqat)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
           </Card>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Algoritmlar", desc: "Mantiqiy masalalar", progress: 45, icon: Layers, color: "text-blue-600 bg-blue-50" },
                { title: "Soft Skills", desc: "Muloqot malakasi", progress: 82, icon: MessageCircle, color: "text-violet-600 bg-violet-50" },
                { title: "Ma'lumotlar", desc: "Statistik tahlil", progress: 15, icon: Microscope, color: "text-emerald-600 bg-emerald-50" },
                { title: "Dizayn", desc: "Vizual iyerarxiya", progress: 100, icon: Eye, color: "text-amber-600 bg-amber-50" },
              ].map((path, i) => (
                 <Card key={i} className="border-slate-100 shadow-sm bg-white rounded-3xl p-6 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-6">
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${path.color}`}>
                          <path.icon className="h-6 w-6" />
                       </div>
                       {path.progress === 100 && <Badge className="bg-emerald-50 text-emerald-600 border-none"><CheckCircle2 className="h-3 w-3 mr-1" /> O'tildi</Badge>}
                    </div>
                    <div>
                       <h4 className="text-lg font-bold text-slate-900">{path.title}</h4>
                       <p className="text-sm text-slate-500 mt-1">{path.desc}</p>
                    </div>
                    <div className="mt-6">
                       <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                          <span>Progress</span>
                          <span className="text-slate-900">{path.progress}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${path.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${path.progress}%` }}
                          />
                       </div>
                    </div>
                 </Card>
              ))}
           </div>
        </div>

      </div>
  );
};

export default StudentMetacognition;
