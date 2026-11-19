import { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, EyeOff, Loader2, Package, Plus, RotateCcw, Search, ShoppingCart, X, XCircle } from 'lucide-react';
import { useProducts } from '../store/productStore';
import type { Product } from '../types';
import { formatQty, money, stockEquivalence } from '../units';
import { ConfirmDialog } from './ConfirmDialog';
import { Pagination } from './Pagination';
import { ProductForm } from './ProductForm';
import { StockExitForm } from './StockExitForm';
import { IconButton } from './ui/IconButton';

/** Chips con cada presentación y su precio: "Bulto 50 kg · $145.000" */
function PresentationChips({ p }: { p: Product }) {
  if (!p.presentations?.length) return <span className="text-xs text-amber-600">Sin presentaciones</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {p.presentations.map((pr) => (
        <span key={pr._id ?? pr.name} className="whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-foreground">
          {pr.name} · <span className="font-semibold tabular-nums">{money.format(pr.price)}</span>
        </span>
      ))}
    </div>
  );
}

/** Stock en unidad base + equivalencia en la presentación más grande */
function StockCell({ p, align = 'right' }: { p: Product; align?: 'left' | 'right' }) {
  const eq = stockEquivalence(p.stock, p.presentations ?? []);
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className={`text-sm font-semibold tabular-nums ${p.stock === 0 ? 'text-red-600' : 'text-foreground'}`}>{formatQty(p.stock, p.baseUnit ?? 'und')}</p>
      {eq && <p className="text-[11px] text-muted-foreground">≈ {eq}</p>}
    </div>
  );
}

export function ProductsPage() {
  const s = useProducts();
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [exiting, setExiting] = useState<Product | null>(null);
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

  const inactiveView = s.status === 'inactive';

  // En la vista de despublicados solo se puede volver a publicar (igual que "Reactivar" en el CRM)
  const actions = (p: Product) =>
    inactiveView ? (
      <IconButton label="Volver a publicar" tone="green" onClick={() => s.reactivate(p._id)}><RotateCcw size={14} /></IconButton>
    ) : (
      <>
        {p.presentations?.length > 0 && p.stock > 0 && (
          <IconButton label="Registrar venta" tone="blue" onClick={() => setExiting(p)}><ShoppingCart size={14} /></IconButton>
        )}
        <IconButton label="Editar" tone="amber" onClick={() => setEditing(p)}><Edit2 size={14} /></IconButton>
        <IconButton label="Despublicar" tone="red" onClick={() => setDeleting(p)}><EyeOff size={14} /></IconButton>
      </>
    );

  const empty = !s.loading && s.items.length === 0;
  const plural = s.total !== 1 ? 's' : '';
  const emptyTitle = s.search ? 'Sin resultados' : inactiveView ? 'No hay productos despublicados' : 'Aún no hay productos en el catálogo';
  const emptyHint = s.search
    ? 'Intenta con otro término de búsqueda'
    : inactiveView ? 'Los productos que despubliques aparecerán aquí' : 'Publica el primero con el botón "Nuevo producto"';

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Productos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {s.total} producto{plural} {inactiveView ? `despublicado${plural}` : s.search ? `encontrado${plural}` : `publicado${plural} en la tienda`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => s.setStatus(inactiveView ? 'active' : 'inactive')} aria-pressed={inactiveView}
            className={`btn border ${inactiveView
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <EyeOff size={14} /> {inactiveView ? 'Viendo despublicados' : 'Ver despublicados'}
          </button>
          {!inactiveView && (
            <button className="btn-primary" onClick={() => setEditing('new')}>
              <Plus size={14} /> Nuevo producto
            </button>
          )}
        </div>
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
            <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
            <p className="text-xs text-muted-foreground">{emptyHint}</p>
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
                    <th className="th">Presentaciones</th>
                    <th className="th text-right">Disponible</th>
                    <th className="th rounded-tr-xl text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.items.map((p) => (
                    <tr key={p._id} className={`group transition-colors ${inactiveView ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-muted/30'}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        {p.description && <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground" title={p.description}>{p.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.category}</span>
                      </td>
                      <td className="max-w-sm px-4 py-3"><PresentationChips p={p} /></td>
                      <td className="whitespace-nowrap px-4 py-3"><StockCell p={p} /></td>
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
                  <div className="min-w-0 space-y-1.5">
                    <div>
                      <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <StockCell p={p} align="left" />
                    <PresentationChips p={p} />
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

      {exiting && (
        <StockExitForm
          product={exiting}
          onSubmit={(presentationId, quantity) => s.registerExit(exiting._id, presentationId, quantity)}
          onClose={() => setExiting(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Despublicar producto"
          message={<>¿Seguro que quieres despublicar <span className="font-bold">{deleting.name}</span>?</>}
          detail='Dejará de mostrarse en la tienda, pero no se borra (los pedidos que lo incluyen conservan su historial). Puedes volver a publicarlo desde "Ver despublicados".'
          confirmLabel="Despublicar"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
