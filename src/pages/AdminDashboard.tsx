import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Users, BookOpen, GraduationCap, Shield } from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";

interface AdminUser {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  roles: string[];
}

interface AdminCourse {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [stats, setStats] = useState({ users: 0, courses: 0, enrollments: 0 });

  const fetchData = useCallback(async () => {
    const [profilesRes, coursesRes, enrollmentsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("courses").select("*"),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("*"),
    ]);

    const profilesWithRoles = (profilesRes.data || []).map((p) => ({
      ...p,
      roles: (rolesRes.data || []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
    })) as AdminUser[];

    setUsers(profilesWithRoles);
    setCourses((coursesRes.data as AdminCourse[]) || []);
    setStats({
      users: profilesRes.data?.length || 0,
      courses: coursesRes.data?.length || 0,
      enrollments: enrollmentsRes.count || 0,
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    toast.success("Rol o'zgartirildi");
    fetchData();
  };

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif">Admin paneli</h1>
          <p className="text-muted-foreground">Platforma monitoringi va boshqaruvi</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Foydalanuvchilar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.users}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kurslar</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.courses}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Yozilishlar</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.enrollments}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Foydalanuvchilar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Ism</th>
                    <th className="text-left py-3 px-2 font-medium">Rol</th>
                    <th className="text-left py-3 px-2 font-medium">Harakatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-3 px-2">
                        <p className="font-medium">{u.full_name || "Noma'lum"}</p>
                      </td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-muted">
                          <Shield className="h-3 w-3" /> {u.roles?.[0] || "student"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Select defaultValue={u.roles?.[0] || "student"} onValueChange={(v) => changeRole(u.user_id, v)}>
                          <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Talaba</SelectItem>
                            <SelectItem value="teacher">O'qituvchi</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif">Barcha kurslar</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Kurs</th>
                    <th className="text-left py-3 px-2 font-medium">Holat</th>
                    <th className="text-left py-3 px-2 font-medium">Yaratilgan</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-3 px-2 font-medium">{c.title}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded ${c.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {c.is_published ? "Nashr qilingan" : "Qoralama"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
