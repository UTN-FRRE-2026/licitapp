import { create } from 'zustand';
import type { UserProfile, UserRole } from '../types';

interface AuthState {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,

  setUser: (user) => set({ user, role: user?.role ?? null }),

  setLoading: (loading) => set({ loading }),

  clear: () => set({ user: null, role: null, loading: false }),
}));
