import { FormEvent, useState } from 'react';
import { AlertCircle, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';
import { formatQty, money } from '../units';
import { Modal } from './ui/Modal';

interface Props {
  product: Product;
  onSubmit: (presentationId: string, quantity: number) => Promise<string | null>;
  onClose: () => void;
}

/** Registra una venta: descuenta del inventario según la presentación y la cantidad vendidas. */
export function StockExitForm({ product, onSubmit, onClose }: Props) {
  const [presentationId, setPresentationId] = useState(product.presentations[0]?._id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presentation = product.presentations.find((p) => p._id === presentationId);
  const qty = Number(quantity);
  const validQty = Number.isInteger(qty) && qty >= 1;
  // Misma cuenta que hace el backend: cantidad × factor (redondeado a 3 decimales)
  const deducted = presentation && validQty ? Math.round(presentation.factor * qty * 1000) / 1000 : 0;
  const remaining = Math.round((product.stock - deducted) * 1000) / 1000;
  const enough = remaining >= 0;

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!presentation || !validQty || !enough) return;
    setSaving(true);
    setError(null);
    const err = await onSubmit(presentationId, qty);
    setSaving(false);
    if (err) setError(err); else onClose();
  };

  return (
    <Modal title="Registrar venta" icon={<ShoppingCart size={14} />} iconClassName="bg-blue-100 text-blue-600" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4 px-5 py-5">
        <div className="rounded-lg bg-muted px-3 py-2">
          <p className="text-sm font-semibold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground">Disponible: {formatQty(product.stock, product.baseUnit)}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="field-label">Presentación</span>
            <select className="input" value={presentationId} onChange={(e) => setPresentationId(e.target.value)}>
              {product.presentations.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({formatQty(p.factor, product.baseUnit)}) · {money.format(p.price)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Cantidad</span>
            <input autoFocus className="input" type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </div>

        {/* Resumen del cálculo */}
        {presentation && validQty && (
          <dl className={`grid grid-cols-3 gap-2 rounded-xl border p-3 text-center ${enough ? 'border-border' : 'border-red-200 bg-red-50'}`}>
            <div>
              <dt className="text-[11px] text-muted-foreground">Se descuentan</dt>
              <dd className="text-sm font-semibold tabular-nums">{formatQty(deducted, product.baseUnit)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Quedarán</dt>
              <dd className={`text-sm font-semibold tabular-nums ${enough ? '' : 'text-red-600'}`}>{formatQty(remaining, product.baseUnit)}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-muted-foreground">Total</dt>
              <dd className="text-sm font-semibold tabular-nums">{money.format(presentation.price * qty)}</dd>
            </div>
          </dl>
        )}
        {!validQty && <p className="text-xs text-red-600">La cantidad debe ser un número entero mayor que 0</p>}
        {validQty && !enough && <p className="text-xs text-red-600">No hay stock suficiente para esta salida</p>}

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button className="btn-primary" disabled={saving || !validQty || !enough}>{saving ? 'Registrando…' : 'Registrar venta'}</button>
        </div>
      </form>
    </Modal>
  );
}
