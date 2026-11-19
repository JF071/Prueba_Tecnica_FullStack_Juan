import { Menu } from 'lucide-react';
import { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { ProductsPage } from './components/ProductsPage';
import { Logo } from './components/layout/Logo';
import { Sidebar } from './components/layout/Sidebar';
import { useAuth } from './store/authStore';

export function App() {
  const token = useAuth((s) => s.token);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!token) return <LoginForm />;

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 flex-1">
        {/* Barra superior solo en móvil, con el botón que abre el menú */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
          <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <Menu size={20} />
          </button>
          <Logo />
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">
          <ProductsPage />
        </main>
      </div>
    </div>
  );
}
