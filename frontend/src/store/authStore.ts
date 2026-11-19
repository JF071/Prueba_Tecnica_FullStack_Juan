import { create } from 'zustand';
import { api, ApiError, tokenStorage } from '../api';

interface AuthState {
  token: string | null;
  loading: boolean;
  error: string | null;
  submit: (mode: 'login' | 'register', email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: tokenStorage.get(),
  loading: false,
  error: null,
  async submit(mode, email, password) {
    set({ loading: true, error: null });
    try {
      if (mode === 'register') await api.register(email, password);
      const { accessToken } = await api.login(email, password);
      tokenStorage.set(accessToken);
      set({ token: accessToken, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof ApiError ? e.message : 'Error inesperado' });
    }
  },
  logout() {
    tokenStorage.clear();
    set({ token: null });
  },
}));
