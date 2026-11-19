export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}
export type ProductInput = Omit<Product, '_id'>;
export interface Page<T> { items: T[]; total: number; page: number; limit: number; totalPages: number }
