import type { ReactNode } from 'react';

const tones = {
  amber: 'hover:bg-amber-50 hover:text-amber-600',
  red: 'hover:bg-red-50 hover:text-red-600',
  green: 'hover:bg-green-50 hover:text-green-600',
  blue: 'hover:bg-blue-50 hover:text-blue-600',
};

interface Props { label: string; tone: keyof typeof tones; onClick: () => void; children: ReactNode }

/** Botón de ícono con tooltip, igual a las acciones de las tablas del CRM. */
export function IconButton({ label, tone, onClick, children }: Props) {
  return (
    <button onClick={onClick} aria-label={label}
      className={`group/btn relative rounded-lg p-1.5 text-muted-foreground transition-colors ${tones[tone]}`}>
      {children}
      {/* Anclado a la derecha: si se centrara, el de la última columna se saldría de la tabla y crearía scroll horizontal */}
      <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-1 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] text-background opacity-0 transition-opacity group-hover/btn:opacity-100">
        {label}
      </span>
    </button>
  );
}
