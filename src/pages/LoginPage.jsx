import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/ui';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/library';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const { data: res } = await api.post('/auth/login', data);
      login(res.accessToken, res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate(from);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white p-12">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-brand-300/20 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Icon name="sparkles" className="w-6 h-6" />
          </span>
          <span className="text-lg font-display font-extrabold">Sumit Digital</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-display font-extrabold leading-tight">Your digital library, anywhere.</h2>
          <p className="text-brand-100 mt-4 text-lg">CDR files, software keys, PDFs, photos and courses — purchased once, downloadable instantly.</p>
          <ul className="mt-8 space-y-3">
            {['Instant secure downloads', 'Lifetime access to your purchases', 'License keys delivered on demand'].map((f) => (
              <li key={f} className="flex items-center gap-3 text-brand-50">
                <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                  <Icon name="check" className="w-4 h-4" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-brand-200">© {new Date().getFullYear()} Sumit Digital · A Sumit Groups company</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8">
            <span className="lg:hidden inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center mb-4">
              <Icon name="sparkles" className="w-6 h-6 text-white" />
            </span>
            <h1 className="text-2xl font-display font-extrabold text-fg">Welcome back</h1>
            <p className="text-sm text-muted mt-1.5">Sign in to access your library.</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-500/15' : ''}`} placeholder="you@example.com" />
                {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <input {...register('password')} type="password" className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-500/15' : ''}`} placeholder="••••••••" />
                {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-sm text-muted mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
