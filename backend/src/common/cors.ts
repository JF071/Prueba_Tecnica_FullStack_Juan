/** Origen permitido si no se configura CORS_ORIGIN: el frontend en desarrollo. */
export const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

/**
 * Convierte CORS_ORIGIN ("https://a.com, https://b.com") en una lista de orígenes.
 * Si la variable falta o está vacía, NO se abre a todos: se usa solo el frontend local.
 */
export function parseCorsOrigins(value?: string): string[] {
  const origins = (value ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : [DEFAULT_CORS_ORIGIN];
}
