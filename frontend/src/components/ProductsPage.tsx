import { useEffect, useState } from 'react';
import { useAuth } from '../store/authStore';
import { useProducts } from '../store/productStore';
import type { Product } from '../types';
import { Pagination } from './Pagination';
import { ProductForm } from './ProductForm';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function ProductsPage() {
  const s = useProducts();
  const logout = useAuth((a) => a.logout);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { s.load(); /* carga inicial */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda con debounce: evita una petición por cada tecla
  useEffect(() => {
    const t = setTimeout(() => { if (q !== s.search) s.setSearch(q); }, 400);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDelete = (p: Product) => { if (window.confirm(`¿Eliminar "${p.name}"?`)) s.remove(p._id); };

  return (
    <main className="container">
      <header className="top">
        <h1>Productos</h1>
        <div className="top-actions">
          <button className="primary" onClick={() => setEditing('new')}>+ Nuevo producto</button>
          <button onClick={logout}>Salir</button>
        </div>
      </header>

      {s.notice && (
        <div className={`toast ${s.notice.type}`} role="status">
          {s.notice.text}<button aria-label="Cerrar" onClick={s.dismiss}>×</button>
        </div>
      )}

      <input className="search" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />

      <div className="card table-wrap" aria-busy={s.loading}>
        <table>
          <thead><tr><th>Nombre</th><th>Categoría</th><th className="num">Precio</th><th className="num">Stock</th><th /></tr></thead>
          <tbody>
            {s.items.map((p) => (
              <tr key={p._id}>
                <td data-label="Nombre"><strong>{p.name}</strong><small>{p.description}</small></td>
                <td data-label="Categoría">{p.category}</td>
                <td data-label="Precio" className="num">{money.format(p.price)}</td>
                <td data-label="Stock" className="num">{p.stock}</td>
                <td className="row-actions">
                  <button onClick={() => setEditing(p)}>Editar</button>
                  <button className="danger" onClick={() => onDelete(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {!s.loading && s.items.length === 0 && (
              <tr><td colSpan={5} className="empty">{s.search ? 'Sin resultados para tu búsqueda.' : 'Aún no hay productos. ¡Crea el primero!'}</td></tr>
            )}
          </tbody>
        </table>
        {s.loading && <p className="loading">Cargando…</p>}
      </div>

      <Pagination page={s.page} totalPages={s.totalPages} total={s.total} onChange={s.setPage} />

      {editing && (
        <ProductForm
          product={editing === 'new' ? undefined : editing}
          onSubmit={(d) => s.save(d, editing === 'new' ? undefined : editing._id)}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
