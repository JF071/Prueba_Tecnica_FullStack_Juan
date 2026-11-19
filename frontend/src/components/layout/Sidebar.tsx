import { LogOut, Package, X } from 'lucide-react';
import { emailFromToken, useAuth } from '../../store/authStore';
import { Logo } from './Logo';

interface Props { mobileOpen: boolean; onClose: () => void }

/** Barra lateral fija en escritorio; en móvil es un menú que se desliza desde la izquierda. */
export function Sidebar({ mobileOpen, onClose }: Props) {
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const email = emailFromToken(token) ?? 'Usuario';

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in md:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300
          md:sticky md:top-0 md:h-screen md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Logo />
          <button onClick={onClose} aria-label="Cerrar menú" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4" aria-label="Menú principal">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Marketplace</p>
          <span aria-current="page" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            <Package size={18} />
            Productos
          </span>
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {email.slice(0, 2).toUpperCase()}
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={email}>{email}</p>
            <button onClick={logout} title="Cerrar sesión" aria-label="Cerrar sesión"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
