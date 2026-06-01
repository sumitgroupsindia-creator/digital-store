import { Link } from 'react-router-dom';
import { Icon } from './ui';

export default function Footer() {
  const mainSite = import.meta.env.VITE_MAIN_SITE_URL || 'https://sumitgroups.com';
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-line bg-surface-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <Icon name="sparkles" className="w-5 h-5 text-white" />
            </span>
            <span className="font-display font-extrabold text-fg">Sumit Digital</span>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Instant-download digital products — CDR files, software keys, PDFs, photos, and courses.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">Quick Links</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="text-muted hover:text-fg transition-colors">Store</Link></li>
            <li><Link to="/library" className="text-muted hover:text-fg transition-colors">My Library</Link></li>
            <li>
              <a href={mainSite} className="text-muted hover:text-fg transition-colors inline-flex items-center gap-1">
                Sumit Groups <Icon name="externalLink" className="w-3.5 h-3.5" />
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-4">Support</h4>
          <p className="text-sm text-muted">
            Need help with a purchase or download? Contact our team via the main site.
          </p>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-subtle">
        © {year} Sumit Groups. All rights reserved.
      </div>
    </footer>
  );
}
