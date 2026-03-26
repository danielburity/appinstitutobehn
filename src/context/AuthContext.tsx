import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Role = 'admin' | 'member' | null;

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  subscription_status: 'active' | 'inactive' | 'past_due' | 'canceled' | null;
  subscription_id: string | null;
  migrated: boolean;
  selo_approved: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isMember: boolean;
  loadingProfile: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, migrated, selo_approved, subscription_status, subscription_id')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          role: (data.role as Role) ?? null,
          subscription_status: data.subscription_status ?? null,
          subscription_id: data.subscription_id ?? null,
          migrated: !!data.migrated,
          selo_approved: !!data.selo_approved,
        });
      } else {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, email: user.email, role: 'member' }, { onConflict: 'id' });
        const { data: d2 } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (d2) {
          setProfile({
            id: d2.id,
            email: d2.email,
            full_name: d2.full_name,
            avatar_url: d2.avatar_url,
            role: (d2.role as Role) ?? null,
            subscription_status: d2.subscription_status ?? null,
            subscription_id: d2.subscription_id ?? null,
            migrated: !!d2.migrated,
            selo_approved: !!d2.selo_approved,
          });
        }
      }
      setLoadingProfile(false);
    }
    loadProfile();
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, migrated, selo_approved, subscription_status, subscription_id')
      .eq('id', user.id)
      .single();
    if (!error && data) {
      setProfile({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        role: (data.role as Role) ?? null,
        subscription_status: data.subscription_status ?? null,
        subscription_id: data.subscription_id ?? null,
        migrated: !!data.migrated,
        selo_approved: !!data.selo_approved,
      });
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    isAdmin: (() => {
      const env = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || '';
      const list = env.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const byEnv = user?.email ? list.includes(user.email.toLowerCase()) : false;
      return byEnv || profile?.role === 'admin';
    })(),
    isMember: (() => {
      const env = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || '';
      const list = env.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const byEnv = user?.email ? list.includes(user.email.toLowerCase()) : false;
      const isPremium = profile?.subscription_status === 'active';
      return byEnv || profile?.role === 'admin' || isPremium;
    })(),
    loadingProfile,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUp(email, password) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    async signOut() {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e: unknown) {
        const name = (e as { name?: string })?.name;
        const msg = (e as { message?: string })?.message || '';
        if (name === 'AbortError' || msg.includes('ERR_ABORTED')) return;
        // silencia erros de rede ocasionais do dev server
      }
    },
    refreshProfile,
  }), [user, session, profile, loadingProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
