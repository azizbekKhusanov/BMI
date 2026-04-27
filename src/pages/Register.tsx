import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, Loader2, Mail, Lock, 
  User, BookOpen, Brain, Sparkles, 
  ArrowRight, ShieldCheck, Zap, TrendingUp,
  MessageCircle, Star
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const Register = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Ro'yxatdan o'tdingiz! Emailingizni tekshiring.");
    }
    setLoading(false);
  };

  const formVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans overflow-hidden">
      
      {/* Left Side: Registration Form */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={formVariants}
        className="flex-1 flex flex-col justify-center px-8 md:px-24 lg:px-32 relative z-10 bg-white shadow-[20px_0_60px_rgba(0,0,0,0.02)] overflow-y-auto"
      >
        <div className="w-full max-w-md mx-auto space-y-12 py-20">
          
          <motion.div variants={itemVariants} className="flex items-center gap-4 group">
            <Link to="/" className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-slate-900 text-white shadow-2xl group-hover:bg-primary transition-all duration-500">
                <GraduationCap className="h-8 w-8" />
              </div>
              <span className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Meta<span className="text-primary">Edu</span></span>
            </Link>
          </motion.div>

          <div className="space-y-4">
            <motion.h1 variants={itemVariants} className="text-5xl lg:text-6xl font-black text-slate-900 leading-[0.9] uppercase italic tracking-tighter">
               Yangi <br /><span className="text-primary italic">Kelajak!</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg text-slate-400 font-medium italic leading-relaxed">
               Platformamizga qo'shiling va ta'limda yangi davrni boshlang.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="flex p-1.5 bg-slate-50 rounded-[1.5rem] w-full border border-slate-100">
            <Link to="/login" className="flex-1">
               <Button variant="ghost" className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-primary">Kirish</Button>
            </Link>
            <Button className="flex-1 bg-white shadow-xl rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-slate-900 border-none">Ro'yxatdan O'tish</Button>
          </motion.div>

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Role Selection Grid */}
            <motion.div variants={itemVariants} className="space-y-4">
               <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Men platformada...</Label>
               <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setRole("student")}
                    className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 flex flex-col items-center gap-3 ${role === 'student' ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${role === 'student' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                        <User className="h-6 w-6" />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${role === 'student' ? 'text-primary' : 'text-slate-400'}`}>Talabaman</span>
                  </div>
                  <div 
                    onClick={() => setRole("teacher")}
                    className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-500 flex flex-col items-center gap-3 ${role === 'teacher' ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                     <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${role === 'teacher' ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                        <BookOpen className="h-6 w-6" />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${role === 'teacher' ? 'text-primary' : 'text-slate-400'}`}>O'qituvchiman</span>
                  </div>
               </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="fullName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">To'liq Ism</Label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  placeholder="Ism Familiya" 
                  className="pl-16 h-16 rounded-[1.5rem] border-none bg-slate-50 focus:bg-white focus:shadow-2xl transition-all font-bold text-slate-700 placeholder:text-slate-200" 
                  required 
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Email Manzil</Label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@example.com" 
                  className="pl-16 h-16 rounded-[1.5rem] border-none bg-slate-50 focus:bg-white focus:shadow-2xl transition-all font-bold text-slate-700 placeholder:text-slate-200" 
                  required 
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-3">
              <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Parol</Label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="pl-16 h-16 rounded-[1.5rem] border-none bg-slate-50 focus:bg-white focus:shadow-2xl transition-all font-bold text-slate-700" 
                  required 
                  minLength={6}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button type="submit" className="w-full h-20 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 group bg-slate-900 text-white hover:bg-primary transition-all" disabled={loading}>
                {loading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : "Hisobni Yaratish"}
                {!loading && <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-2" />}
              </Button>
            </motion.div>
          </form>

          <motion.footer variants={itemVariants} className="pt-12 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-50 text-[9px] font-black text-slate-300 uppercase tracking-widest italic">
            <span>© 2026 MetaEdu AI</span>
            <div className="flex gap-8">
              <Link to="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-primary transition-colors">Support</Link>
            </div>
          </motion.footer>
        </div>
      </motion.div>

      {/* Right Side: Visual Registration Sidebar */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center p-20">
        
        {/* Dynamic Aura Background */}
        <div className="absolute inset-0">
           <motion.div 
             animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
             transition={{ duration: 12, repeat: Infinity }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-indigo-500 rounded-full blur-[180px]" 
           />
           <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[4px]" />
        </div>

        <div className="relative z-10 max-w-2xl w-full space-y-16 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
             <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 text-xs font-black text-white uppercase tracking-[0.3em] italic shadow-2xl">
                <Sparkles className="h-5 w-5 text-primary fill-primary" />
                Start Your Journey Today
             </div>
             <h2 className="text-7xl xl:text-8xl font-black text-white leading-[0.9] uppercase italic tracking-tighter">
                {role === 'student' ? 'Bilimlar' : 'Ta\'lim'} <span className="text-primary italic">Siz</span> Uchun
             </h2>
             <p className="text-xl text-slate-400 font-medium italic leading-relaxed max-w-xl mx-auto lg:mx-0">
                {role === 'student' 
                  ? "Shaxsiy AI yordamchi bilan o'rganish tezligini oshiring va metakognitiv tahlillar orqali o'zingizni kashf qiling."
                  : "Talabalaringizning o'zlashtirishini real vaqtda kuzating va metakognitiv uzilishlarni aniqlab, ularga yordam bering."
                }
             </p>
          </motion.div>

          <div className="grid gap-8">
            {(role === 'student' ? [
              { icon: Zap, title: "Personalized AI", desc: "Sizning tempingizga moslashuvchi ta'lim." },
              { icon: Star, title: "Self-Reflection", desc: "Har bir darsdan so'ng bilimingizni tahlil qiling." },
              { icon: TrendingUp, title: "Smart Progress", desc: "Natijalaringizni chuqur tahlil qiling." }
            ] : [
              { icon: Brain, title: "Advanced Analytics", desc: "Talabalar faoliyatini real vaqtda kuzating." },
              { icon: MessageCircle, title: "Direct Feedback", desc: "Talabalar bilan muloqotni osonlashtiring." },
              { icon: ShieldCheck, title: "Class Control", desc: "Kurslarni va darslarni to'liq boshqaring." }
            ]).map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex items-center gap-8 p-8 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all group shadow-2xl"
              >
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/5 text-white shadow-inner group-hover:scale-110 group-hover:text-primary transition-all duration-500`}>
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tight">{item.title}</h4>
                  <p className="text-base text-slate-400 font-medium italic">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative Overlay */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '60px 60px' }} />
      </div>
    </div>
  );
};

export default Register;
