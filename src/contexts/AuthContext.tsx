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
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        );
        
        const fetchPromise = Promise.all([
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);

        const [{ data: profileData, error: profileError }, { data: rolesData, error: rolesError }] = await Promise.race([
          fetchPromise,
          timeoutPromise
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ]) as any;
        
        if (profileError) console.error("Error fetching profile:", profileError);
        if (rolesError) console.error("Error fetching roles:", rolesError);

        setProfile(profileData as Profile || null);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRoles(rolesData ? rolesData.map((r: any) => r.role) : []);
      } catch (err) {
        console.error("Critical error in fetchProfileAndRoles:", err);
      }
    };

    const initializeAuth = async () => {
      // Safety timeout to prevent infinite white screen if Supabase lock is stuck
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 2000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth initialization error:", error);
          setSession(null);
          setUser(null);
          currentUserRef.current = null;
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          currentUserRef.current = session?.user?.id ?? null;
          
          if (session?.user) {
            // Profile orqa fonda yuklanadi, loadingni bloklamaydi
            fetchProfileAndRoles(session.user.id);
          }
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      const newUserId = newUser?.id ?? null;
      
      if (newUserId !== currentUserRef.current && (event === 'SIGNED_IN' || newUser)) {
        // Hozirgi holatda loadingni true qilish shart emas, chunki backgroundda yuklaymiz
        // Lekin ba'zi hollarda bu kerak bo'lishi mumkin. Foydalanuvchi so'roviga ko'ra o'zgartiramiz.
      }
      
      currentUserRef.current = newUserId;
      setSession(session);
      setUser(newUser);
      
      try {
        if (newUser) {
          // Profile orqa fonda yuklanadi
          fetchProfileAndRoles(newUser.id);
        } else {
          setProfile(null);
          setRoles([]);
        }
      } catch (err) {
        console.error("Error handling auth state change:", err);
      } finally {
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
