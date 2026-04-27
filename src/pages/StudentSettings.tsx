import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, User, Bell, Shield, 
  Globe, Moon, Smartphone, Mail,
  Lock, Save, LogOut, ChevronRight,
  Eye, EyeOff, CheckCircle2, AlertCircle,
  Camera, MapPin, Phone, Briefcase,
  Zap, Award, CreditCard, Loader2, Sparkles,
  Sun, Monitor, Palette, Fingerprint
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StudentSettings = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");

  const handleUpdateAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Hisob ma'lumotlari yangilandi!");
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "account", label: "Hisob", icon: User, color: "bg-primary", light: "bg-primary/10", text: "text-primary" },
    { id: "security", label: "Xavfsizlik", icon: Shield, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-500" },
    { id: "notifications", label: "Bildirishnomalar", icon: Bell, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-500" },
    { id: "appearance", label: "Ko'rinish", icon: Palette, color: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-500" },
  ];

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto py-12 px-6 lg:px-12 space-y-16 animate-fade-in">
        
        {/* Cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] italic">
                 <Settings className="h-4 w-4" /> System Control
              </div>
              <h1 className="text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                Sozlamalar
              </h1>
              <p className="text-lg text-slate-400 font-medium italic max-w-xl leading-relaxed">
                Platformadagi shaxsiy tajribangizni va xavfsizlik parametrlarini ideal holatga keltiring.
              </p>
           </div>
           <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                onClick={() => signOut()} 
                className="h-20 px-10 rounded-[2.5rem] border-rose-100 bg-white text-rose-500 hover:bg-rose-500 hover:text-white font-black uppercase text-xs tracking-[0.2em] gap-4 shadow-xl transition-all duration-500 group"
              >
                 <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Tizimdan chiqish
              </Button>
           </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
           
           {/* Neo-Menu Sidebar */}
           <div className="lg:col-span-3 space-y-4 sticky top-10">
              {tabs.map((tab) => (
                 <motion.button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   whileHover={{ x: 5 }}
                   className={`w-full flex items-center justify-between p-6 rounded-[2rem] transition-all duration-500 group relative overflow-hidden ${
                     activeTab === tab.id 
                       ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20" 
                       : "bg-white text-slate-400 hover:bg-slate-50"
                   }`}
                 >
                    {activeTab === tab.id && (
                       <motion.div 
                         layoutId="activeTabGlow"
                         className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" 
                       />
                    )}
                    <div className="flex items-center gap-5 relative z-10">
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                         activeTab === tab.id ? tab.color : "bg-slate-50 group-hover:bg-white"
                       }`}>
                          <tab.icon className={`h-6 w-6 ${activeTab === tab.id ? "text-white" : "text-slate-300 group-hover:text-primary"}`} />
                       </div>
                       <span className={`text-xs font-black uppercase tracking-widest italic transition-colors ${
                         activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                       }`}>{tab.label}</span>
                    </div>
                    <ChevronRight className={`h-5 w-5 transition-all duration-500 ${
                      activeTab === tab.id ? "text-white opacity-100" : "text-slate-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-2"
                    }`} />
                 </motion.button>
              ))}
              
              <div className="pt-10 px-4">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic mb-6">Device Info</p>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3">
                       <Smartphone className="h-4 w-4 text-slate-400" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chrome on Windows</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Globe className="h-4 w-4 text-slate-400" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP: 178.21.**.**</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Main Cinematic Content Area */}
           <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   transition={{ duration: 0.4 }}
                 >
                    <Card className="rounded-[4rem] border-none shadow-[0_50px_100px_rgba(0,0,0,0.04)] bg-white overflow-hidden min-h-[700px] border border-slate-50 relative">
                       {/* Background Aura */}
                       {tabs.map(tab => tab.id === activeTab && (
                          <div key={tab.id} className={`absolute top-0 right-0 w-[400px] h-[400px] ${tab.light} blur-[150px] rounded-full -mr-40 -mt-40 opacity-50 pointer-events-none`} />
                       ))}

                       <CardContent className="p-12 lg:p-20 relative z-10">
                          
                          {activeTab === "account" && (
                             <div className="space-y-16">
                                <div className="flex flex-col md:flex-row md:items-center gap-10 pb-12 border-b border-slate-100">
                                   <div className="relative group cursor-pointer">
                                      <div className="h-32 w-32 rounded-[2.5rem] bg-primary text-white flex items-center justify-center text-5xl font-black italic shadow-[0_20px_40px_rgba(139,92,246,0.3)] transition-transform group-hover:scale-105">
                                         {fullName?.[0]?.toUpperCase()}
                                      </div>
                                      <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-xl group-hover:bg-primary transition-colors">
                                         <Camera className="h-5 w-5" />
                                      </div>
                                   </div>
                                   <div>
                                      <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic mb-3">Identity Center</Badge>
                                      <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Hisob Ma'lumotlari</h3>
                                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic mt-1">Sizning platformadagi raqamli pasportingiz</p>
                                   </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                   <div className="space-y-4 group">
                                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 italic group-focus-within:text-primary transition-colors">To'liq Ism</Label>
                                      <div className="relative">
                                         <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                         <input 
                                           value={fullName} 
                                           onChange={(e) => setFullName(e.target.value)} 
                                           className="w-full h-20 pl-16 pr-8 rounded-[2rem] border-none bg-slate-50 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner placeholder:text-slate-300"
                                           placeholder="Ismingizni kiriting"
                                         />
                                      </div>
                                   </div>
                                   <div className="space-y-4 opacity-60">
                                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 italic">Email Manzil</Label>
                                      <div className="relative">
                                         <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                         <input 
                                           value={email} 
                                           disabled
                                           className="w-full h-20 pl-16 pr-8 rounded-[2rem] border-none bg-slate-50 text-base font-bold cursor-not-allowed italic"
                                         />
                                      </div>
                                   </div>
                                   <div className="space-y-4 group">
                                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 italic">Telefon</Label>
                                      <div className="relative">
                                         <Phone className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary" />
                                         <input 
                                           placeholder="+998 90 123 45 67" 
                                           className="w-full h-20 pl-16 pr-8 rounded-[2rem] border-none bg-slate-50 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner"
                                         />
                                      </div>
                                   </div>
                                   <div className="space-y-4 group">
                                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 italic">Hudud</Label>
                                      <div className="relative">
                                         <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary" />
                                         <input 
                                           placeholder="O'zbekiston, Toshkent" 
                                           className="w-full h-20 pl-16 pr-8 rounded-[2rem] border-none bg-slate-50 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all shadow-inner"
                                         />
                                      </div>
                                   </div>
                                </div>

                                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                   <Button 
                                     onClick={handleUpdateAccount} 
                                     disabled={loading} 
                                     className="h-20 w-full md:w-fit px-16 rounded-[2rem] bg-primary text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:bg-slate-900 group"
                                   >
                                      {loading ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Save className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />}
                                      O'zgarishlarni Saqlash
                                   </Button>
                                </motion.div>
                             </div>
                          )}

                          {activeTab === "security" && (
                             <div className="space-y-16">
                                <div className="flex flex-col md:flex-row md:items-center gap-10 pb-12 border-b border-slate-100">
                                   <div className="h-28 w-28 rounded-[2.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner relative overflow-hidden group">
                                      <div className="absolute inset-0 bg-emerald-500/10 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full" />
                                      <Shield className="h-14 w-14 relative z-10" />
                                   </div>
                                   <div>
                                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic mb-3">Guardian Protocol</Badge>
                                      <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Xavfsizlik Hubi</h3>
                                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic mt-1">Ma'lumotlaringizni neyron himoyasi</p>
                                   </div>
                                </div>

                                <div className="space-y-10">
                                   <motion.div 
                                     whileHover={{ y: -5 }}
                                     className="p-10 rounded-[3rem] bg-white border border-slate-100 flex items-center justify-between shadow-2xl shadow-slate-200/20"
                                   >
                                      <div className="flex items-center gap-6">
                                         <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Fingerprint className="h-8 w-8" />
                                         </div>
                                         <div>
                                            <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight leading-none mb-1">Ikki Faktorli Himoya</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">SMS yoki Email orqali tasdiqlash</p>
                                         </div>
                                      </div>
                                      <Switch className="scale-150 data-[state=checked]:bg-emerald-500" />
                                   </motion.div>

                                   <div className="space-y-8 bg-slate-50/50 p-12 rounded-[3.5rem] border border-slate-100">
                                      <div className="flex items-center gap-4 mb-2">
                                         <Lock className="h-5 w-5 text-emerald-500" />
                                         <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] italic">Parolni Yangilash</h4>
                                      </div>
                                      <div className="grid grid-cols-1 gap-8">
                                         <div className="relative group">
                                            <Shield className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input 
                                              type={showPassword ? "text" : "password"} 
                                              placeholder="Hozirgi Parol" 
                                              className="w-full h-20 pl-20 pr-10 rounded-[2rem] border-none bg-white text-base font-bold focus:ring-4 focus:ring-emerald-500/10 shadow-xl transition-all"
                                            />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors">
                                               {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                            </button>
                                         </div>
                                         <div className="relative group">
                                            <Zap className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <input 
                                              type="password" 
                                              placeholder="Yangi Parol" 
                                              className="w-full h-20 pl-20 pr-10 rounded-[2rem] border-none bg-white text-base font-bold focus:ring-4 focus:ring-emerald-500/10 shadow-xl transition-all"
                                            />
                                         </div>
                                      </div>
                                      <Button className="h-16 px-12 rounded-[2rem] bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-2xl shadow-slate-900/10 transition-all duration-500">Parolni Tasdiqlash</Button>
                                   </div>
                                </div>
                             </div>
                          )}

                          {activeTab === "notifications" && (
                             <div className="space-y-16">
                                <div className="flex flex-col md:flex-row md:items-center gap-10 pb-12 border-b border-slate-100">
                                   <div className="h-28 w-28 rounded-[2.5rem] bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner group">
                                      <Bell className="h-14 w-14 group-hover:rotate-12 transition-transform" />
                                   </div>
                                   <div>
                                      <Badge className="bg-amber-500/10 text-amber-500 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic mb-3">Signal Intelligence</Badge>
                                      <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Bildirishnomalar</h3>
                                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic mt-1">Muhim xabarlarni o'z vaqtida qabul qiling</p>
                                   </div>
                                </div>

                                <div className="space-y-6">
                                   {[
                                     { label: "Yangi Kurslar", desc: "Sizga mos yangi darslar qo'shilganda xabar berish", icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50" },
                                     { label: "O'qituvchi Xabarlari", desc: "Mentorlar tomonidan yuborilgan shaxsiy ko'rsatmalar", icon: Mail, color: "text-indigo-500", bg: "bg-indigo-50" },
                                     { label: "Akademik Natijalar", desc: "Test natijalari va yangi nishonlar haqida tahlil", icon: Award, color: "text-emerald-500", bg: "bg-emerald-50" },
                                     { label: "Tizim Yangilanishi", desc: "Platformadagi muhim texnik o'zgarishlar va aura", icon: Sparkles, color: "text-primary", bg: "bg-primary/5" },
                                   ].map((item, i) => (
                                      <motion.div 
                                        key={i} 
                                        whileHover={{ scale: 1.01 }}
                                        className="flex items-center justify-between p-10 rounded-[3rem] bg-white border border-slate-50 shadow-2xl shadow-slate-200/10 group transition-all"
                                      >
                                         <div className="flex items-center gap-8">
                                            <div className={`h-16 w-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                               <item.icon className="h-8 w-8" />
                                            </div>
                                            <div>
                                               <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight mb-1">{item.label}</p>
                                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{item.desc}</p>
                                            </div>
                                         </div>
                                         <Switch defaultChecked className="scale-150 data-[state=checked]:bg-amber-500" />
                                      </motion.div>
                                   ))}
                                </div>
                             </div>
                          )}

                          {activeTab === "appearance" && (
                             <div className="space-y-16">
                                <div className="flex flex-col md:flex-row md:items-center gap-10 pb-12 border-b border-slate-100">
                                   <div className="h-28 w-28 rounded-[2.5rem] bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner group">
                                      <Palette className="h-14 w-14 group-hover:scale-110 transition-transform" />
                                   </div>
                                   <div>
                                      <Badge className="bg-indigo-500/10 text-indigo-500 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest italic mb-3">Visual Aura</Badge>
                                      <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Interfeys Sozlamalari</h3>
                                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic mt-1">Platforma ko'rinishini dunyoqarashingizga moslang</p>
                                   </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                   <motion.div 
                                     whileHover={{ scale: 1.02 }}
                                     className="p-12 rounded-[4rem] bg-slate-950 text-white relative overflow-hidden group cursor-pointer border-8 border-primary shadow-[0_30px_60px_rgba(139,92,246,0.3)]"
                                   >
                                      <div className="absolute top-6 right-8 h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-xl"><CheckCircle2 className="h-5 w-5 text-white" /></div>
                                      <Moon className="h-16 w-16 text-primary mb-8" />
                                      <h4 className="text-3xl font-black uppercase italic tracking-tighter">Premium Dark</h4>
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-4 italic">Tungi rejim faol</p>
                                      <div className="mt-10 flex gap-2">
                                         <div className="h-1.5 w-12 bg-primary rounded-full" />
                                         <div className="h-1.5 w-6 bg-slate-800 rounded-full" />
                                      </div>
                                   </motion.div>

                                   <motion.div 
                                     whileHover={{ scale: 1.02 }}
                                     className="p-12 rounded-[4rem] bg-white text-slate-900 border-8 border-slate-50 relative overflow-hidden group cursor-pointer hover:border-slate-100 shadow-2xl shadow-slate-200/20"
                                   >
                                      <Sun className="h-16 w-16 text-slate-200 mb-8" />
                                      <h4 className="text-3xl font-black uppercase italic tracking-tighter">Clean Light</h4>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4 italic">Kunduzgi rejim</p>
                                      <div className="mt-10 flex gap-2">
                                         <div className="h-1.5 w-12 bg-slate-100 rounded-full" />
                                         <div className="h-1.5 w-6 bg-slate-50 rounded-full" />
                                      </div>
                                   </motion.div>
                                </div>

                                <div className="p-12 rounded-[3.5rem] bg-indigo-900 text-white relative overflow-hidden group">
                                   <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 blur-[80px] rounded-full -mr-20" />
                                   <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                      <div className="space-y-4">
                                         <div className="flex items-center gap-4">
                                            <Monitor className="h-6 w-6 text-indigo-300" />
                                            <h4 className="text-lg font-black uppercase tracking-widest italic">Tizim Sinxronizatsiyasi</h4>
                                         </div>
                                         <p className="text-sm font-medium text-indigo-200/60 leading-relaxed italic max-w-md">
                                            Barcha sozlamalar va ko'rinish rejimi mobil ilova bilan real-vaqt rejimida sinxronizatsiya qilinadi.
                                         </p>
                                      </div>
                                      <Button className="h-16 px-10 rounded-[2rem] bg-white text-indigo-900 font-black uppercase text-[10px] tracking-widest hover:bg-indigo-50 shadow-2xl">Batafsil</Button>
                                   </div>
                                </div>
                             </div>
                          )}

                       </CardContent>
                    </Card>
                 </motion.div>
              </AnimatePresence>
           </div>
        </div>

        {/* Footer Audit */}
        <div className="text-center py-12 border-t border-slate-50">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] italic flex items-center justify-center gap-4">
              <ShieldCheck className="h-4 w-4" /> Global Privacy Compliance & Neural Security v4.2
           </p>
        </div>

      </div>
    </Layout>
  );
};

export default StudentSettings;
