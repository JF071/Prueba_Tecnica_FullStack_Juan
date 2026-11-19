import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api';
import { useAuth } from './authStore';
import { useProducts } from './productStore';
import type { Page, Product, ProductInput } from '../types';

// Se simula la API para probar solo la lógica del store
vi.mock('../api', async (importOriginal) => {
  const real = await importOriginal<typeof import('../api')>();
  return {
    ...real,
    api: {
      list: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 }),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      reactivate: vi.fn(),
    },
  };
});
const { api } = await import('../api');

const input: ProductInput = {
  name: 'Semilla de maíz', description: '', category: 'semillas', baseUnit: 'kg', stock: 5,
  presentations: [{ name: 'Bolsa 1 kg', factor: 1, price: 1000 }],
};

describe('productStore.save', () => {
  beforeEach(() => useProducts.setState({ notice: null }));

  it('devuelve null y muestra aviso de éxito al crear', async () => {
    vi.mocked(api.create).mockResolvedValue({ _id: '1', ...input });
    await expect(useProducts.getState().save(input)).resolves.toBeNull();
    expect(useProducts.getState().notice).toEqual({ type: 'ok', text: 'Producto creado' });
  });

  it('devuelve el mensaje de error para mostrarlo dentro del formulario', async () => {
    vi.mocked(api.create).mockRejectedValue(new ApiError(400, 'price must not be less than 0'));
    await expect(useProducts.getState().save(input)).resolves.toBe('price must not be less than 0');
    // El aviso de la página no se usa: quedaría oculto detrás del modal
    expect(useProducts.getState().notice).toBeNull();
  });
});

const product = (name: string): Product => ({ _id: name, ...input, name });
const pageOf = (name: string, page: number): Page<Product> => ({ items: [product(name)], total: 30, page, limit: 10, totalPages: 3 });

describe('productStore.load', () => {
  it('ignora una respuesta vieja que llega después de una más nueva', async () => {
    let resolvePage2!: (p: Page<Product>) => void;
    vi.mocked(api.list)
      .mockImplementationOnce(() => new Promise((r) => { resolvePage2 = r; })) // página 2: lenta
      .mockResolvedValueOnce(pageOf('de-pagina-3', 3)); // página 3: rápida

    const slow = useProducts.getState().setPage(2);
    await useProducts.getState().setPage(3);
    resolvePage2(pageOf('de-pagina-2', 2)); // la respuesta vieja llega al final
    await slow;

    expect(useProducts.getState().page).toBe(3);
    expect(useProducts.getState().items[0].name).toBe('de-pagina-3');
  });
});

describe('inhabilitar / ver inactivos', () => {
  beforeEach(() => vi.mocked(api.list).mockResolvedValue(pageOf('x', 1)));

  it('setStatus pide al backend los inactivos desde la página 1', async () => {
    useProducts.setState({ page: 3, search: '' });
    await useProducts.getState().setStatus('inactive');
    expect(api.list).toHaveBeenLastCalledWith(1, 10, '', 'inactive');
    await useProducts.getState().setStatus('active');
  });

  it('remove inhabilita y reactivate reactiva, mostrando el aviso correspondiente', async () => {
    vi.mocked(api.remove).mockResolvedValue(undefined);
    await useProducts.getState().remove('p1');
    expect(useProducts.getState().notice).toEqual({ type: 'ok', text: 'Producto inhabilitado' });

    vi.mocked(api.reactivate).mockResolvedValue(product('p1'));
    await useProducts.getState().reactivate('p1');
    expect(api.reactivate).toHaveBeenCalledWith('p1');
    expect(useProducts.getState().notice).toEqual({ type: 'ok', text: 'Producto reactivado' });
  });
});

describe('cerrar sesión', () => {
  it('borra los productos del usuario anterior', () => {
    useAuth.setState({ token: 'token-de-prueba' });
    useProducts.setState({ items: [product('privado')], total: 1, page: 2, search: 'algo' });

    useAuth.getState().logout();

    expect(useProducts.getState()).toMatchObject({ items: [], total: 0, page: 1, search: '' });
  });
});
