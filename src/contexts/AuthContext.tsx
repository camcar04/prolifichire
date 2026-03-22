import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser, Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types/domain";

export type AppMode = "grower" | "operator";

interface AuthState {
  user: SupaUser | null;
  session: Session | null;
  profile: { firstName: string; lastName: string; email: string; avatarUrl?: string } | null;
  roles: UserRole[];
  activeMode: AppMode;
  loading: boolean;
  isAuthenticated: boolean;
  setActiveMode: (mode: AppMode) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthState["profile"]>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeMode, setActiveModeState] = useState<AppMode>(() => {
    const stored = localStorage.getItem("ph_active_mode");
    return (stored === "operator" ? "operator" : "grower") as AppMode;
  });
  const [loading, setLoading] = useState(true);

  const setActiveMode = useCallback((mode: AppMode) => {
    setActiveModeState(mode);
    localStorage.setItem("ph_active_mode", mode);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, avatar_url")
      .eq("user_id", userId)
      .single();

    if (prof) {
      setProfile({
        firstName: prof.first_name,
        lastName: prof.last_name,
        email: prof.email,
        avatarUrl: prof.avatar_url ?? undefined,
      });
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roleList = (userRoles || []).map((r) => r.role as UserRole);
    setRoles(roleList);

    // Auto-set mode based on roles if no stored preference
    const stored = localStorage.getItem("ph_active_mode");
    if (!stored && roleList.length > 0) {
      if (roleList.includes("operator") && !roleList.includes("grower")) {
        setActiveMode("operator");
      }
    }
  }, [setActiveMode]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }, []);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchProfile(existing.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      roles,
      activeMode,
      loading,
      isAuthenticated: !!session,
      setActiveMode,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
