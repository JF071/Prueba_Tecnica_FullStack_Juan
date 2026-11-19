import { create } from 'zustand';
import { api, ApiError } from '../api';
import { useAuth } from './authStore';
import type { Product, ProductInput } from '../types';

interface ProductState {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  loading: boolean;
  notice: { type: 'ok' | 'error'; text: string } | null;
  load: () => Promise<void>;
  setPage: (p: number) => Promise<void>;
  setSearch: (s: string) => Promise<void>;
  save: (data: ProductInput, id?: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
  dismiss: () => void;
}

export const useProducts = create<ProductState>((set, get) => {
  /** Centraliza el manejo de errores: si la sesión caduca, cierra sesión. */
  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) useAuth.getState().logout();
    set({ loading: false, notice: { type: 'error', text: e instanceof ApiError ? e.message : 'Error inesperado' } });
  };

  return {
    items: [], total: 0, page: 1, limit: 10, totalPages: 1, search: '', loading: false, notice: null,

    async load() {
      const { page, limit, search } = get();
      set({ loading: true });
      try {
        const res = await api.list(page, limit, search);
        // Si borraste el último elemento de la última página, retrocede
        if (res.items.length === 0 && page > 1) {
          set({ page: page - 1 });
          return get().load();
        }
        set({ items: res.items, total: res.total, totalPages: res.totalPages, loading: false });
      } catch (e) { fail(e); }
    },
    async setPage(page) { set({ page }); await get().load(); },
    async setSearch(search) { set({ search, page: 1 }); await get().load(); },

    async save(data, id) {
      try {
        if (id) await api.update(id, data); else await api.create(data);
        set({ notice: { type: 'ok', text: id ? 'Producto actualizado' : 'Producto creado' } });
        await get().load();
        return true;
      } catch (e) { fail(e); return false; }
    },
    async remove(id) {
      try {
        await api.remove(id);
        set({ notice: { type: 'ok', text: 'Producto eliminado' } });
        await get().load();
      } catch (e) { fail(e); }
    },
    dismiss: () => set({ notice: null }),
  };
});
