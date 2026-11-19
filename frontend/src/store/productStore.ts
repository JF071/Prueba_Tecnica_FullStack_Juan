import { create } from 'zustand';
import { api, ApiError } from '../api';
import { useAuth } from './authStore';
import type { Product, ProductInput, ProductStatus } from '../types';
import { formatQty } from '../units';

interface ProductState {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  search: string;
  /** 'active' = habilitados, 'inactive' = vista "Ver inactivos" */
  status: ProductStatus;
  loading: boolean;
  notice: { type: 'ok' | 'error'; text: string } | null;
  load: () => Promise<void>;
  setPage: (p: number) => Promise<void>;
  setLimit: (limit: number) => Promise<void>;
  setSearch: (s: string) => Promise<void>;
  setStatus: (s: ProductStatus) => Promise<void>;
  /** Devuelve null si guardó bien, o el mensaje de error para mostrarlo en el formulario. */
  save: (data: ProductInput, id?: string) => Promise<string | null>;
  /** Inhabilita el producto (eliminación lógica) */
  remove: (id: string) => Promise<void>;
  reactivate: (id: string) => Promise<void>;
  /** Igual que save: null si salió bien, o el mensaje de error para el modal. */
  registerExit: (id: string, presentationId: string, quantity: number) => Promise<string | null>;
  dismiss: () => void;
}

type ProductData = Pick<ProductState, 'items' | 'total' | 'page' | 'limit' | 'totalPages' | 'search' | 'status' | 'loading' | 'notice'>;

const initialData: ProductData = {
  items: [], total: 0, page: 1, limit: 10, totalPages: 1, search: '', status: 'active', loading: false, notice: null,
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
  /** Ejecuta una acción sobre un producto, muestra el aviso y recarga la lista. */
  const runAction = async (action: () => Promise<unknown>, okText: string) => {
    try {
      await action();
      set({ notice: { type: 'ok', text: okText } });
      await get().load();
    } catch (e) { fail(e); }
  };

  return {
    ...initialData,

    async load() {
      const { page, limit, search, status } = get();
      const requestId = ++lastRequest;
      set({ loading: true });
      try {
        const res = await api.list(page, limit, search, status);
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
    async setStatus(status) { set({ status, page: 1, items: [] }); await get().load(); },

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
    remove: (id) => runAction(() => api.remove(id), 'Producto inhabilitado'),
    reactivate: (id) => runAction(() => api.reactivate(id), 'Producto reactivado'),

    async registerExit(id, presentationId, quantity) {
      try {
        const { product, deducted } = await api.registerExit(id, presentationId, quantity);
        set({ notice: { type: 'ok', text: `Salida registrada: −${formatQty(deducted, product.baseUnit)}` } });
        await get().load();
        return null;
      } catch (e) {
        logoutIfExpired(e);
        return errorText(e);
      }
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
