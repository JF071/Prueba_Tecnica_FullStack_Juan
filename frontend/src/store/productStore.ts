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
  setLimit: (limit: number) => Promise<void>;
  setSearch: (s: string) => Promise<void>;
  /** Devuelve null si guardó bien, o el mensaje de error para mostrarlo en el formulario. */
  save: (data: ProductInput, id?: string) => Promise<string | null>;
  remove: (id: string) => Promise<void>;
  dismiss: () => void;
}

type ProductData = Pick<ProductState, 'items' | 'total' | 'page' | 'limit' | 'totalPages' | 'search' | 'loading' | 'notice'>;

const initialData: ProductData = {
  items: [], total: 0, page: 1, limit: 10, totalPages: 1, search: '', loading: false, notice: null,
};

/** Número de la última carga pedida: sirve para descartar respuestas viejas. */
let lastRequest = 0;

export const useProducts = create<ProductState>((set, get) => {
  /** Centraliza el manejo de errores: si la sesión caduca, cierra sesión. */
  const errorText = (e: unknown) => (e instanceof ApiError ? e.message : 'Error inesperado');
  const logoutIfExpired = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) useAuth.getState().logout();
  };
  const fail = (e: unknown) => {
    logoutIfExpired(e);
    set({ loading: false, notice: { type: 'error', text: errorText(e) } });
  };

  return {
    ...initialData,

    async load() {
      const { page, limit, search } = get();
      const requestId = ++lastRequest;
      set({ loading: true });
      try {
        const res = await api.list(page, limit, search);
        // Si mientras esperábamos se pidió otra página o búsqueda, esta respuesta ya no sirve
        if (requestId !== lastRequest) return;
        // Si borraste el último elemento de la última página, retrocede
        if (res.items.length === 0 && page > 1) {
          set({ page: page - 1 });
          return get().load();
        }
        set({ items: res.items, total: res.total, totalPages: res.totalPages, loading: false });
      } catch (e) {
        if (requestId === lastRequest) fail(e);
      }
    },
    async setPage(page) { set({ page }); await get().load(); },
    async setLimit(limit) { set({ limit, page: 1 }); await get().load(); },
    async setSearch(search) { set({ search, page: 1 }); await get().load(); },

    async save(data, id) {
      try {
        if (id) await api.update(id, data); else await api.create(data);
        set({ notice: { type: 'ok', text: id ? 'Producto actualizado' : 'Producto creado' } });
        await get().load();
        return null;
      } catch (e) {
        // No se usa el aviso de la página: quedaría oculto detrás del modal
        logoutIfExpired(e);
        return errorText(e);
      }
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

// Al cerrar sesión se borran los productos, para que el siguiente usuario no vea datos del anterior.
// Se invalida también cualquier carga en curso.
useAuth.subscribe((auth, prev) => {
  if (prev.token && !auth.token) {
    lastRequest++;
    useProducts.setState(initialData);
  }
});
