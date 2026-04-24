import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { user, roles, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold font-serif text-foreground">MetaEdu</h1>
          <p className="mt-2 text-muted-foreground">Platformaga kirish</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif">Kirish</CardTitle>
            <CardDescription>Email va parol orqali kiring</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kirish
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Hisobingiz yo'qmi?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Ro'yxatdan o'ting</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
