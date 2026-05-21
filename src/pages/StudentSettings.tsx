import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  User, Shield, Bell, Palette, Camera, Save, 
  LogOut, Lock, Eye, EyeOff, Loader2, Sparkles,
  Smartphone, Globe, CheckCircle2, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const StudentSettings = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, bio: bio })
        .eq("user_id", user.id);
      
      if (error) throw error;
      toast.success("Profil muvaffaqiyatli yangilandi!");
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Parollar mos kelmadi!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Parol yangilandi!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "security", label: "Xavfsizlik", icon: Shield },
    { id: "notifications", label: "Xabarnomalar", icon: Bell },
    { id: "appearance", label: "Ko'rinish", icon: Palette },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12 animate-fade-in pb-32">
      
      {/* 1. Premium Hero Header */}
      <div className="relative rounded-[3rem] bg-slate-900 overflow-hidden min-h-[350px] shadow-2xl flex items-center group">
         <div className="absolute top-0 right-0 w-[500px] h-full opacity-30 pointer-events-none group-hover:opacity-40 transition-opacity duration-700">
            <img 
               src="/settings_3d_hero_1779340672370.png" 
               alt="Settings" 
               className="w-full h-full object-contain translate-x-20 scale-110"
            />
         </div>
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

         <div className="relative z-10 p-10 md:p-16 space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 rounded-full px-4 py-1.5">
               <Sparkles className="h-4 w-4 text-indigo-400" />
               <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Boshqaruv Markazi</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
               Tizim <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">Sozlamalari</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
               Platformadagi shaxsiy profilingizni va xavfsizlik sozlamalarini o'zingizga moslang.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
         
         {/* 2. Navigation Sidebar */}
         <div className="space-y-3">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-300 ${
                     activeTab === tab.id 
                     ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                     : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
                  }`}
               >
                  <div className="flex items-center gap-4">
                     <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-white" : "text-slate-400"}`} />
                     <span className="text-sm font-bold">{tab.label}</span>
                  </div>
                  <ChevronRight className={`h-4 w-4 transition-transform ${activeTab === tab.id ? "rotate-90 opacity-100" : "opacity-0"}`} />
               </button>
            ))}
            
            <div className="pt-6">
               <Button 
                  onClick={signOut}
                  variant="ghost" 
                  className="w-full justify-start gap-3 p-5 h-auto rounded-[1.5rem] text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-bold"
               >
                  <LogOut className="h-5 w-5" /> Tizimdan chiqish
               </Button>
            </div>
         </div>

         {/* 3. Main Form Area */}
         <Card className="lg:col-span-3 rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden min-h-[600px]">
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 md:p-12 h-full"
               >
                  {activeTab === "profile" && (
                     <div className="space-y-10 max-w-2xl">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900">Profil Ma'lumotlari</h3>
                           <p className="text-slate-500 text-sm">Talaba sifatida platformadagi vizual ko'rinishingizni boshqaring.</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-50">
                           <div className="relative group">
                              <div className="h-24 w-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 border-2 border-indigo-100">
                                 {fullName?.[0]?.toUpperCase()}
                              </div>
                              <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors">
                                 <Camera className="h-5 w-5" />
                              </button>
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900">{user?.email}</p>
                              <Badge className="bg-emerald-50 text-emerald-600 border-none mt-2">Tasdiqlangan Hisob</Badge>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">To'liq ism</Label>
                              <Input 
                                 value={fullName} 
                                 onChange={(e) => setFullName(e.target.value)}
                                 className="h-14 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-medium" 
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">O'zingiz haqingizda (Bio)</Label>
                              <textarea 
                                 value={bio}
                                 onChange={(e) => setBio(e.target.value)}
                                 placeholder="O'zingiz haqingizda qisqacha ma'lumot qoldiring..."
                                 className="w-full min-h-[120px] p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm outline-none"
                              />
                           </div>
                        </div>

                        <Button 
                           onClick={handleUpdateProfile} 
                           disabled={loading}
                           className="h-14 px-8 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 gap-2"
                        >
                           {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                           Saqlash
                        </Button>
                     </div>
                  )}

                  {activeTab === "security" && (
                     <div className="space-y-10 max-w-2xl">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900">Xavfsizlik</h3>
                           <p className="text-slate-500 text-sm">Profilingizni xavfsiz saqlash uchun parolingizni yangilab turing.</p>
                        </div>

                        <div className="space-y-8 bg-slate-50 p-8 rounded-[2rem]">
                           <div className="space-y-6">
                              <div className="space-y-2">
                                 <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Yangi parol</Label>
                                 <div className="relative">
                                    <Input 
                                       type={showPassword ? "text" : "password"}
                                       value={newPassword}
                                       onChange={(e) => setNewPassword(e.target.value)}
                                       className="h-14 pr-12 rounded-xl bg-white border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-medium" 
                                    />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                                       {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Parolni tasdiqlang</Label>
                                 <Input 
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="h-14 rounded-xl bg-white border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-medium" 
                                 />
                              </div>
                           </div>
                           <Button 
                              onClick={handleChangePassword}
                              disabled={loading}
                              className="h-14 px-8 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-lg gap-2"
                           >
                              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                              Parolni Yangilash
                           </Button>
                        </div>
                     </div>
                  )}

                  {activeTab === "notifications" && (
                     <div className="space-y-10">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900">Xabarnomalar</h3>
                           <p className="text-slate-500 text-sm">Qaysi turdagi habarlarni qabul qilishni belgilang.</p>
                        </div>

                        <div className="grid gap-4">
                           {[
                              { label: "Dars bildirishnomalari", desc: "Yangi dars qo'shilganda xabar berish", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
                              { label: "Natijalar tahlili", desc: "Test natijalari tayyor bo'lganda ogohlantirish", icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
                              { label: "Chat xabarlari", desc: "AI Mentor yoki o'qituvchi yozganda xabarnoma", icon: Sparkles, color: "bg-indigo-50 text-indigo-600" }
                           ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                                 <div className="flex items-center gap-5">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                       <item.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-slate-900">{item.label}</p>
                                       <p className="text-xs text-slate-400">{item.desc}</p>
                                    </div>
                                 </div>
                                 <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === "appearance" && (
                     <div className="space-y-10">
                        <div className="space-y-2">
                           <h3 className="text-2xl font-black text-slate-900">Ko'rinish</h3>
                           <p className="text-slate-500 text-sm">Interfeys uslubini tanlang.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Card className="p-1 border-2 border-indigo-600 rounded-3xl overflow-hidden cursor-pointer group">
                              <div className="bg-slate-50 h-32 flex items-center justify-center relative">
                                 <div className="h-2 w-20 bg-white rounded-full shadow-sm" />
                                 <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="p-4 bg-white">
                                 <p className="text-sm font-bold text-slate-900">Classic Light (Standart)</p>
                              </div>
                           </Card>
                           <Card className="p-1 border-2 border-transparent hover:border-slate-200 rounded-3xl overflow-hidden cursor-pointer group grayscale opacity-50">
                              <div className="bg-slate-900 h-32 flex items-center justify-center relative">
                                 <div className="h-2 w-20 bg-slate-800 rounded-full" />
                              </div>
                              <div className="p-4 bg-white">
                                 <p className="text-sm font-bold text-slate-900">Modern Dark (Tez kunda)</p>
                              </div>
                           </Card>
                        </div>
                     </div>
                  )}
               </motion.div>
            </AnimatePresence>
         </Card>
      </div>

      {/* 4. Device Tracking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
            { icon: Smartphone, label: "Oxirgi Kirish", val: "Windows PC", desc: "Toshkent, O'zbekiston" },
            { icon: Globe, label: "IP Manzil", val: "178.21.**.**", desc: "Statik holatda" },
            { icon: Shield, label: "Xavfsizlik", val: "Yuqori", desc: "SSL himoyasi faol" }
         ].map((item, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100 flex items-center gap-5">
               <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <item.icon className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-bold text-slate-900">{item.val}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
               </div>
            </div>
         ))}
      </div>

    </div>
  );
};

export default StudentSettings;
