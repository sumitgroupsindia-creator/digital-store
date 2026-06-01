import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LibraryPage from './pages/LibraryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider queryClient={queryClient}>
        <BrowserRouter>
          <AppShell />
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--surface))',
              color: 'rgb(var(--fg))',
              border: '1px solid rgb(var(--line))',
              borderRadius: '0.875rem',
              boxShadow: '0 12px 32px -12px rgb(0 0 0 / 0.28)',
            },
          }}
        />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const { ssoLoading } = useAuth();

  // While a single-sign-on handoff from the main site is being validated,
  // show a splash so protected routes don't briefly bounce to /login.
  if (ssoLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas">
        <div className="w-12 h-12 border-4 border-brand-500/25 border-t-brand-600 rounded-full animate-spin mb-4" />
        <p className="text-muted text-sm font-medium">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/products" element={<Navigate to="/" replace />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          {/* Backward-compat with old main-site deep links */}
          <Route path="/store" element={<Navigate to="/" replace />} />
          <Route path="/store/:slug" element={<RedirectStoreSlug />} />
          <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

/** Maps legacy /store/:slug to /products/:slug */
function RedirectStoreSlug() {
  const slug = window.location.pathname.split('/store/')[1];
  return <Navigate to={`/products/${slug || ''}`} replace />;
}
