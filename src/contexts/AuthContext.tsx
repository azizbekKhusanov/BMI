import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: any | null;
  roles: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  profile: null,
  roles: [],
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfileAndRoles = async (userId: string) => {
      try {
        const [{ data: profileData }, { data: rolesData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);
        setProfile(profileData);
        setRoles(rolesData ? rolesData.map((r: any) => r.role) : []);
      } catch (err) {
        console.error(err);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndRoles(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchProfileAndRoles(session.user.id).then(() => setLoading(false));
      } else {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, profile, roles }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
