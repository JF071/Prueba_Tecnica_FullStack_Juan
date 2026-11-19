import { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, Loader2, Package, Plus, Search, Trash2, X, XCircle } from 'lucide-react';
import { useProducts } from '../store/productStore';
import type { Product } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { Pagination } from './Pagination';
import { ProductForm } from './ProductForm';
import { IconButton } from './ui/IconButton';

const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function ProductsPage() {
  const s = useProducts();
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => { s.load(); /* carga inicial */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda con debounce: evita una petición por cada tecla
  useEffect(() => {
    const t = setTimeout(() => { if (q !== s.search) s.setSearch(q); }, 400);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Los avisos de éxito se cierran solos; los de error se quedan hasta que el usuario los lea y cierre
  useEffect(() => {
    if (s.notice?.type !== 'ok') return;
    const t = setTimeout(s.dismiss, 3000);
    return () => clearTimeout(t);
  }, [s.notice]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDelete = () => {
    if (deleting) s.remove(deleting._id);
    setDeleting(null);
  };

  const actions = (p: Product) => (
    <>
      <IconButton label="Editar" tone="amber" onClick={() => setEditing(p)}><Edit2 size={14} /></IconButton>
      <IconButton label="Eliminar" tone="red" onClick={() => setDeleting(p)}><Trash2 size={14} /></IconButton>
    </>
  );

  const empty = !s.loading && s.items.length === 0;

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {s.total} producto{s.total !== 1 ? 's' : ''} {s.search ? 'encontrado' + (s.total !== 1 ? 's' : '') : 'registrado' + (s.total !== 1 ? 's' : '')}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="card p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input pl-9 pr-9" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Listado */}
      <div className="card relative" aria-busy={s.loading}>
        {s.loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/60">
            <Loader2 size={22} className="animate-spin text-primary" />
          </div>
        )}

        {empty ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <div className="rounded-xl bg-muted p-4"><Package size={28} className="text-muted-foreground" /></div>
            <p className="text-sm font-semibold text-foreground">{s.search ? 'Sin resultados' : 'Aún no hay productos'}</p>
            <p className="text-xs text-muted-foreground">{s.search ? 'Intenta con otro término de búsqueda' : 'Crea el primero con el botón "Nuevo producto"'}</p>
          </div>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="th rounded-tl-xl">Producto</th>
                    <th className="th">Categoría</th>
                    <th className="th text-right">Precio</th>
                    <th className="th text-right">Stock</th>
                    <th className="th rounded-tr-xl text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.items.map((p) => (
                    <tr key={p._id} className="group transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        {p.description && <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground" title={p.description}>{p.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{money.format(p.price)}</td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">{p.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">{actions(p)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil: tarjetas */}
            <ul className="divide-y divide-border md:hidden">
              {s.items.map((p) => (
                <li key={p._id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{p.category} · Stock {p.stock}</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">{money.format(p.price)}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">{actions(p)}</div>
                </li>
              ))}
            </ul>
          </>
        )}

        <Pagination page={s.page} totalPages={s.totalPages} total={s.total} limit={s.limit} onChange={s.setPage} onLimitChange={s.setLimit} />
      </div>

      {/* Aviso flotante (abajo a la derecha, como en el CRM) */}
      {s.notice && (
        <div role="status"
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-2 rounded-xl border bg-card px-4 py-3 text-sm shadow-modal animate-slide-up ${
            s.notice.type === 'ok' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}>
          {s.notice.type === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <XCircle size={16} className="mt-0.5 flex-shrink-0" />}
          <span className="flex-1">{s.notice.text}</span>
          <button onClick={s.dismiss} aria-label="Cerrar aviso" className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing === 'new' ? undefined : editing}
          onSubmit={(d) => s.save(d, editing === 'new' ? undefined : editing._id)}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar producto"
          message={<>¿Seguro que quieres eliminar <span className="font-bold">{deleting.name}</span>?</>}
          detail="Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
