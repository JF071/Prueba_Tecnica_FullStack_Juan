import { FormEvent, useState } from 'react';
import { AlertCircle, Package, Plus, Trash2 } from 'lucide-react';
import type { BaseUnit, Product, ProductInput } from '../types';
import { money, UNIT_GROUPS, unitSymbol } from '../units';
import { Modal } from './ui/Modal';

interface Props { product?: Product; onSubmit: (d: ProductInput) => Promise<string | null>; onClose: () => void }

/** Fila editable de presentación (los números se manejan como texto mientras se escribe). */
interface PresentationRow { key: number; name: string; factor: string; price: string }

let nextKey = 1;
const emptyRow = (): PresentationRow => ({ key: nextKey++, name: '', factor: '', price: '' });

export function ProductForm({ product, onSubmit, onClose }: Props) {
  const [f, setF] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    supplier: product?.supplier ?? '',
    category: product?.category ?? 'general',
    baseUnit: (product?.baseUnit ?? 'kg') as BaseUnit,
    stock: String(product?.stock ?? ''),
  });
  const [rows, setRows] = useState<PresentationRow[]>(
    product?.presentations?.length
      ? product.presentations.map((p) => ({ key: nextKey++, name: p.name, factor: String(p.factor), price: String(p.price) }))
      : [emptyRow()],
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const unit = unitSymbol(f.baseUnit);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'El nombre es obligatorio';
    if (!f.supplier.trim()) e.supplier = 'El proveedor es obligatorio';
    if (f.stock === '' || Number(f.stock) < 0) e.stock = 'Ingresa un stock válido (0 o más)';
    rows.forEach((r, i) => {
      if (!r.name.trim()) e[`p${i}`] = 'Ponle un nombre a la presentación';
      else if (!(Number(r.factor) > 0)) e[`p${i}`] = `Indica cuántos ${unit} contiene (mayor que 0)`;
      else if (r.price === '' || Number(r.price) < 0) e[`p${i}`] = 'Ingresa un precio válido (0 o más)';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError(null);
    const error = await onSubmit({
      name: f.name.trim(),
      description: f.description.trim(),
      supplier: f.supplier.trim(),
      category: f.category.trim() || 'general',
      baseUnit: f.baseUnit,
      stock: Number(f.stock),
      presentations: rows.map((r) => ({ name: r.name.trim(), factor: Number(r.factor), price: Number(r.price) })),
    });
    setSaving(false);
    if (error) setServerError(error); else onClose();
  };

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const setRow = (key: number, field: keyof Omit<PresentationRow, 'key'>, value: string) =>
    setRows(rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  const fieldError = (k: string) => errors[k] && <span className="mt-1 block text-xs text-red-600">{errors[k]}</span>;

  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} icon={<Package size={14} />} size="lg" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="field-label">Nombre *</span>
            <input autoFocus className="input" value={f.name} onChange={set('name')} maxLength={120} placeholder="Ej. Urea granulada 46%" />
            {fieldError('name')}
          </label>
          <label className="block">
            <span className="field-label">Categoría</span>
            <input className="input" value={f.category} onChange={set('category')} maxLength={60} />
          </label>
        </div>

        <label className="block">
          <span className="field-label">Proveedor *</span>
          <input className="input" value={f.supplier} onChange={set('supplier')} maxLength={120} placeholder="Ej. Agroinsumos del Valle S.A.S." />
          {fieldError('supplier')}
        </label>

        <label className="block">
          <span className="field-label">Descripción</span>
          <textarea className="input" value={f.description} onChange={set('description')} maxLength={500} rows={2} />
        </label>

        {/* Inventario */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Unidad base *</span>
            <select className="input" value={f.baseUnit} onChange={set('baseUnit')}>
              {UNIT_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.units.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </optgroup>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-muted-foreground">El inventario se lleva en esta unidad.</span>
          </label>
          <label className="block">
            <span className="field-label">Stock disponible ({unit}) *</span>
            <input className="input" type="number" step="any" min="0" value={f.stock} onChange={set('stock')} />
            {fieldError('stock')}
          </label>
        </div>

        {/* Presentaciones */}
        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5">
            <div>
              <p className="text-xs font-semibold text-foreground">Presentaciones de venta *</p>
              <p className="text-[11px] text-muted-foreground">Cuántos {unit} trae cada una: así se sabe cuánto descontar del inventario.</p>
            </div>
            <button type="button" onClick={() => setRows([...rows, emptyRow()])} disabled={rows.length >= 10}
              className="btn-secondary px-2.5 py-1.5 text-xs">
              <Plus size={13} /> Agregar
            </button>
          </div>

          <div className="space-y-3 p-4">
            {rows.map((r, i) => {
              const perUnit = Number(r.factor) > 0 && r.price !== '' ? Number(r.price) / Number(r.factor) : null;
              return (
                <div key={r.key}>
                  <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                    <input className="input col-span-2 sm:col-span-1" placeholder="Nombre (ej. Bulto 50 kg)" aria-label={`Nombre de la presentación ${i + 1}`}
                      value={r.name} onChange={(e) => setRow(r.key, 'name', e.target.value)} maxLength={60} />
                    <div className="relative">
                      <input className="input pr-10" type="number" step="any" min="0" placeholder="Contiene" aria-label={`Contenido en ${unit}`}
                        value={r.factor} onChange={(e) => setRow(r.key, 'factor', e.target.value)} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <input className="input pl-6" type="number" step="any" min="0" placeholder="Precio" aria-label="Precio de la presentación"
                        value={r.price} onChange={(e) => setRow(r.key, 'price', e.target.value)} />
                    </div>
                    <button type="button" onClick={() => setRows(rows.filter((x) => x.key !== r.key))} disabled={rows.length === 1}
                      aria-label="Quitar presentación" title={rows.length === 1 ? 'Debe haber al menos una' : 'Quitar'}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {perUnit !== null && !errors[`p${i}`] && (
                    <p className="mt-1 text-[11px] text-muted-foreground">≈ {money.format(perUnit)} / {unit}</p>
                  )}
                  {fieldError(`p${i}`)}
                </div>
              );
            })}
          </div>
        </div>

        {serverError && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
