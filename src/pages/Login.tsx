import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, ArrowRight, Brain, TrendingUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Login = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#0056d2]" />
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
    <div className="h-screen flex bg-white font-sans overflow-hidden">

      {/* ─── Left Side ─── */}
      <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center px-10 lg:px-16 relative overflow-hidden">

        {/* Logo - absolute top */}
        <div className="absolute top-8 left-10 lg:left-16 flex items-center gap-3">
          <img src="/logo.png" alt="IDROK Logo" className="h-12 w-12 object-contain rounded-xl shadow-lg" />
          <span className="text-2xl font-black text-slate-900 tracking-tight">IDROK</span>
        </div>

        {/* Center: Heading + Form */}
        <div className="flex flex-col gap-7 w-full max-w-md">

          {/* Heading */}
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Xush kelibsiz!</h1>
            <p className="text-slate-500 text-base mt-2 font-medium">
              Metakognitiv ta'lim ekotizimiga kirish uchun ma'lumotlaringizni kiriting.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex p-1.5 bg-slate-100 rounded-xl w-fit gap-1">
            <Button className="bg-white text-slate-900 shadow-sm rounded-lg px-7 py-2.5 h-auto font-bold text-sm border-none hover:bg-white">
              Kirish
            </Button>
            <Link to="/register">
              <Button variant="ghost" className="text-slate-400 rounded-lg px-7 py-2.5 h-auto font-bold text-sm hover:bg-transparent hover:text-[#0056d2]">
                Ro'yxatdan o'tish
              </Button>
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Email manzil
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@idrok.uz"
                className="h-14 rounded-xl border-slate-200 text-base font-medium px-4 focus:border-[#0056d2] focus:ring-[#0056d2]"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Parol
                </Label>
                <Link to="#" className="text-sm font-semibold text-[#0056d2] hover:underline">
                  Parolni unutdingizmi?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-14 rounded-xl border-slate-200 text-base font-medium px-4 focus:border-[#0056d2] focus:ring-[#0056d2]"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="remember"
                className="w-5 h-5 rounded border-slate-300 text-[#0056d2] focus:ring-[#0056d2]"
              />
              <label htmlFor="remember" className="text-base font-medium text-slate-600">
                Meni eslab qol
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-xl text-base font-black bg-[#0056d2] text-white hover:bg-[#00419e] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Kirish <ArrowRight className="h-5 w-5" /></>}
            </Button>
          </form>
        </div>

        {/* Footer - absolute bottom */}
        <div className="absolute bottom-8 left-10 lg:left-16 right-10 lg:right-16 flex justify-between items-center text-xs font-medium text-slate-400 border-t border-slate-100 pt-5">
          <span>© 2026 IDROK AI</span>
          <div className="flex gap-5">
            <Link to="#" className="hover:text-[#0056d2] transition-colors">Maxfiylik siyosati</Link>
            <Link to="#" className="hover:text-[#0056d2] transition-colors">Yordam markazi</Link>
          </div>
        </div>
      </div>

      {/* ─── Right Side ─── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5f7fa] relative overflow-hidden flex-col items-center justify-center p-12 h-full">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -mr-60 -mt-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px] -ml-60 -mb-60 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-lg w-full text-center flex flex-col gap-8"
        >
          {/* Badge */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-[#0056d2] text-xs font-black uppercase tracking-widest">
              AI yordamida metakognitiv ta'lim
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
              O'rganishni aqlli va samarali darajaga olib chiqing.
            </h2>
            <p className="text-base text-slate-500 font-medium leading-relaxed">
              IDROK sun'iy intellekt yordamida sizning o'rganish jarayoningizni tahlil qiladi va shaxsiy tavsiyalar beradi.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="flex flex-col gap-4">
            {[
              { icon: Brain, title: "Metakognitiv tahlil", desc: "Siz qanday o'rganayotganingizni tushuning va xatolaringizdan dars oling." },
              { icon: TrendingUp, title: "Shaxsiy o'sish", desc: "Har bir darsdan so'ng AI tomonidan tayyorlangan maxsus hisobotlarni oling." },
              { icon: ShieldCheck, title: "Global sertifikatlash", desc: "Platformada olingan bilimlaringiz xalqaro standartlarga javob beradi." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.12 }}
                className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left"
              >
                <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#0056d2] shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-snug mt-0.5">{item.desc}</p>
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
