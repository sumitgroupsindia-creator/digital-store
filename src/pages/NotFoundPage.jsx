import { Link } from 'react-router-dom';
import { Icon } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div className="animate-fade-up">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-surface-2 border border-line flex items-center justify-center text-subtle mb-6">
          <Icon name="search" className="w-10 h-10" />
        </div>
        <p className="text-5xl font-display font-extrabold text-fg">404</p>
        <h1 className="text-xl font-display font-bold text-fg mt-3 mb-2">Page not found</h1>
        <p className="text-muted mb-6">The page you are looking for doesn’t exist or has moved.</p>
        <Link to="/" className="btn-primary inline-flex">Back to Store</Link>
      </div>
    </div>
  );
}
