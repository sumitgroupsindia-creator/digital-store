import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/ui';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        userType: 'b2c',
      };
      const res = await api.post('/auth/register', payload);
      if (res.data.autoApproved) {
        try {
          const loginRes = await api.post('/auth/login', { email: data.email, password: data.password });
          login(loginRes.data.accessToken, loginRes.data.user);
          toast.success('Account created! Welcome!');
          navigate('/');
          return;
        } catch {
          // fall through to submitted screen
        }
      }
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="card py-10">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
              <Icon name="checkCircle" className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-display font-bold text-fg mb-3">Registration Submitted!</h2>
            <p className="text-muted mb-2">Your account has been created and is under review.</p>
            <p className="text-subtle text-sm mb-8">You will be able to log in once the admin approves your account.</p>
            <Link to="/" className="btn-primary inline-block px-8">Back to Store</Link>
            <p className="text-sm text-muted mt-4">
              Already approved?{' '}
              <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <span className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 items-center justify-center mb-4">
            <Icon name="sparkles" className="w-6 h-6 text-white" />
          </span>
          <h1 className="text-2xl font-display font-extrabold text-fg">Create your account</h1>
          <p className="text-muted mt-1.5">Join Sumit Digital to start buying.</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input {...register('name')} className="input-field" placeholder="Your Name" />
              {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="you@example.com" />
              {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input {...register('phone')} className="input-field" placeholder="9876543210" />
            </div>
            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input-field" placeholder="••••••••" />
              {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input {...register('confirmPassword')} type="password" className="input-field" placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting && <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-muted mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
