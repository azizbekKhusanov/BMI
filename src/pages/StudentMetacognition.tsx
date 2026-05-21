import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { 
  Brain, TrendingUp, Zap, Target, Activity, 
  Clock, CheckCircle2, FileText, 
  Sparkles, ListChecks, PieChart as PieIcon, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip
} from "recharts";

const DAYS_OF_WEEK = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

const StudentMetacognition = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    avgAccuracy: 0,
    reflectionQuality: "Kutilmoqda",
    totalProgress: 0,
    selfAwareness: 0
  });

  const [weeklyData, setWeeklyData] = useState(DAYS_OF_WEEK.map(day => ({ name: day, ball: 0 })));

  const [skills, setSkills] = useState([
    { label: "Mantiqiy tahlil", value: 0, color: "bg-blue-600" },
    { label: "Mavzuni tushunish", value: 0, color: "bg-indigo-600" },
    { label: "Xatolar ustida ishlash", value: 0, color: "bg-emerald-600" },
    { label: "O'z-o'zini nazorat qilish", value: 0, color: "bg-violet-600" }
  ]);

  const [aiReport, setAiReport] = useState("Ma'lumotlar tahlil qilinmoqda...");

  const fetchMetacognition = useCallback(async () => {
    if (!user) return;
    try {
      const { data: assessments } = await supabase.from("self_assessments").select("*").eq("user_id", user.id);
      const { data: testResults } = await supabase.from("test_results").select("*").eq("user_id", user.id);
      const { data: enrollments } = await supabase.from("enrollments").select("*").eq("user_id", user.id);

      if (testResults && testResults.length > 0) {
        // Group test results by day of week for the chart
        const dayScores: Record<string, { total: number, count: number }> = {};
        DAYS_OF_WEEK.forEach(d => dayScores[d] = { total: 0, count: 0 });

        testResults.forEach(res => {
          const date = new Date(res.created_at || new Date());
          const dayIndex = (date.getDay() + 6) % 7; // Map 0 (Sun) to 6, 1 (Mon) to 0
          const dayName = DAYS_OF_WEEK[dayIndex];
          dayScores[dayName].total += res.is_correct ? 100 : 0;
          dayScores[dayName].count += 1;
        });

        const newWeeklyData = DAYS_OF_WEEK.map(day => ({
          name: day,
          ball: dayScores[day].count > 0 ? Math.round(dayScores[day].total / dayScores[day].count) : 0
        }));
        setWeeklyData(newWeeklyData);

        const correct = testResults.filter(r => r.is_correct).length;
        const accuracy = (correct / testResults.length) * 100;
        
        const progress = enrollments?.length ? (enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length) : 0;
        const avgRating = assessments?.length ? (assessments.reduce((acc, a) => acc + a.rating, 0) / assessments.length) : 0;
        
        const ratingPercent = avgRating * 20;
        const awareness = 100 - Math.abs(ratingPercent - accuracy);

        setStats({
          avgAccuracy: Math.round(accuracy),
          reflectionQuality: avgRating >= 4 ? "A'lo" : avgRating >= 3 ? "Yaxshi" : "Qoniqarli",
          totalProgress: Math.round(progress),
          selfAwareness: Math.round(awareness)
        });

        setSkills([
          { label: "Mantiqiy tahlil", value: Math.round(accuracy * 0.9), color: "bg-blue-500" },
          { label: "Mavzuni tushunish", value: Math.round(progress), color: "bg-indigo-500" },
          { label: "Xatolar ustida ishlash", value: Math.round(avgRating * 20), color: "bg-emerald-500" },
          { label: "O'z-o'zini nazorat qilish", value: Math.round(awareness), color: "bg-violet-500" }
        ]);

        // Dynamic AI Report Generation based on data patterns
        let report = "";
        let recommendation = "";

        if (accuracy >= 80 && awareness >= 80) {
          report = `Sizda o'quv materialini o'zlashtirish va o'z bilimingizni tahlil qilish darajasi o'ta yuqori. Ma'lumotlarni qabul qilish va natijani oldindan sezish qobiliyatingiz mukammal darajada.`;
          recommendation = "Murakkabroq mavzularga o'tishingiz va o'rganganlaringizni amaliyotda qo'llashingiz tavsiya etiladi.";
        } else if (accuracy < 60 && ratingPercent > 80) {
          report = `Tahlillar shuni ko'rsatadiki, siz o'z bilimingizga biroz ortiqcha baho bermoqdasiz. Test natijalari ko'rsatkichlaringiz o'zingiz kutganingizdan pastroq.`;
          recommendation = "Mavzuni diqqat bilan qayta ko'rib chiqing va tushunmagan qismlaringizni AI Mentordan so'rang.";
        } else if (accuracy > 80 && ratingPercent < 50) {
          report = `Sizda 'impreador' effekti sezilmoqda — bilimingiz yuqori bo'lsa-da, o'zingizga ishonchingiz past. Ko'rsatkichlaringiz aslida ancha yaxshi.`;
          recommendation = "O'z bilimingizga ko'proq ishoning, siz mavzularni a'lo darajada o'zlashtirmoqdasiz.";
        } else if (progress < 40) {
          report = `Hozircha kursni o'zlashtirish darajangiz past. Tizimli bilim olish uchun darslarni ketma-ketlikda ko'rib chiqish lozim.`;
          recommendation = "Har kuni kamida 15-20 daqiqa darslarga vaqt ajratish orqali o'sishga erishishingiz mumkin.";
        } else {
          report = `O'quv faoliyatingiz barqaror rivojlanmoqda. Test natijalaringiz (${Math.round(accuracy)}%) va o'z-o'zini baholash aniqligi (${Math.round(awareness)}%) muvozanatda.`;
          recommendation = "Xatolar ustida ishlashda davom eting va tahlillarni yanada chuqurlashtiring.";
        }

        setAiReport(JSON.stringify({ report, recommendation }));
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchMetacognition();
  }, [fetchMetacognition]);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-10 animate-fade-in pb-20">
      
      {/* 1. Sarlavha va Umumiy Holat */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">O'quv Faoliyati Tahlili</h1>
        <p className="text-slate-500 font-medium italic">O'quv jarayoni va metakognitiv ko'nikmalarning akademik hisoboti</p>
      </div>

      {/* 2. Asosiy ko'rsatkichlar (Soddalashtirilgan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "O'rtacha Ball", val: `${stats.avgAccuracy}%`, desc: "Test natijalari", icon: Target, col: "text-blue-600 bg-blue-50" },
          { label: "Progress", val: `${stats.totalProgress}%`, desc: "Kurs o'zlashtirilishi", icon: Activity, col: "text-indigo-600 bg-indigo-50" },
          { label: "Tahlil Sifati", val: stats.reflectionQuality, desc: "Refleksiya darajasi", icon: Brain, col: "text-emerald-600 bg-emerald-50" },
          { label: "Sezgi Aniqligi", val: `${stats.selfAwareness}%`, desc: "O'zini baholash", icon: Zap, col: "text-amber-600 bg-amber-50" }
        ].map((item, i) => (
          <Card key={i} className="p-6 rounded-2xl border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${item.col}`}>
              <item.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{item.val}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 3. Bilimlar va Ko'nikmalar (Progress Barlar bilan) */}
        <Card className="lg:col-span-2 p-8 rounded-3xl border-slate-100 shadow-sm space-y-8">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900">Kognitiv ko'nikmalarning rivojlanishi</h3>
           </div>
           
           <div className="space-y-8">
              {skills.map((skill, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{skill.label}</p>
                        <p className="text-xs text-slate-400 font-medium">Akademik o'zlashtirish ko'rsatkichi</p>
                      </div>
                      <span className="text-sm font-black text-slate-900">{skill.value}%</span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${skill.color} transition-all duration-1000`} 
                        style={{ width: `${skill.value}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </Card>

        {/* 4. Akademik Xulosa (O'quvchi uchun) */}
        <Card className="p-8 rounded-3xl border-slate-100 shadow-sm bg-indigo-600 text-white relative overflow-hidden">
           <Sparkles className="absolute -top-6 -right-6 h-32 w-32 text-white/10 rotate-12" />
           <div className="relative z-10 space-y-6">
              <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                 <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold leading-tight">O'quvchi uchun AI xulosasi</h3>
              <p className="text-indigo-50 text-sm leading-relaxed font-medium">
                {(() => {
                  try {
                    const data = JSON.parse(aiReport);
                    return data.report;
                  } catch (e) {
                    return aiReport;
                  }
                })()}
              </p>
              <div className="pt-6 border-t border-white/10">
                 <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-4">Shaxsiy tavsiya:</p>
                 <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                    <p className="text-xs italic">
                      {(() => {
                        try {
                          const data = JSON.parse(aiReport);
                          return `"${data.recommendation}"`;
                        } catch (e) {
                          return "\"Ma'lumotlar tahlil qilinmoqda...\"";
                        }
                      })()}
                    </p>
                 </div>
              </div>
           </div>
        </Card>

      </div>

      {/* 5. O'zlashtirish Dinamikasi (Soddalashtirilgan Grafik) */}
      <Card className="p-8 rounded-3xl border-slate-100 shadow-sm space-y-6">
         <div className="flex items-center justify-between border-b border-slate-50 pb-5">
            <div className="flex items-center gap-3">
               <TrendingUp className="h-6 w-6 text-emerald-600" />
               <h3 className="text-lg font-bold text-slate-900">Haftalik o'zlashtirish dinamikasi</h3>
            </div>
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O'rtacha ball</span>
            </div>
         </div>
         
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorBall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <ChartTooltip 
                    contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Area type="monotone" dataKey="ball" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBall)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </Card>

    </div>
  );
};

export default StudentMetacognition;
