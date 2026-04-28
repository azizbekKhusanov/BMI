import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, Loader2, Mail, Lock, 
  ArrowRight, Brain, TrendingUp, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Login = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (user) {
    if (roles.includes("admin")) return <Navigate to="/admin" replace />;
    if (roles.includes("teacher")) return <Navigate to="/teacher" replace />;
    return <Navigate to="/student/my-courses" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-x-hidden">
      {/* Left Side: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-20 py-10 relative z-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-8">
          
          <div className="flex items-center gap-3 mb-6 sm:mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0056d2] text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">MetaEdu</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Xush kelibsiz!</h1>
            <p className="text-slate-600 text-sm sm:text-base font-medium">Metakognitiv ta'lim ekotizimiga kirish uchun ma'lumotlaringizni kiriting.</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
            <Button className="bg-white text-slate-900 shadow-sm rounded-md px-4 sm:px-6 py-1.5 sm:py-2 h-auto font-semibold text-xs sm:text-sm border-none hover:bg-white">Kirish</Button>
            <Link to="/register">
              <Button variant="ghost" className="text-slate-500 rounded-md px-4 sm:px-6 py-1.5 sm:py-2 h-auto font-semibold text-xs sm:text-sm hover:bg-transparent hover:text-[#0056d2]">Ro'yxatdan o'tish</Button>
            </Link>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email manzil</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="example@metaedu.uz" 
                className="h-12 rounded-lg border-slate-200 focus:border-[#0056d2] focus:ring-[#0056d2] font-medium" 
                required 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Parol</Label>
                <Link to="#" className="text-xs font-semibold text-[#0056d2] hover:underline">Parolni unutdingizmi?</Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="h-12 rounded-lg border-slate-200 focus:border-[#0056d2] focus:ring-[#0056d2] font-medium" 
                required 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-[#0056d2] focus:ring-[#0056d2]" />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600">Meni eslab qol</label>
            </div>

            <Button type="submit" className="w-full h-12 rounded-lg text-base font-bold bg-[#0056d2] text-white hover:bg-[#00419e] transition-all" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Kirish"}
              {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>

          <footer className="pt-8 flex justify-between items-center text-xs font-medium text-slate-400 border-t border-slate-100">
            <span>© 2024 MetaEdu AI</span>
            <div className="flex gap-4">
              <Link to="#" className="hover:text-[#0056d2] transition-colors">Maxfiylik siyosati</Link>
              <Link to="#" className="hover:text-[#0056d2] transition-colors">Yordam markazi</Link>
            </div>
          </footer>
        </div>
      </div>

      {/* Right Side: Visual Sidebar (Coursera Style) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5f7fa] relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px] -ml-64 -mb-64" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-lg text-center"
        >
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 text-[#0056d2] text-xs font-bold mb-8 uppercase tracking-wider">
              AI yordamida metakognitiv ta'lim
           </div>
           <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-slate-900 mb-6">
              O'rganishni aqlli va samarali darajaga olib chiqing.
           </h2>
           <p className="text-lg text-slate-600 font-medium leading-relaxed mb-12">
              MetaEdu sun'iy intellekt yordamida sizning o'rganish jarayoningizni tahlil qiladi va shaxsiy tavsiyalar beradi.
           </p>

          <div className="grid gap-4 w-full">
            {[
              { icon: Brain, title: "Metakognitiv tahlil", desc: "Siz qanday o'rganayotganingizni tushuning va xatolaringizdan dars oling." },
              { icon: TrendingUp, title: "Shaxsiy o'sish", desc: "Har bir darsdan so'ng AI tomonidan tayyorlangan maxsus hisobotlarni oling." },
              { icon: ShieldCheck, title: "Global sertifikatlash", desc: "Platformada olingan bilimlaringiz xalqaro standartlarga javob beradi." }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#0056d2] shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-left space-y-1">
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
