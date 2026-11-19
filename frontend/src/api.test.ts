import { describe, expect, it } from 'vitest';
import { friendlyMessage } from './api';

describe('friendlyMessage', () => {
  it('sin conexión', () => expect(friendlyMessage(0, null)).toMatch(/conexión/));
  it('401', () => expect(friendlyMessage(401, null)).toMatch(/sesión/));
  it('429 por fuerza bruta', () => expect(friendlyMessage(429, null)).toMatch(/Demasiados intentos/));
  it('400 une los mensajes de validación', () =>
    expect(friendlyMessage(400, { message: ['price must not be less than 0', 'stock must be an integer'] })).toContain('. '));
  it('500', () => expect(friendlyMessage(500, null)).toMatch(/servidor/));
});
