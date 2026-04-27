import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  GraduationCap, Loader2, Mail, Lock, 
  Chrome, Github, ArrowRight, Brain, 
  TrendingUp, ShieldCheck, Sparkles,
  ChevronLeft, Info
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
      
      {/* Left Side: Form Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={formVariants}
        className="flex-1 flex flex-col justify-center px-8 md:px-24 lg:px-32 relative z-10 bg-white shadow-[20px_0_60px_rgba(0,0,0,0.02)]"
      >
        <div className="w-full max-w-md mx-auto space-y-12 py-12">
          
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
               Xush <br /><span className="text-primary italic">Kelibsiz!</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg text-slate-400 font-medium italic">
               Metakognitiv ta'lim ekotizimiga kirish uchun ma'lumotlaringizni kiriting.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="flex p-1.5 bg-slate-50 rounded-[1.5rem] w-full border border-slate-100">
            <Button className="flex-1 bg-white shadow-xl rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-slate-900 border-none">Kirish</Button>
            <Link to="/register" className="flex-1">
               <Button variant="ghost" className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-primary">Ro'yxatdan O'tish</Button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
            <Button variant="outline" className="h-16 rounded-[1.5rem] border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-700 hover:bg-slate-50 shadow-sm gap-3">
              <Chrome className="h-5 w-5" /> Google
            </Button>
            <Button variant="outline" className="h-16 rounded-[1.5rem] border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-700 hover:bg-slate-50 shadow-sm gap-3">
              <Github className="h-5 w-5" /> GitHub
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-50" /></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-[0.4em] font-black italic">
              <span className="bg-white px-6 text-slate-300">Yoki Email Orqali</span>
            </div>
          </motion.div>

          <form onSubmit={handleLogin} className="space-y-8">
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
              <div className="flex justify-between items-center px-2">
                <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Parol</Label>
                <Link to="#" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline italic">Unutdingizmi?</Link>
              </div>
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
                />
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-center gap-3 px-2">
              <input type="checkbox" id="remember" className="w-5 h-5 rounded-lg border-slate-200 text-primary focus:ring-primary shadow-inner" />
              <label htmlFor="remember" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Meni eslab qol</label>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Button type="submit" className="w-full h-20 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 group bg-slate-900 text-white hover:bg-primary transition-all" disabled={loading}>
                {loading ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : "Platformaga Kirish"}
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

      {/* Right Side: Cinematic Visual Sidebar */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden items-center justify-center p-20">
        
        {/* Dynamic Aura Background */}
        <div className="absolute inset-0">
           <motion.div 
             animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
             transition={{ duration: 10, repeat: Infinity }}
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary rounded-full blur-[150px]" 
           />
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]" />
        </div>

        <div className="relative z-10 max-w-2xl w-full space-y-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="space-y-8"
          >
             <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 text-xs font-black text-white uppercase tracking-[0.3em] italic shadow-2xl">
                <Sparkles className="h-5 w-5 text-primary fill-primary animate-pulse" />
                Metacognitive Intelligence
             </div>
             <h2 className="text-7xl xl:text-8xl font-black text-white leading-[0.9] uppercase italic tracking-tighter">
                Bilimga <span className="text-primary italic">Yangi</span> Nazar
             </h2>
             <p className="text-xl text-slate-400 font-medium italic leading-relaxed max-w-xl">
                MetaEdu sun'iy intellekt yordamida sizning o'rganish jarayoningizni tahlil qiladi va shaxsiy tavsiyalar beradi.
             </p>
          </motion.div>

          <div className="grid gap-8">
            {[
              { icon: Brain, title: "Metakognitiv Tahlil", desc: "Qanday o'rganayotganingizni chuqurroq tushuning.", color: "text-primary", bg: "bg-primary/20" },
              { icon: TrendingUp, title: "Dinamik O'sish", desc: "AI tavsiyalari bilan natijalarni 2 barobar tezlashtiring.", color: "text-blue-400", bg: "bg-blue-400/20" },
              { icon: ShieldCheck, title: "Global Standartlar", desc: "Dunyo darajasidagi o'quv metodikasi bir joyda.", color: "text-emerald-400", bg: "bg-emerald-400/20" }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex items-center gap-8 p-8 rounded-[3rem] bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-all group cursor-default shadow-2xl"
              >
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] ${item.bg} ${item.color} shadow-inner group-hover:scale-110 transition-transform duration-500`}>
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

        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '60px 60px' }} />
      </div>
    </div>
  );
};

export default Login;
