import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GraduationCap, Loader2, User,
  ArrowRight, Zap, Star, TrendingUp,
  Brain, MessageCircle, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Register = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz! Iltimos, pochtangizni tasdiqlang.");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex bg-white font-sans overflow-hidden">
      {/* ─── Left Side ─── */}
      <div className="w-full lg:w-1/2 h-full flex flex-col px-10 lg:px-16 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* Logo - Top */}
        <div className="flex-none pt-8 pb-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="IDROK Logo" className="h-12 w-12 object-contain rounded-xl shadow-lg shrink-0" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">IDROK</span>
          </div>
        </div>

        {/* Center: Heading + Form */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto py-4">
          <div className="flex flex-col gap-6 w-full">
            {/* Heading */}
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Yangi Kelajak!</h1>
              <p className="text-slate-500 text-base mt-2 font-medium">
                Platformamizga qo'shiling va ta'limda yangi davrni boshlang.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex p-1.5 bg-slate-100 rounded-xl w-fit gap-1">
              <Link to="/login">
                <Button variant="ghost" className="text-slate-400 rounded-lg px-7 py-2.5 h-auto font-bold text-sm hover:bg-transparent hover:text-[#0056d2]">
                  Kirish
                </Button>
              </Link>
              <Button className="bg-white text-slate-900 shadow-sm rounded-lg px-7 py-2.5 h-auto font-bold text-sm border-none hover:bg-white">
                Ro'yxatdan o'tish
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 uppercase tracking-wide ml-1">Men platformada...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${role === "student"
                        ? "border-[#0056d2] bg-blue-50 text-[#0056d2]"
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                      }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-bold text-sm">Talabaman</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("teacher")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${role === "teacher"
                        ? "border-[#0056d2] bg-blue-50 text-[#0056d2]"
                        : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                      }`}
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span className="font-bold text-sm">O'qituvchiman</span>
                  </button>
                </div>
              </div>

              {/* Side-by-side Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-bold text-slate-700 uppercase tracking-wide">To'liq ism</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ism Familiya"
                    className="h-14 rounded-xl border-slate-200 text-base font-medium px-4 focus:border-[#0056d2] focus:ring-[#0056d2]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 uppercase tracking-wide">Email manzil</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700 uppercase tracking-wide">Parol</Label>
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

              <Button type="submit" className="w-full h-14 rounded-xl text-base font-black bg-[#0056d2] text-white hover:bg-[#00419e] transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 mt-2" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Hisobni yaratish"}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer - Bottom */}
        <div className="flex-none pb-8 pt-4">
          <div className="flex justify-between items-center text-xs font-medium text-slate-400 border-t border-slate-100 pt-5">
            <span>© 2026 IDROK AI</span>
            <div className="flex gap-5">
              <Link to="#" className="hover:text-[#0056d2] transition-colors">Maxfiylik siyosati</Link>
              <Link to="#" className="hover:text-[#0056d2] transition-colors">Yordam markazi</Link>
            </div>
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
              Sayohatni bugun boshlang
            </span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
              {role === 'student' ? 'Bilimlar siz uchun' : 'Ta\'limni boshqaring'}
            </h2>
            <p className="text-base text-slate-500 font-medium leading-relaxed">
              Shaxsiy AI yordamchi bilan o'rganish tezligini oshiring va metakognitiv tahlillar orqali o'zingizni kashf qiling.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="flex flex-col gap-4">
            {(role === 'student' ? [
              { icon: Zap, title: "Shaxsiy AI yordamchi", desc: "Sizning tempingizga moslashuvchi ta'lim jarayoni." },
              { icon: Star, title: "O'z-o'zini tahlil qilish", desc: "Har bir darsdan so'ng bilimingizni tahlil qiling." },
              { icon: TrendingUp, title: "Aqlli rivojlanish", desc: "Natijalaringizni chuqur tahlil qilib boring." }
            ] : [
              { icon: Brain, title: "Kengaytirilgan analitika", desc: "Talabalar faoliyatini real vaqtda interaktiv kuzating." },
              { icon: MessageCircle, title: "To'g'ridan-to'g'ri aloqa", desc: "Talabalar bilan muloqotni osonlashtiring va yordam bering." },
              { icon: ShieldCheck, title: "Sinfni boshqarish", desc: "Kurslarni va darslarni to'liq o'zingiz boshqaring." }
            ]).map((item, i) => (
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

export default Register;
