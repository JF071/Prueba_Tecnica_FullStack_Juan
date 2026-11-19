import { describe, expect, it } from 'vitest';
import { formatQty, stockEquivalence } from './units';

const urea = [
  { name: 'Kilo', factor: 1, price: 3400 },
  { name: 'Bulto 50 kg', factor: 50, price: 145000 },
  { name: 'Bulto 25 kg', factor: 25, price: 76000 },
];

describe('units', () => {
  it('formatea cantidades con separadores colombianos y el símbolo de la unidad', () => {
    expect(formatQty(1250.5, 'kg')).toBe('1.250,5 kg');
    expect(formatQty(3, 'arroba')).toBe('3 @');
  });

  it('expresa el stock en la presentación más grande (redondeando hacia abajo)', () => {
    expect(stockEquivalence(1270, urea)).toBe('25 × Bulto 50 kg');
  });

  it('no muestra equivalencia si solo se vende por unidad base', () => {
    expect(stockEquivalence(10, [{ name: 'Kilo', factor: 1, price: 1 }])).toBeNull();
    expect(stockEquivalence(10, [])).toBeNull();
  });
});
