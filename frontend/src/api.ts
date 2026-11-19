import type { Page, Product, ProductInput, ProductStatus } from './types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'token';

export const tokenStorage = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignorar */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignorar */ } },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Convierte errores técnicos del backend en mensajes amigables. */
export function friendlyMessage(status: number, body: any): string {
  if (status === 0) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  if (status === 401) return 'Tu sesión expiró o las credenciales no son válidas.';
  if (status === 404) return body?.message ? String(body.message) : 'El producto ya no existe.';
  // 409 = conflicto: correo repetido, stock insuficiente... el backend explica cuál
  if (status === 409) return body?.message ? String(body.message) : 'Ya existe un registro con esos datos.';
  if (status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
  if (status === 400 && body?.message) {
    return Array.isArray(body.message) ? body.message.join('. ') : String(body.message);
  }
  if (status >= 500) return 'Ocurrió un problema en el servidor. Inténtalo más tarde.';
  return 'No se pudo completar la acción.';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, friendlyMessage(0, null));
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, friendlyMessage(res.status, body));
  return body as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ accessToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string) =>
    request<{ id: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  list: (page: number, limit: number, search: string, status: ProductStatus = 'active') =>
    request<Page<Product>>(`/products?page=${page}&limit=${limit}&status=${status}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  create: (p: ProductInput) => request<Product>('/products', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: string, p: Partial<ProductInput>) =>
    request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  /** Despublica (el backend no borra el registro) */
  remove: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),
  reactivate: (id: string) => request<Product>(`/products/${id}/reactivar`, { method: 'PATCH' }),
  /** Venta: descuenta quantity × factor de la presentación del inventario */
  registerExit: (id: string, presentationId: string, quantity: number) =>
    request<{ product: Product; deducted: number }>(`/products/${id}/salidas`, {
      method: 'POST', body: JSON.stringify({ presentationId, quantity }),
    }),
};
