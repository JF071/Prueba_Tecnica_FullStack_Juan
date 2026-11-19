import { DEFAULT_CORS_ORIGIN, parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it('sin variable usa solo el frontend local (antes aceptaba cualquier origen)', () => {
    expect(parseCorsOrigins(undefined)).toEqual([DEFAULT_CORS_ORIGIN]);
    expect(parseCorsOrigins('')).toEqual([DEFAULT_CORS_ORIGIN]);
  });

  it('acepta varios orígenes separados por coma e ignora espacios', () => {
    expect(parseCorsOrigins(' https://a.com , https://b.com ,')).toEqual(['https://a.com', 'https://b.com']);
  });
});
