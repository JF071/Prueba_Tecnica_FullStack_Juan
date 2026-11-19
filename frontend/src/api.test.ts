import { describe, expect, it } from 'vitest';
import { friendlyMessage } from './api';

describe('friendlyMessage', () => {
  it('sin conexión', () => expect(friendlyMessage(0, null)).toMatch(/conexión/));
  it('401', () => expect(friendlyMessage(401, null)).toMatch(/sesión/));
  it('429 por fuerza bruta', () => expect(friendlyMessage(429, null)).toMatch(/Demasiados intentos/));
  it('400 une los mensajes de validación', () =>
    expect(friendlyMessage(400, { message: ['price must not be less than 0', 'stock must be an integer'] })).toContain('. '));
  it('500', () => expect(friendlyMessage(500, null)).toMatch(/servidor/));
  it('409 usa la explicación del backend (p. ej. stock insuficiente)', () =>
    expect(friendlyMessage(409, { message: 'Stock insuficiente: se requieren 150 kg y hay 120 kg' })).toMatch(/Stock insuficiente/));
});
