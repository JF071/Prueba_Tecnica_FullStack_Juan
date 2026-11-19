import { describe, expect, it } from 'vitest';
import { emailFromToken } from './authStore';

// JWT de ejemplo: header.payload.firma (el payload es JSON en base64url)
const tokenWith = (payload: object) => `xx.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.firma`;

describe('emailFromToken', () => {
  it('lee el correo del payload del JWT', () => {
    expect(emailFromToken(tokenWith({ sub: '1', email: 'demo@agro.com' }))).toBe('demo@agro.com');
  });

  it('devuelve null si no hay token o está mal formado', () => {
    expect(emailFromToken(null)).toBeNull();
    expect(emailFromToken('basura')).toBeNull();
    expect(emailFromToken('a.%%%.c')).toBeNull();
  });
});
