import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, User, Mail, Shield, BookOpen, 
  Award, Zap, Star, Camera, Settings, 
  LogOut, ChevronRight, CheckCircle2, 
  Target, TrendingUp, Calendar, Brain
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const Profile = () => {
  const { user, profile, roles, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ courses: 0, tests: 0, points: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const { count: coursesCount } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: testsCount } = await supabase.from("test_results").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setStats({ courses: coursesCount || 0, tests: testsCount || 0, points: (testsCount || 0) * 15 });
    };
    fetchStats();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, bio }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profil muvaffaqiyatli yangilandi!");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const badges = [
    { name: "Metakognitiv Master", icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Tezkor Fikrlovchi", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
    { name: "Top Talaba", icon: Star, color: "text-emerald-600", bg: "bg-emerald-50" },
    { name: "Yangi Bilimdon", icon: Award, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
      <div className="max-w-7xl mx-auto py-10 px-4 lg:px-8 space-y-12 animate-fade-in">
        
        {/* Profile Hero Section */}
        <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 p-12 lg:p-20 text-white shadow-2xl">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
           <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
              <div className="relative group">
                 <Avatar className="h-44 w-44 lg:h-56 lg:w-56 border-[6px] border-white/10 ring-4 ring-primary/20 shadow-2xl">
                    <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary text-white text-5xl font-black">{profile?.full_name?.[0]}</AvatarFallback>
                 </Avatar>
                 <button className="absolute bottom-4 right-4 h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-4 border-slate-900">
                    <Camera className="h-5 w-5" />
                 </button>
              </div>
              <div className="text-center lg:text-left space-y-6">
                 <div className="space-y-2">
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                       {roles.map(role => (
                          <Badge key={role} className="bg-primary/20 text-primary border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                             {role}
                          </Badge>
                       ))}
                       <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                          Online
                       </Badge>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tight italic leading-none">{profile?.full_name || "Foydalanuvchi"}</h1>
                 </div>
                 <p className="text-slate-400 max-w-xl text-lg font-medium italic">"{profile?.bio || "O'zingiz haqingizda biroz gapirib bering..."}"</p>
                 <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4">
                    <div className="flex items-center gap-3">
                       <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Calendar className="h-6 w-6 text-primary" /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ro'yxatdan o'tdi</p>
                          <p className="text-sm font-bold">Aprel 2024</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Shield className="h-6 w-6 text-primary" /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID raqami</p>
                          <p className="text-sm font-bold">#{user?.id?.slice(0, 8)}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* Left Column: Stats & Achievements */}
           <div className="lg:col-span-4 space-y-12">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                 <Card className="premium-card border-none p-8 space-y-4">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center"><BookOpen className="h-6 w-6" /></div>
                    <div>
                       <h3 className="text-3xl font-black uppercase leading-none">{stats.courses}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Kurslar</p>
                    </div>
                 </Card>
                 <Card className="premium-card border-none p-8 space-y-4">
                    <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center"><CheckCircle2 className="h-6 w-6" /></div>
                    <div>
                       <h3 className="text-3xl font-black uppercase leading-none">{stats.tests}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Testlar</p>
                    </div>
                 </Card>
                 <Card className="premium-card border-none p-8 space-y-4">
                    <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Target className="h-6 w-6" /></div>
                    <div>
                       <h3 className="text-3xl font-black uppercase leading-none">{stats.points}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ballar</p>
                    </div>
                 </Card>
                 <Card className="premium-card border-none p-8 space-y-4">
                    <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><TrendingUp className="h-6 w-6" /></div>
                    <div>
                       <h3 className="text-3xl font-black uppercase leading-none">85%</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Aniqlik</p>
                    </div>
                 </Card>
              </div>

              {/* Achievements */}
              <Card className="rounded-[3rem] border-none shadow-2xl p-10 space-y-8 bg-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full translate-x-10 -translate-y-10" />
                 <h2 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                    <Award className="h-6 w-6 text-primary" /> Muvaffaqiyatlar
                 </h2>
                 <div className="space-y-4">
                    {badges.map((badge, i) => (
                       <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-all">
                          <div className={`h-12 w-12 ${badge.bg} ${badge.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                             <badge.icon className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-black uppercase tracking-tight text-slate-700">{badge.name}</p>
                       </div>
                    ))}
                 </div>
              </Card>
           </div>

           {/* Right Column: Settings Form */}
           <div className="lg:col-span-8">
              <Card className="rounded-[4rem] border-none shadow-2xl bg-white overflow-hidden h-full">
                 <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md"><Settings className="h-7 w-7 text-white" /></div>
                       <div>
                          <h2 className="text-2xl font-black uppercase tracking-tight italic">Profil Sozlamalari</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Shaxsiy ma'lumotlarni tahrirlash</p>
                       </div>
                    </div>
                 </div>
                 
                 <CardContent className="p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-4">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">To'liq ism</Label>
                          <div className="relative">
                             <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                             <Input 
                               value={fullName} 
                               onChange={(e) => setFullName(e.target.value)} 
                               className="h-16 pl-16 rounded-2xl border-slate-100 bg-slate-50/50 text-base font-bold focus-visible:ring-primary/20 transition-all"
                               placeholder="Ismingizni kiriting"
                             />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email manzil</Label>
                          <div className="relative">
                             <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                             <Input 
                               value={user?.email || ""} 
                               disabled 
                               className="h-16 pl-16 rounded-2xl border-slate-100 bg-slate-50 opacity-60 text-base font-bold"
                             />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">O'zingiz haqingizda (Bio)</Label>
                       <Textarea 
                         value={bio} 
                         onChange={(e) => setBio(e.target.value)} 
                         placeholder="Bilim yo'li haqida bir necha so'z..." 
                         className="min-h-[180px] rounded-3xl border-slate-100 bg-slate-50/50 p-8 text-base font-medium focus-visible:ring-primary/20 transition-all"
                       />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 pt-6">
                       <Button 
                         onClick={handleSave} 
                         disabled={loading} 
                         className="h-16 flex-1 rounded-2xl bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                       >
                         {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                         O'zgarishlarni Saqlash
                       </Button>
                       <Button 
                         variant="outline" 
                         onClick={() => signOut()}
                         className="h-16 px-10 rounded-2xl border-rose-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black uppercase text-xs tracking-widest transition-all"
                       >
                         <LogOut className="mr-2 h-5 w-5" /> Tizimdan chiqish
                       </Button>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
  );
};

export default Profile;
