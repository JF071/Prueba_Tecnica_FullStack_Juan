export type BaseUnit = 'kg' | 'g' | 't' | 'lb' | 'arroba' | 'L' | 'mL' | 'gal' | 'und';

/** Forma de venta: "Bulto 50 kg" contiene factor=50 unidades base y cuesta price. */
export interface Presentation {
  _id?: string;
  name: string;
  factor: number;
  price: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  baseUnit: BaseUnit;
  /** Existencias en la unidad base */
  stock: number;
  presentations: Presentation[];
}

export type ProductInput = Omit<Product, '_id'>;
export interface Page<T> { items: T[]; total: number; page: number; limit: number; totalPages: number }
