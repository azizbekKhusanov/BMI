import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, Brain, ArrowRight,
  BarChart3, Users, ShieldCheck,
  ClipboardList, Twitter, Instagram, Linkedin
} from "lucide-react";
import { Card } from "@/components/ui/card";

const Index = () => {
  const { user, roles, loading } = useAuth();

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Meta<span className="text-primary">Edu</span></span>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-8">
            {["Kurslar", "Metakognitsiya", "O'qituvchilar", "Narxlar"].map((item) => (
              <Link key={item} to="#" className="font-medium text-sm text-slate-600 hover:text-primary transition-colors">{item}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="font-medium text-slate-600 hover:text-primary rounded-lg px-6 h-10">Kirish</Button>
            </Link>
            <Link to="/register">
              <Button className="font-semibold rounded-lg px-6 h-10 bg-slate-900 text-white hover:bg-primary transition-all">Boshlash</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mt-20">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50">
          {/* Subtle Glow Background */}
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="container relative mx-auto px-6 lg:px-12 z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-2">
                🚀 Yangi avlod ta'lim tizimi
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                <span className="text-primary">Metakognitiv</span> o'quv platformasi
              </h1>

              <p className="text-lg md:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl">
                Sun'iy intellekt va metakognitiv tahlil yordamida 
                talabalarda o'z-o'zini boshqarish ko'nikmalarini rivojlantiruvchi 
                zamonaviy ta'lim muhiti.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/register">
                  <Button size="lg" className="h-11 px-8 rounded-lg font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-md">
                    Ro'yxatdan o'tish <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="h-11 px-8 rounded-lg font-semibold border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all">
                    Tizimga kirish
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-col items-center text-center gap-4 mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Nega aynan MetaEdu?</h2>
              <p className="text-slate-600 font-normal text-lg">
                Bizning platforma zamonaviy ta'limning eng ilg'or usullarini sun'iy intellekt bilan birlashtiradi.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: Brain, 
                  title: "Metakognitiv tahlil", 
                  desc: "Biz nafaqat bilim beramiz, balki talabaning qanday o'rganayotganini chuqur tahlil qilamiz.",
                  color: "text-primary", bg: "bg-primary/10" 
                },
                { 
                  icon: Brain, 
                  title: "AI integratsiyasi", 
                  desc: "Sun'iy intellekt har bir talaba uchun shaxsiy ta'lim trayektoriyasini dinamik ravishda tuzadi.",
                  color: "text-blue-500", bg: "bg-blue-100" 
                },
                { 
                  icon: BarChart3, 
                  title: "Live analitika", 
                  desc: "O'qituvchilar talabalarning o'zlashtirishini real vaqtda interaktiv grafiklarda kuzatishadi.",
                  color: "text-indigo-500", bg: "bg-indigo-100" 
                },
                { 
                  icon: Users, 
                  title: "Aqlli hamjamiyat", 
                  desc: "Talabalar va o'qituvchilar o'rtasida jonli muloqot va AI-moderatsiya qilingan muhit.",
                  color: "text-rose-500", bg: "bg-rose-100" 
                },
                { 
                  icon: ShieldCheck, 
                  title: "Maksimal himoya", 
                  desc: "Sizning barcha o'quv ma'lumotlaringiz va yutuqlaringiz yuqori darajada xavfsiz saqlanadi.",
                  color: "text-emerald-500", bg: "bg-emerald-100" 
                },
                { 
                  icon: ClipboardList, 
                  title: "Reality check", 
                  desc: "Har bir darsdan so'ng o'z bilmingizni sinab ko'rish va o'z-o'zini baholash tizimi.",
                  color: "text-amber-500", bg: "bg-amber-100" 
                },
              ].map((f, i) => (
                <div key={i}>
                  <Card className="border border-slate-200 shadow-sm bg-white rounded-xl p-6 space-y-4 hover:shadow-md transition-shadow h-full">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${f.bg} ${f.color}`}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                      <p className="text-slate-600 font-normal text-sm">{f.desc}</p>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats / Value Prop Section */}
        <section className="py-24 bg-slate-50 border-y border-slate-200">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="flex flex-col items-center text-center gap-4 mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Platforma afzalliklari</h2>
              <p className="text-slate-600 font-normal text-lg">
                Talabalar va o'qituvchilar uchun mo'ljallangan yagona ekotizim
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: "Metakognitiv sikl",
                  desc: "Talabalar dars oldidan taxmin qiladi, darsdan so'ng o'z bilimini baholaydi va refleksiya yozadi — bu sikl chuqur o'rganishni ta'minlaydi."
                },
                {
                  icon: BarChart3,
                  title: "AI tahlil",
                  desc: "Groq AI (Llama 3.1) yordamida har bir talabaning o'zlashtirish darajasi tahlil qilinadi va shaxsiy tavsiyalar beriladi."
                },
                {
                  icon: Users,
                  title: "O'qituvchi monitoringi",
                  desc: "O'qituvchilar talabalarning metakognitiv ko'rsatkichlarini real vaqtda kuzatib boradi va muammolarni erta aniqlaydi."
                }
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 space-y-4 shadow-sm">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{stat.title}</h3>
                    <p className="text-sm text-slate-600">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 lg:px-12 py-24">
          <div className="rounded-3xl bg-slate-900 p-12 lg:p-20 text-center shadow-xl relative overflow-hidden">
            {/* CTA Background Decorative */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px]"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>
            
            <div className="space-y-8 max-w-3xl mx-auto relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Kelajak ta'limiga bugun qo'shiling
              </h2>
              <p className="text-lg text-slate-300 font-normal max-w-2xl mx-auto">
                MetaEdu platformasida o'z o'quv jarayonini ongli boshqarishni o'rganing va 
                akademik ko'rsatkichlaringizni yangi bosqichga olib chiqing.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg" className="h-12 px-8 rounded-lg font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-md">
                    Ro'yxatdan o'tish
                  </Button>
                </Link>
                <Link to="/student/courses">
                  <Button variant="outline" size="lg" className="h-12 px-8 rounded-lg font-semibold border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm">
                    Kurslarni ko'rish
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-10">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">Meta<span className="text-primary">Edu</span></span>
              </Link>
              <p className="text-sm text-slate-600 font-normal max-w-md leading-relaxed">
                Raqamli metakognitiv o'quv platformasi orqali ta'limda inqilob qiling. Har bir talabaning salohiyatini birgalikda ochamiz.
              </p>
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <Twitter className="h-5 w-5" />
                 </div>
                 <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <Instagram className="h-5 w-5" />
                 </div>
                 <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all cursor-pointer">
                    <Linkedin className="h-5 w-5" />
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 lg:col-span-2">
              {[
                { title: "Loyiha", links: ["Biz haqimizda", "Imkoniyatlar", "Kurslar", "Hamjamiyat"] },
                { title: "Yordam", links: ["Hujjatlar", "Aloqa", "Xavfsizlik", "Narxlar"] }
              ].map((cat) => (
                <div key={cat.title} className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900">{cat.title}</h4>
                  <ul className="space-y-3">
                    {cat.links.map(link => (
                      <li key={link}><Link to="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">{link}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs font-medium text-slate-500">
              © 2026 MetaEdu AI. Barcha huquqlar himoyalangan.
            </div>
            <div className="flex gap-6 text-xs font-medium text-slate-500">
               <Link to="#" className="hover:text-primary transition-colors">Maxfiylik siyosati</Link>
               <Link to="#" className="hover:text-primary transition-colors">Foydalanish shartlari</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
