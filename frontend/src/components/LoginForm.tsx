import { FormEvent, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { Logo } from './layout/Logo';

export function LoginForm() {
  const { submit, loading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: FormEvent) => { e.preventDefault(); submit(mode, email, password); };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-6 animate-slide-up">
        <Logo />
        <h1 className="mt-6 text-xl font-bold tracking-tight text-foreground">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {mode === 'login' ? 'Ingresa para gestionar tus productos' : 'Regístrate para empezar'}
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="field-label">Correo</span>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="block">
            <span className="field-label">Contraseña (mínimo 8 caracteres)</span>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
          </p>
        )}

        <button className="btn-primary mt-5 w-full" disabled={loading}>
          {loading ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-3 w-full text-center text-xs font-medium text-primary hover:underline">
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </div>
  );
}
