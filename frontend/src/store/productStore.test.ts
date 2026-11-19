import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api';
import { useProducts } from './productStore';

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
    },
  };
});
const { api } = await import('../api');

const input = { name: 'Semilla de maíz', description: '', price: 1000, stock: 5, category: 'semillas' };

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
