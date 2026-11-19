import { FormEvent, useState } from 'react';
import type { Product, ProductInput } from '../types';

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

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={product ? 'Editar producto' : 'Nuevo producto'}>
      <form className="card modal" onSubmit={submit} noValidate>
        <h2>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
        <label>Nombre<input value={f.name} onChange={set('name')} maxLength={120} />{errors.name && <span className="error">{errors.name}</span>}</label>
        <label>Descripción<textarea value={f.description} onChange={set('description')} maxLength={500} rows={3} /></label>
        <div className="row">
          <label>Precio<input type="number" step="0.01" min="0" value={f.price} onChange={set('price')} />{errors.price && <span className="error">{errors.price}</span>}</label>
          <label>Stock<input type="number" step="1" min="0" value={f.stock} onChange={set('stock')} />{errors.stock && <span className="error">{errors.stock}</span>}</label>
        </div>
        <label>Categoría<input value={f.category} onChange={set('category')} maxLength={60} /></label>
        {serverError && <p className="error" role="alert">{serverError}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  );
}
