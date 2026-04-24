import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  
  if (user) {
    if (roles.includes("admin")) return <Navigate to="/admin" replace />;
    if (roles.includes("teacher")) return <Navigate to="/teacher" replace />;
    return <Navigate to="/dashboard" replace />;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold font-serif text-foreground">MetaEdu</h1>
          <p className="mt-2 text-muted-foreground">Yangi hisob yarating</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif">Ro'yxatdan o'tish</CardTitle>
            <CardDescription>Ma'lumotlaringizni kiriting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">To'liq ism</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ism Familiya" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 belgi" required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={role} onValueChange={(v: "student" | "teacher") => setRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Talaba</SelectItem>
                    <SelectItem value="teacher">O'qituvchi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ro'yxatdan o'tish
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Kirish</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
