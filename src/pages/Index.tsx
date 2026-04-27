import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, Brain, ArrowRight, PlayCircle, 
  BarChart3, Users, Zap, ShieldCheck, Sparkles,
  Target, Rocket, Globe, ChevronRight, Star,
  CheckCircle2, LayoutIcon, MousePointer2
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { user, roles, loading } = useAuth();
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 20]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }
  if (user) {
    if (roles.includes("admin")) return <Navigate to="/admin" replace />;
    if (roles.includes("teacher")) return <Navigate to="/teacher" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0], 
            y: [0, 100, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" 
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Premium Navbar */}
      <motion.header 
        style={{ 
          backgroundColor: `rgba(255, 255, 255, ${headerOpacity})`,
          backdropFilter: `blur(${headerBlur}px)`
        }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-24 flex items-center border-b border-white/10"
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-2xl group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
              <GraduationCap className="h-7 w-7" />
            </div>
            <span className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Meta<span className="text-primary">Edu</span></span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-12">
            {["Kurslar", "Metakognitsiya", "O'qituvchilar", "Narxlar"].map((item) => (
              <Link key={item} to="#" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary transition-colors">{item}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-black uppercase text-[10px] tracking-widest text-slate-600 hover:text-primary rounded-xl px-8 h-12">Kirish</Button>
            </Link>
            <Link to="/register">
              <Button className="font-black uppercase text-[10px] tracking-widest rounded-2xl px-10 h-12 shadow-2xl bg-slate-900 text-white hover:bg-primary transition-all">Boshlash</Button>
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-40 pb-32 lg:pt-56 lg:pb-56 overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="flex flex-col items-center text-center space-y-12 max-w-6xl mx-auto">
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white shadow-xl border border-slate-100 text-primary text-[10px] font-black uppercase tracking-[0.3em] italic"
              >
                <Sparkles className="h-4 w-4 fill-primary" /> 
                Next-Gen Education Platform
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase italic"
              >
                O'rganishni <br />
                <span className="text-primary italic">AQLI</span> VA <span className="relative inline-block">
                  <span className="relative z-10">TEZ</span>
                  <div className="absolute bottom-4 left-0 w-full h-8 bg-indigo-100 -z-10 rotate-1" />
                </span> QILING
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl md:text-2xl text-slate-400 max-w-3xl font-medium italic leading-relaxed"
              >
                MetaEdu sun'iy intellekt va metakognitiv tahlil yordamida har bir talabaning salohiyatini maksimal darajada ochadi.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 pt-10"
              >
                <Link to="/register">
                  <Button size="lg" className="h-20 px-16 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(139,92,246,0.3)] bg-primary text-white hover:scale-105 transition-all group">
                    Hoziroq boshlash <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="h-20 px-16 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] border-white bg-white shadow-2xl hover:bg-slate-50 transition-all gap-4">
                    <PlayCircle className="h-6 w-6 text-primary" /> Demoni ko'rish
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Floating UI Mockups */}
          <div className="hidden lg:block relative mt-20 h-40">
             <motion.div 
               animate={{ y: [0, -20, 0], rotate: [0, 1, 0] }}
               transition={{ duration: 5, repeat: Infinity }}
               className="absolute left-[5%] top-0 h-32 w-64 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white p-6 flex items-center gap-4"
             >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Brain className="h-6 w-6" /></div>
                <div><p className="text-[10px] font-black uppercase">Metacognitive</p><p className="text-xs font-bold text-slate-400">Score: 84%</p></div>
             </motion.div>
             <motion.div 
               animate={{ y: [0, 20, 0], rotate: [0, -1, 0] }}
               transition={{ duration: 6, repeat: Infinity }}
               className="absolute right-[5%] top-[-100px] h-32 w-64 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white p-6 flex items-center gap-4"
             >
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><Target className="h-6 w-6" /></div>
                <div><p className="text-[10px] font-black uppercase">Lesson Mastery</p><p className="text-xs font-bold text-slate-400">Advanced Level</p></div>
             </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-40 relative">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-24">
              <div className="space-y-6">
                 <Badge className="bg-slate-900 text-white rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em]">Features Hub</Badge>
                 <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Nega Aynan <span className="text-primary italic">MetaEdu?</span></h2>
              </div>
              <p className="text-slate-400 font-medium italic text-lg max-w-md">Bizning platforma zamonaviy ta'limning eng ilg'or usullarini sun'iy intellekt bilan birlashtiradi.</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {[
                { 
                  icon: Brain, 
                  title: "Metakognitiv Tahlil", 
                  desc: "Biz nafaqat bilim beramiz, balki talabaning qanday o'rganayotganini chuqur tahlil qilamiz.",
                  color: "text-primary", bg: "bg-primary/5" 
                },
                { 
                  icon: Zap, 
                  title: "AI Integratsiyasi", 
                  desc: "Sun'iy intellekt har bir talaba uchun shaxsiy ta'lim trayektoriyasini dinamik ravishda tuzadi.",
                  color: "text-blue-500", bg: "bg-blue-50" 
                },
                { 
                  icon: BarChart3, 
                  title: "Live Analitika", 
                  desc: "O'qituvchilar talabalarning o'zlashtirishini real vaqtda interaktiv grafiklarda kuzatishadi.",
                  color: "text-indigo-500", bg: "bg-indigo-50" 
                },
                { 
                  icon: Users, 
                  title: "Smart Hamjamiyat", 
                  desc: "Talabalar va o'qituvchilar o'rtasida jonli muloqot va AI-moderatsiya qilingan muhit.",
                  color: "text-rose-500", bg: "bg-rose-50" 
                },
                { 
                  icon: ShieldCheck, 
                  title: "Maksimal Himoya", 
                  desc: "Sizning barcha o'quv ma'lumotlaringiz va yutuqlaringiz yuqori darajada xavfsiz saqlanadi.",
                  color: "text-emerald-500", bg: "bg-emerald-50" 
                },
                { 
                  icon: LayoutIcon, 
                  title: "Reality Check", 
                  desc: "Har bir darsdan so'ng o'z bilmingizni sinab ko'rish va o'z-o'zini baholash tizimi.",
                  color: "text-amber-500", bg: "bg-amber-50" 
                },
              ].map((f, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Card className="border-none shadow-xl bg-white rounded-[3.5rem] p-12 space-y-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group relative overflow-hidden h-full">
                    <div className={`absolute top-0 right-0 h-32 w-32 ${f.bg} rounded-full -mr-16 -mt-16 opacity-30 group-hover:scale-150 transition-transform duration-700`} />
                    <div className={`h-16 w-16 flex items-center justify-center rounded-[1.5rem] ${f.bg} ${f.color} shadow-inner`}>
                      <f.icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{f.title}</h3>
                      <p className="text-slate-400 font-medium leading-relaxed italic text-lg">{f.desc}</p>
                    </div>
                    <Button variant="link" className={`p-0 h-auto ${f.color} font-black uppercase text-[10px] tracking-widest gap-2 group-hover:gap-4 transition-all`}>
                      Learn More <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-slate-900 py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
          <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 text-center">
              {[
                { label: "Active Talabalar", value: "10K+", icon: Users },
                { label: "Premium Kurslar", value: "500+", icon: GraduationCap },
                { label: "AI Tahlillar", value: "1.2M+", icon: Brain },
                { label: "Talaba Mamnunligi", value: "4.9/5", icon: Star },
              ].map((stat, i) => (
                <div key={i} className="space-y-4 group">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter">{stat.value}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 lg:px-12 py-40">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="relative rounded-[5rem] bg-white p-12 lg:p-32 overflow-hidden text-center shadow-2xl border border-slate-50"
          >
            <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-primary/5 blur-[100px] rounded-full -translate-y-20 translate-x-20" />
            <div className="relative z-10 space-y-12 max-w-4xl mx-auto">
              <div className="flex justify-center"><Badge className="bg-primary/10 text-primary border-none px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Join the Future</Badge></div>
              <h2 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900 uppercase italic">
                Kelajak ta'limiga <br /> <span className="text-primary italic">BUGUN</span> qo'shiling
              </h2>
              <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium italic">Minglab muvaffaqiyatli talabalar va o'qituvchilar qatoridan joy oling.</p>
              <div className="pt-10 flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/register">
                  <Button size="lg" className="h-20 px-16 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:scale-105 transition-all shadow-2xl">
                    Hoziroq ro'yxatdan o'tish <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/student/courses">
                  <Button variant="outline" size="lg" className="h-20 px-16 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] border-slate-100 bg-white hover:bg-slate-50 transition-all">
                    Kurslarni ko'rish
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="bg-white border-t border-slate-100 pt-32 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 mb-20">
            <div className="lg:col-span-2 space-y-10">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Meta<span className="text-primary italic">Edu</span></span>
              </Link>
              <p className="text-xl text-slate-400 font-medium italic max-w-md leading-relaxed">
                Raqamli metakognitiv o'quv platformasi orqali ta'limda inqilob qiling. Har bir talabaning salohiyatini birgalikda ochamiz.
              </p>
              <div className="flex items-center gap-6">
                 {["twitter", "instagram", "linkedin"].map((social) => (
                   <div key={social} className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                      <Globe className="h-6 w-6" />
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-10 lg:col-span-2">
              {[
                { title: "Loyiha", links: ["Biz haqimizda", "Imkoniyatlar", "Kurslar", "Hamjamiyat"] },
                { title: "Yordam", links: ["Hujjatlar", "Aloqa", "Xavfsizlik", "Narxlar"] }
              ].map((cat) => (
                <div key={cat.title} className="space-y-8">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] italic">{cat.title}</h4>
                  <ul className="space-y-4">
                    {cat.links.map(link => (
                      <li key={link}><Link to="#" className="text-sm font-black text-slate-400 hover:text-primary uppercase italic tracking-widest transition-colors">{link}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-16 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
              © 2026 MetaEdu AI. Barcha huquqlar himoyalangan.
            </div>
            <div className="flex gap-10 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
               <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
               <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
