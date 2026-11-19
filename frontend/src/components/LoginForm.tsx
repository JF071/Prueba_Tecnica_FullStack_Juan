import { FormEvent, useState } from 'react';
import { useAuth } from '../store/authStore';

export function LoginForm() {
  const { submit, loading, error } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = (e: FormEvent) => { e.preventDefault(); submit(mode, email, password); };

  return (
    <form className="card auth" onSubmit={onSubmit}>
      <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
      <label>Correo
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label>Contraseña (mínimo 8 caracteres)
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={loading}>{loading ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </form>
  );
}
