import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, User, Mail, Shield, 
  Camera, Settings, 
  LogOut, CheckCircle2, 
  Calendar, UserCircle, Info
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const Profile = () => {
  const { user, profile, roles, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images') // Common bucket name in this template, or fallback to profiles
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      
      toast.success("Rasm muvaffaqiyatli yangilandi!");
      window.location.reload(); // Quick way to refresh auth state profile
    } catch (error) {
      console.error(error);
      toast.error("Rasmni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 space-y-10 animate-fade-in pb-20">
      <input
        type="file"
        id="avatar-upload"
        className="hidden"
        accept="image/*"
        onChange={handleAvatarUpload}
      />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0056d2]/10 text-[#0056d2] flex items-center justify-center">
              <UserCircle className="h-5 w-5" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Mening Profilim</h1>
          </div>
          <p className="text-slate-500 ml-13 font-medium">Shaxsiy ma'lumotlaringiz va profil sozlamalari.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => signOut()}
            className="h-12 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" /> Tizimdan chiqish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Profile Identity Card */}
        <div className="lg:col-span-4 space-y-10">
          
          <Card className="border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[#0056d2] to-blue-400" />
            <CardContent className="px-6 pb-8 -mt-16 text-center">
              <div className="relative inline-block mb-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl bg-slate-50">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-[#0056d2] text-white text-3xl font-bold">{profile?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="absolute bottom-1 right-1 h-8 w-8 bg-white text-[#0056d2] rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform border border-slate-100"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{profile?.full_name || "Foydalanuvchi"}</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {roles.map(role => (
                    <Badge key={role} className="bg-blue-50 text-[#0056d2] border-none font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md">
                      {role === 'student' ? 'Talaba' : role === 'teacher' ? 'O\'qituvchi' : role}
                    </Badge>
                  ))}
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-md">
                    Online
                  </Badge>
                </div>
              </div>
              
              <p className="text-slate-500 text-sm font-medium leading-relaxed italic px-4">
                "{profile?.bio || "O'zingiz haqingizda biroz gapirib bering..."}"
              </p>

              <div className="grid grid-cols-1 gap-3 mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <Calendar className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ro'yxatdan o'tdi</p>
                    <p className="text-sm font-bold text-slate-700">Aprel 2024</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                  <Shield className="h-5 w-5 text-blue-500 shrink-0" />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID raqami</p>
                    <p className="text-sm font-bold text-slate-700">#{user?.id?.slice(0, 8)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-8 space-y-10">
          
          <Card className="border-slate-200 shadow-sm bg-white rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Settings className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Profil sozlamalari</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shaxsiy ma'lumotlarni tahrirlash</p>
              </div>
            </div>
            
            <CardContent className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-slate-700 ml-1">To'liq ism</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      className="h-12 pl-11 rounded-xl border-slate-200 bg-white text-sm font-bold focus:ring-2 focus:ring-[#0056d2]/10 focus:border-[#0056d2] transition-all"
                      placeholder="Ismingizni kiriting"
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-slate-700 ml-1">Email manzil</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      value={user?.email || ""} 
                      disabled 
                      className="h-12 pl-11 rounded-xl border-slate-200 bg-slate-50 opacity-70 text-sm font-bold text-slate-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 ml-1 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Email manzilini o'zgartirib bo'lmaydi
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-slate-700 ml-1">O'zingiz haqingizda (Bio)</Label>
                <Textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="O'quv rejalaringiz yoki tajribangiz haqida..." 
                  className="min-h-[150px] rounded-2xl border-slate-200 bg-white p-6 text-sm font-medium focus:ring-2 focus:ring-[#0056d2]/10 focus:border-[#0056d2] transition-all"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="h-12 px-10 rounded-xl bg-[#0056d2] text-white font-bold transition-all shadow-md shadow-blue-100"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  O'zgarishlarni saqlash
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
