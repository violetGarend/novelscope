import { create } from "zustand";

interface AuthState {
  user: Record<string, unknown> | null;
  isAuthenticated: boolean;
  login: (credentials: unknown) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: async () => {
    // Placeholder — no-op until auth pages are built
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
