import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const { user, profile, roles } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, bio }).eq("user_id", user.id);
    if (error) toast.error("Xatolik"); else toast.success("Profil yangilandi!");
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container max-w-lg py-8 space-y-6">
        <h1 className="text-3xl font-bold font-serif">Profil</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Shaxsiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                {fullName?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>To'liq ism</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Input value={roles.join(", ")} disabled />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="O'zingiz haqingizda..." />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
