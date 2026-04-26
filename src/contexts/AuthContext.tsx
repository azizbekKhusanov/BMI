/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  profile: Profile | null;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const currentUserRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProfileAndRoles = async (userId: string) => {
      try {
        const [{ data: profileData }, { data: rolesData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);
        setProfile(profileData as Profile);
        setRoles(rolesData ? rolesData.map((r) => r.role) : []);
      } catch (err) {
        console.error(err);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      currentUserRef.current = session?.user?.id ?? null;
      if (session?.user) {
        fetchProfileAndRoles(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      const newUserId = newUser?.id ?? null;
      
      // Only set loading if the user has actually changed (sign in or different user)
      // We check against the Ref to avoid stale closure issues
      if (newUserId !== currentUserRef.current && (event === 'SIGNED_IN' || newUser)) {
        setLoading(true);
      }
      
      currentUserRef.current = newUserId;
      setSession(session);
      setUser(newUser);
      
      if (newUser) {
        fetchProfileAndRoles(newUser.id).then(() => setLoading(false));
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
