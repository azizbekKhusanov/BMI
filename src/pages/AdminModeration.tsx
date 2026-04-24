import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminModeration = () => {
  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif">Moderatsiya</h1>
          <p className="text-muted-foreground mt-1">Test savollari va resurslarni tekshirish.</p>
        </div>
        <Card className="border-dashed border-2 bg-muted/40">
          <CardHeader>
            <CardTitle>Tez kunda</CardTitle>
            <CardDescription>Ushbu sahifa ustida ishlanmoqda...</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center text-muted-foreground/50">
            Vaqtincha bo'sh oyna
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminModeration;
