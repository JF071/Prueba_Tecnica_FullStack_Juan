import { FormEvent, useState } from 'react';
import { AlertCircle, Package } from 'lucide-react';
import type { Product, ProductInput } from '../types';
import { Modal } from './ui/Modal';

interface Props { product?: Product; onSubmit: (d: ProductInput) => Promise<string | null>; onClose: () => void }

export function ProductForm({ product, onSubmit, onClose }: Props) {
  const [f, setF] = useState({
    name: product?.name ?? '', description: product?.description ?? '',
    price: String(product?.price ?? ''), stock: String(product?.stock ?? ''), category: product?.category ?? 'general',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'El nombre es obligatorio';
    if (f.price === '' || Number(f.price) < 0) e.price = 'Ingresa un precio válido (0 o más)';
    if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) e.stock = 'El stock debe ser un entero (0 o más)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError(null);
    const error = await onSubmit({
      name: f.name.trim(), description: f.description.trim(), category: f.category.trim() || 'general',
      price: Number(f.price), stock: Number(f.stock),
    });
    setSaving(false);
    if (error) setServerError(error); else onClose();
  };

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const fieldError = (k: string) => errors[k] && <span className="mt-1 block text-xs text-red-600">{errors[k]}</span>;

  return (
    <Modal title={product ? 'Editar producto' : 'Nuevo producto'} icon={<Package size={14} />} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 px-5 py-5">
        <label className="block">
          <span className="field-label">Nombre *</span>
          <input autoFocus className="input" value={f.name} onChange={set('name')} maxLength={120} />
          {fieldError('name')}
        </label>
        <label className="block">
          <span className="field-label">Descripción</span>
          <textarea className="input" value={f.description} onChange={set('description')} maxLength={500} rows={3} />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Precio *</span>
            <input className="input" type="number" step="0.01" min="0" value={f.price} onChange={set('price')} />
            {fieldError('price')}
          </label>
          <label className="block">
            <span className="field-label">Stock *</span>
            <input className="input" type="number" step="1" min="0" value={f.stock} onChange={set('stock')} />
            {fieldError('stock')}
          </label>
        </div>
        <label className="block">
          <span className="field-label">Categoría</span>
          <input className="input" value={f.category} onChange={set('category')} maxLength={60} />
        </label>

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
