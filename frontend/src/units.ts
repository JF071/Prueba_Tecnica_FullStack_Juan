import type { BaseUnit, Presentation } from './types';

/** Unidades base agrupadas para el selector del formulario (mismas que acepta el backend). */
export const UNIT_GROUPS: { label: string; units: { value: BaseUnit; label: string }[] }[] = [
  {
    label: 'Peso',
    units: [
      { value: 'kg', label: 'Kilogramo (kg)' },
      { value: 'g', label: 'Gramo (g)' },
      { value: 't', label: 'Tonelada (t)' },
      { value: 'lb', label: 'Libra (lb)' },
      { value: 'arroba', label: 'Arroba (@ · 12,5 kg)' },
    ],
  },
  {
    label: 'Volumen',
    units: [
      { value: 'L', label: 'Litro (L)' },
      { value: 'mL', label: 'Mililitro (mL)' },
      { value: 'gal', label: 'Galón (gal)' },
    ],
  },
  { label: 'Conteo', units: [{ value: 'und', label: 'Unidad (und)' }] },
];

/** Símbolo corto para mostrar junto a las cantidades. */
export const unitSymbol = (u: BaseUnit) => (u === 'arroba' ? '@' : u);

const qtyFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 });
export const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** "1.250,5 kg" */
export const formatQty = (n: number, u: BaseUnit) => `${qtyFormat.format(n)} ${unitSymbol(u)}`;

/**
 * Equivalencia del stock en la presentación más grande, p. ej. 1.250 kg → "25 × Bulto 50 kg".
 * Solo se muestra si esa presentación contiene más de 1 unidad base.
 */
export function stockEquivalence(stock: number, presentations: Presentation[]): string | null {
  const biggest = [...presentations].sort((a, b) => b.factor - a.factor)[0];
  if (!biggest || biggest.factor <= 1) return null;
  return `${qtyFormat.format(Math.floor(stock / biggest.factor))} × ${biggest.name}`;
}
