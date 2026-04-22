import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser, Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types/domain";

export type AppMode = "grower" | "operator";

interface AuthState {
  user: SupaUser | null;
  session: Session | null;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    primaryAccountType?: string | null;
    enabledAccountTypes?: string[];
    onboardingCompleted?: boolean;
    suspendedAt?: string | null;
  } | null;
  roles: UserRole[];
  activeMode: AppMode;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: AppMode) => boolean;
  canSwitchRoles: boolean;
  setActiveMode: (mode: AppMode) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
      .select("first_name, last_name, email, avatar_url, primary_account_type, enabled_account_types, onboarding_completed, suspended_at")
      .eq("user_id", userId)
      .single();

    if (prof) {
      const enabledTypes = (prof.enabled_account_types as string[] | null) || [];
      setProfile({
        firstName: prof.first_name,
        lastName: prof.last_name,
        email: prof.email,
        avatarUrl: prof.avatar_url ?? undefined,
        primaryAccountType: prof.primary_account_type,
        enabledAccountTypes: enabledTypes,
        onboardingCompleted: prof.onboarding_completed ?? false,
        suspendedAt: (prof as any).suspended_at ?? null,
      });
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roleList = (userRoles || []).map((r) => r.role as UserRole);
    setRoles(roleList);

    // Auto-set mode based on primary account type or roles
    const stored = localStorage.getItem("ph_active_mode");
    if (!stored && prof) {
      const primary = prof.primary_account_type;
      if (primary === "operator") {
        setActiveMode("operator");
      } else if (primary === "grower") {
        setActiveMode("grower");
      } else if (roleList.length > 0) {
        if (roleList.includes("operator") && !roleList.includes("grower")) {
          setActiveMode("operator");
        }
      }
    }
  }, [setActiveMode]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  }, []);

  // Derived state
  const hasRole = useCallback((role: AppMode): boolean => {
    if (!profile) return false;
    const enabled = profile.enabledAccountTypes || [];
    // User has the role if it's in enabled_account_types or in user_roles
    return enabled.includes(role) || roles.includes(role as UserRole);
  }, [profile, roles]);

  const canSwitchRoles = hasRole("grower") && hasRole("operator");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

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
      hasRole,
      canSwitchRoles,
      setActiveMode,
      signOut,
      refreshProfile,
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
