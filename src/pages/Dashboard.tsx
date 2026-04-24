import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Trophy, Target, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, profile, roles } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("enrollments")
      .select("*, courses(title, description)")
      .eq("user_id", user.id)
      .then(({ data }) => setEnrollments(data || []));

    supabase
      .from("test_results")
      .select("*, tests(question)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecentResults(data || []));
  }, [user]);

  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + Number(e.progress), 0) / enrollments.length)
    : 0;

  const correctResults = recentResults.filter((r) => r.is_correct).length;

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Salom, {profile?.full_name || "Foydalanuvchi"}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            {roles.includes("teacher") ? "O'qituvchi" : roles.includes("admin") ? "Administrator" : "Talaba"} paneli
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kurslarim</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
              <p className="text-xs text-muted-foreground">Yozilgan kurslar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgProgress}%</div>
              <Progress value={avgProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Testlar</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentResults.length}</div>
              <p className="text-xs text-muted-foreground">Oxirgi natijalar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">To'g'ri javoblar</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{correctResults}/{recentResults.length}</div>
              <p className="text-xs text-muted-foreground">Oxirgi testlarda</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Kurslarim</CardTitle>
              <CardDescription>Yozilgan kurslar va progressingiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>Hali kursga yozilmagansiz</p>
                  <Link to="/courses" className="text-primary text-sm hover:underline mt-1 block">Kurslarni ko'rish →</Link>
                </div>
              ) : (
                enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{e.courses?.title}</p>
                      <p className="text-xs text-muted-foreground">{Math.round(Number(e.progress))}% tugallandi</p>
                    </div>
                    <Progress value={Number(e.progress)} className="w-24" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Oxirgi test natijalari</CardTitle>
              <CardDescription>So'nggi topshirgan testlaringiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>Hali test topshirmadingiz</p>
                </div>
              ) : (
                recentResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <p className="text-sm truncate max-w-[200px]">{r.tests?.question}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${r.is_correct ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.is_correct ? "To'g'ri ✓" : "Noto'g'ri ✗"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
