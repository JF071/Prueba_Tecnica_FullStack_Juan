import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginForm } from './components/LoginForm';
import { ProductsPage } from './components/ProductsPage';
import { useAuth } from './store/authStore';
import './styles.css';

function App() {
  const token = useAuth((s) => s.token);
  return token ? <ProductsPage /> : <LoginForm />;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
