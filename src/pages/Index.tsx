import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, BarChart3, Brain, ArrowRight } from "lucide-react";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user, roles, loading } = useAuth();

  if (loading) return null;
  if (user) {
    if (roles.includes("admin")) return <Navigate to="/admin" replace />;
    if (roles.includes("teacher")) return <Navigate to="/teacher" replace />;
    return <Navigate to="/student/my-courses" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold font-serif text-foreground">MetaEdu</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Kirish</Button></Link>
            <Link to="/register"><Button>Ro'yxatdan o'tish</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-20 md:py-32 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Brain className="h-4 w-4" /> Metakognitiv o'quv platformasi
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-serif max-w-3xl mx-auto leading-tight">
            Raqamli ko'nikmalarni <span className="text-primary">rivojlantiring</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            O'z-o'zini baholash, progressni kuzatish va interaktiv testlar orqali ta'lim olishning yangi usuli
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/register"><Button size="lg">Boshlash <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/login"><Button variant="outline" size="lg">Kirish</Button></Link>
          </div>
        </section>

        <section className="container pb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "Interaktiv kurslar", desc: "Video, matn va quiz formatidagi darslar bilan o'rganing" },
              { icon: BarChart3, title: "Progress kuzatuvi", desc: "O'z yutuqlaringizni real vaqtda kuzating va tahlil qiling" },
              { icon: GraduationCap, title: "O'z-o'zini baholash", desc: "Metakognitiv ko'nikmalaringizni rivojlantiring" },
            ].map((f, i) => (
              <div key={i} className="text-center space-y-3 p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif font-bold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 MetaEdu — Raqamli metakognitiv o'quv platformasi
        </div>
      </footer>
    </div>
  );
};

export default Index;
