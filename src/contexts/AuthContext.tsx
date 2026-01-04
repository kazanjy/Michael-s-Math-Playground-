import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, ChildProfile } from '../types';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: Profile | null;
  childProfiles: ChildProfile[];
  currentChild: ChildProfile | null;
}

interface AuthContextType extends AuthState {
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  selectChild: (childId: string) => void;
  createChildProfile: (name: string) => Promise<ChildProfile>;
  updateChildXp: (childId: string, xpToAdd: number) => Promise<void>;
  // Demo mode for development
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Local storage keys for demo mode
const DEMO_PROFILE_KEY = 'math_playground_demo_profile';
const DEMO_CHILDREN_KEY = 'math_playground_demo_children';
const DEMO_CURRENT_CHILD_KEY = 'math_playground_demo_current_child';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    profile: null,
    childProfiles: [],
    currentChild: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check for demo mode first
      const demoProfile = localStorage.getItem(DEMO_PROFILE_KEY);
      if (demoProfile) {
        const profile = JSON.parse(demoProfile) as Profile;
        const children = JSON.parse(localStorage.getItem(DEMO_CHILDREN_KEY) || '[]') as ChildProfile[];
        const currentChildId = localStorage.getItem(DEMO_CURRENT_CHILD_KEY);
        const currentChild = children.find(c => c.id === currentChildId) || null;

        setState({
          isLoading: false,
          isAuthenticated: true,
          profile,
          childProfiles: children,
          currentChild,
        });
        return;
      }

      // Check Supabase if configured
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const { data: childProfiles } = await supabase
            .from('child_profiles')
            .select('*')
            .eq('parent_id', session.user.id);

          setState({
            isLoading: false,
            isAuthenticated: true,
            profile: profile ? {
              id: profile.id,
              email: profile.email,
              isParent: profile.is_parent,
              createdAt: profile.created_at,
            } : null,
            childProfiles: (childProfiles || []).map(c => ({
              id: c.id,
              parentId: c.parent_id,
              name: c.name,
              avatar: c.avatar,
              currentRank: c.current_rank,
              totalXp: c.total_xp,
              createdAt: c.created_at,
            })),
            currentChild: null,
          });
          return;
        }
      }

      setState(s => ({ ...s, isLoading: false }));
    };

    initAuth();
  }, []);

  const signInWithMagicLink = async (email: string): Promise<{ error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase not configured. Use demo mode for development.' };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  };

  const signOut = async () => {
    // Clear demo mode
    localStorage.removeItem(DEMO_PROFILE_KEY);
    localStorage.removeItem(DEMO_CHILDREN_KEY);
    localStorage.removeItem(DEMO_CURRENT_CHILD_KEY);

    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }

    setState({
      isLoading: false,
      isAuthenticated: false,
      profile: null,
      childProfiles: [],
      currentChild: null,
    });
  };

  const enterDemoMode = () => {
    const demoProfile: Profile = {
      id: 'demo-user',
      email: 'demo@example.com',
      isParent: true,
      createdAt: new Date().toISOString(),
    };

    const demoChild: ChildProfile = {
      id: 'demo-child-1',
      parentId: 'demo-user',
      name: 'Pilot',
      avatar: 'jet-1',
      currentRank: 1,
      totalXp: 0,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(demoProfile));
    localStorage.setItem(DEMO_CHILDREN_KEY, JSON.stringify([demoChild]));
    localStorage.setItem(DEMO_CURRENT_CHILD_KEY, demoChild.id);

    setState({
      isLoading: false,
      isAuthenticated: true,
      profile: demoProfile,
      childProfiles: [demoChild],
      currentChild: demoChild,
    });
  };

  const selectChild = (childId: string) => {
    const child = state.childProfiles.find(c => c.id === childId);
    if (child) {
      localStorage.setItem(DEMO_CURRENT_CHILD_KEY, childId);
      setState(s => ({ ...s, currentChild: child }));
    }
  };

  const createChildProfile = async (name: string): Promise<ChildProfile> => {
    const newChild: ChildProfile = {
      id: `child-${Date.now()}`,
      parentId: state.profile?.id || 'demo-user',
      name,
      avatar: 'jet-1',
      currentRank: 1,
      totalXp: 0,
      createdAt: new Date().toISOString(),
    };

    // For demo mode, save to localStorage
    if (state.profile?.id === 'demo-user') {
      const updatedChildren = [...state.childProfiles, newChild];
      localStorage.setItem(DEMO_CHILDREN_KEY, JSON.stringify(updatedChildren));
      setState(s => ({ ...s, childProfiles: updatedChildren }));
    } else if (isSupabaseConfigured()) {
      // Save to Supabase
      await supabase.from('child_profiles').insert({
        id: newChild.id,
        parent_id: newChild.parentId,
        name: newChild.name,
        avatar: newChild.avatar,
        current_rank: newChild.currentRank,
        total_xp: newChild.totalXp,
      });
      setState(s => ({ ...s, childProfiles: [...s.childProfiles, newChild] }));
    }

    return newChild;
  };

  const updateChildXp = async (childId: string, xpToAdd: number) => {
    const child = state.childProfiles.find(c => c.id === childId);
    if (!child) return;

    const updatedChild = {
      ...child,
      totalXp: child.totalXp + xpToAdd,
    };

    // Update rank based on XP
    const { RANKS } = await import('../types');
    const newRank = RANKS.reduce((rank, r) =>
      updatedChild.totalXp >= r.xpRequired ? r : rank, RANKS[0]);
    updatedChild.currentRank = newRank.level;

    // Update state and storage
    const updatedChildren = state.childProfiles.map(c =>
      c.id === childId ? updatedChild : c
    );

    if (state.profile?.id === 'demo-user') {
      localStorage.setItem(DEMO_CHILDREN_KEY, JSON.stringify(updatedChildren));
    } else if (isSupabaseConfigured()) {
      await supabase
        .from('child_profiles')
        .update({ total_xp: updatedChild.totalXp, current_rank: updatedChild.currentRank })
        .eq('id', childId);
    }

    setState(s => ({
      ...s,
      childProfiles: updatedChildren,
      currentChild: s.currentChild?.id === childId ? updatedChild : s.currentChild,
    }));
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      signInWithMagicLink,
      signOut,
      selectChild,
      createChildProfile,
      updateChildXp,
      enterDemoMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
