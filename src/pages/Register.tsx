import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, Loader2, User, Mail, 
  Lock, ArrowRight, Zap, Star, TrendingUp,
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
    <div className="min-h-screen flex bg-white font-sans overflow-x-hidden">
      {/* Left Side: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-20 py-10 relative z-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-8 py-4 sm:py-12">
          
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0056d2] text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">MetaEdu</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Yangi Kelajak!</h1>
            <p className="text-slate-600 text-sm sm:text-base font-medium">Platformamizga qo'shiling va ta'limda yangi davrni boshlang.</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-500 rounded-md px-4 sm:px-6 py-1.5 sm:py-2 h-auto font-semibold text-xs sm:text-sm hover:bg-transparent hover:text-[#0056d2]">Kirish</Button>
            </Link>
            <Button className="bg-white text-slate-900 shadow-sm rounded-md px-4 sm:px-6 py-1.5 sm:py-2 h-auto font-semibold text-xs sm:text-sm border-none hover:bg-white">Ro'yxatdan o'tish</Button>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 ml-1">Men platformada...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    role === "student" 
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
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                    role === "teacher" 
                      ? "border-[#0056d2] bg-blue-50 text-[#0056d2]" 
                      : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                  <span className="font-bold text-sm">O'qituvchiman</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">To'liq ism</Label>
              <Input 
                id="fullName" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Ism Familiya" 
                className="h-12 rounded-lg border-slate-200 focus:border-[#0056d2] focus:ring-[#0056d2] font-medium" 
                required 
              />
            </div>

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
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Parol</Label>
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

            <Button type="submit" className="w-full h-12 rounded-lg text-base font-bold bg-[#0056d2] text-white hover:bg-[#00419e] transition-all" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Hisobni yaratish"}
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
              Sayohatni bugun boshlang
           </div>
           <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-slate-900 mb-6">
              {role === 'student' ? 'Bilimlar siz uchun' : 'Ta\'limni boshqaring'} 
           </h2>
           <p className="text-lg text-slate-600 font-medium leading-relaxed mb-12">
              Shaxsiy AI yordamchi bilan o'rganish tezligini oshiring va metakognitiv tahlillar orqali o'zingizni kashf qiling.
           </p>

          <div className="grid gap-4 w-full">
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

export default Register;
