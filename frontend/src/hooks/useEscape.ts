import { useEffect } from 'react';

/** Ejecuta onEscape cuando el usuario presiona la tecla Esc (para cerrar modales). */
export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey); // se limpia al cerrar el modal
  }, [onEscape]);
}
