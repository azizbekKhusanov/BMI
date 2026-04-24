import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ShieldCheck } from "lucide-react";

const TeacherMonitoring = () => {
  return (
    <Layout>
      <div className="container py-8 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight text-primary">Progress Monitoring</h1>
            <p className="text-muted-foreground mt-1">O'quvchilarning real vaqtda darslarni o'zlashtirish jarayoni.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-700 text-sm font-bold border border-emerald-100">
            <ShieldCheck className="h-4 w-4" /> Jonli kuzatuv faol
          </div>
        </div>

        <Card className="border-none shadow-xl bg-gradient-to-br from-background to-secondary/30 rounded-3xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
          <Activity className="h-20 w-20 text-emerald-500/20 animate-pulse mb-6" />
          <h3 className="text-2xl font-serif font-bold text-foreground/70">Monitoring boshlanmoqda...</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Yaqinda bu yerda talabalarning darslarni qanday o'tayotganini jonli efirda kuzatishingiz mumkin bo'ladi.
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default TeacherMonitoring;
