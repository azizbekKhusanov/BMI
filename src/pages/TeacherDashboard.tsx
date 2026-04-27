import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  BookOpen, Users, TrendingUp, Plus, Search, Bell, 
  Star, ChevronRight, CheckCircle2, Clock, MoreVertical,
  Calendar, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const DONUT_COLORS = ["#4338ca", "#e11d48", "#8b5cf6"];
const DONUT_DATA = [
  { name: "Yuqori", value: 45 },
  { name: "O'rtacha", value: 35 },
  { name: "Past", value: 20 },
];

const TeacherDashboard = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Real data fetching would happen here
    setTimeout(() => setLoading(false), 800);
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) return (
    <Layout>
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      {/* Topbar matching the design */}
      <div className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="text-sm font-bold text-slate-500 tracking-wider">TEACHER PORTAL</div>
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search courses, lessons, or insights..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-slate-600 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-rose-500 rounded-full border border-white"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900 leading-tight">Professor Erkinov</div>
              <div className="text-xs text-slate-500">teacher</div>
            </div>
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">PE</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Xush kelibsiz, Professor!</h1>
          <p className="text-slate-600">Bugun sizning kurslaringizda <span className="font-bold text-indigo-600">124 ta</span> faol talaba bor.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold rounded-full px-6">
            <BookOpen className="mr-2 h-4 w-4" /> Barcha kurslar
          </Button>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-full px-6 font-semibold shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Yangi kurs yaratish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Faol kurslar", value: "12", sub: "Hozirda nashr etilgan", icon: BookOpen, trend: "+2 yangi" },
          { label: "Jami talabalar", value: "1,452", sub: "O'tgan oyga nisbatan +12%", icon: Users, trend: "Yuqori" },
          { label: "Onlayn talabalar", value: "84", sub: "Hozirda platformada", icon: TrendingUp, trend: "" },
          { label: "O'rtacha reyting", value: "4.9", sub: "856 ta fikrlar asosida", icon: Star, trend: "Barqaror" },
        ].map((s, i) => (
          <Card key={i} className="rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <s.icon className="h-6 w-6" />
                </div>
                {s.trend && <span className="text-xs font-semibold text-slate-600 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {s.trend}</span>}
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{s.value}</h3>
              <p className="text-sm font-semibold text-slate-700">{s.label}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">Tekshirilishi kutilayotganlar</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Yangi yuborilgan vazifalar va hisobotlar</p>
              </div>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-3 py-1 text-xs font-semibold rounded-full">
                3 ta kutilmoqda
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left font-semibold text-slate-500 px-6 py-4 uppercase text-xs tracking-wider">Talaba</th>
                    <th className="text-left font-semibold text-slate-500 px-6 py-4 uppercase text-xs tracking-wider">Kurs / Vazifa</th>
                    <th className="text-left font-semibold text-slate-500 px-6 py-4 uppercase text-xs tracking-wider">Sana</th>
                    <th className="text-left font-semibold text-slate-500 px-6 py-4 uppercase text-xs tracking-wider">Muhimlik</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { name: "Doston Baxtiyorov", task: "Amaliy ish #3", course: "AI ASOSLARI", date: "Bugun, 10:45", priority: "Tezkor", color: "text-rose-600 bg-rose-50" },
                    { name: "Laylo Rahmonova", task: "Esse: Metakognitsiya", course: "PSIXOLOGIYA", date: "Kecha, 18:20", priority: "O'rtacha", color: "text-slate-600 bg-slate-100" },
                    { name: "Aziz Toshpulatov", task: "Loyiha hisoboti", course: "MA'LUMOTLAR TAHLILI", date: "2 kun avval", priority: "Past", color: "text-slate-600 bg-slate-100" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{row.task}</div>
                        <div className="text-xs text-slate-500 font-semibold tracking-wider mt-0.5">{row.course}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 flex items-center gap-1.5 mt-2.5">
                        <Clock className="h-3.5 w-3.5" /> {row.date}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${row.color}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-indigo-600 font-semibold text-sm hover:text-indigo-700">Tekshirish</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                <button className="text-sm font-semibold text-slate-600 hover:text-slate-900">Barcha topshiriqlarni ko'rish</button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold text-slate-900">So'nggi faoliyat</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Talabalarning platformadagi jonli harakatlari</p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              {[
                { name: "Jasur Aliyev", action: "Kognitiv testni yakunladi", time: "5 DAQIQA AVVAL", avatar: "JA", online: true },
                { name: "Malika Sobirova", action: "2-modul darsini ko'rmoqda", time: "12 DAQIQA AVVAL", avatar: "MS", online: true },
                { name: "Sardor Karimov", action: "Yangi savol qoldirdi", time: "2 SOAT AVVAL", avatar: "SK", online: false },
                { name: "Guli Ikromova", action: "Topshiriq yubordi", time: "3 SOAT AVVAL", avatar: "GI", online: true },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">{activity.avatar}</AvatarFallback>
                      </Avatar>
                      {activity.online && <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{activity.name}</h4>
                      <p className="text-sm text-slate-500">{activity.action}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activity.time}</span>
                    <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="rounded-3xl border-none bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg shadow-indigo-200">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold">Tezkor amallar</CardTitle>
              <p className="text-sm text-indigo-200 mt-1">Boshqaruvni osonlashtiring</p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <Button variant="secondary" className="w-full justify-between bg-white/10 hover:bg-white/20 border-none text-white h-12 rounded-xl">
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" /> Yangi kurs</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Button>
              <Button variant="secondary" className="w-full justify-between bg-white/10 hover:bg-white/20 border-none text-white h-12 rounded-xl">
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Loyihani nashr etish</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Button>
              
              <div className="mt-6 p-4 bg-indigo-900/40 rounded-xl border border-indigo-500/30">
                <div className="flex gap-3 items-start">
                  <div className="p-1.5 bg-indigo-500/30 rounded-md text-indigo-200 mt-0.5">
                    <Info className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Eslatma: Bugun soat 18:00 da vebinar bor.</h4>
                    <button className="text-xs font-semibold text-indigo-300 mt-2 hover:text-white">Taqvimni ochish</button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="text-lg font-bold text-slate-900">O'zlashtirish tahlili</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Talabalarning natijalari bo'yicha taqsimoti</p>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={DONUT_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {DONUT_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center gap-4">
                 {DONUT_DATA.map((d, i) => (
                   <div key={i} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
                   </div>
                 ))}
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-700">Yuqori o'zlashtirish</span>
                </div>
                <span className="font-bold text-slate-900">45%</span>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl text-sm border border-indigo-100/50">
                <p className="text-slate-600 italic">"O'rtacha natija ko'rsatgan talabalarga qo'shimcha metacognitive mashqlar tavsiya eting."</p>
                <button className="text-indigo-600 font-bold text-xs mt-3 hover:text-indigo-700">AI tavsiyalari</button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
