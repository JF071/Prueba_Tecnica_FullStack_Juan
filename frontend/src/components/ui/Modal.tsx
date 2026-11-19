import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEscape } from '../../hooks/useEscape';

interface Props {
  title: string;
  icon: ReactNode;
  /** Clases del recuadro del ícono, p. ej. 'bg-red-100 text-red-600' */
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  role?: 'dialog' | 'alertdialog';
  onClose: () => void;
  children: ReactNode;
}

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Ventana modal con el estilo del CRM: fondo difuminado, cierre con Esc o clic afuera. */
export function Modal({ title, icon, iconClassName = 'bg-primary/10 text-primary', size = 'md', role = 'dialog', onClose, children }: Props) {
  useEscape(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role={role} aria-modal="true" aria-label={title}
        className={`flex max-h-full w-full flex-col rounded-2xl bg-card shadow-modal animate-scale-in ${widths[size]}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className={`rounded-lg p-1.5 ${iconClassName}`}>{icon}</div>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
