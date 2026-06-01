import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon, ThemeToggle } from './ui';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  const mainSite = import.meta.env.VITE_MAIN_SITE_URL || 'https://sumitgroups.com';

  useEffect(() => {
    const onClick = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setUserOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    navigate('/');
  };

  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  const linkClass = (path) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path) ? 'text-brand-700 dark:text-brand-300 bg-brand-500/10' : 'text-muted hover:text-fg hover:bg-surface-2'
    }`;

  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <header className="surface-glass sticky top-0 z-50 border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shadow-brand-600/30 transition-transform group-hover:scale-105">
            <Icon name="sparkles" className="w-5 h-5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="text-lg font-display font-extrabold tracking-tight block text-fg">Sumit Digital</span>
            <span className="text-[11px] font-medium block text-subtle">A Sumit Groups company</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={linkClass('/')}>Store</Link>
          {isLoggedIn && (
            <Link to="/library" className={linkClass('/library')}>My Library</Link>
          )}
          <a href={mainSite} className="px-3.5 py-2 rounded-lg text-sm font-medium text-subtle hover:text-fg hover:bg-surface-2 inline-flex items-center gap-1">
            Main Site
            <Icon name="externalLink" className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isLoggedIn ? (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserOpen((o) => !o)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-surface-2 transition-colors"
                aria-haspopup="menu"
                aria-expanded={userOpen}
              >
                <span className="w-8 h-8 rounded-lg bg-brand-500/15 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold">
                  {initial}
                </span>
                <Icon name="chevronDown" className={`w-4 h-4 text-subtle transition-transform ${userOpen ? 'rotate-180' : ''}`} />
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface shadow-card-hover p-1.5 animate-scale-in" role="menu">
                  <div className="px-3 py-2.5 border-b border-line mb-1">
                    <p className="text-sm font-semibold text-fg truncate">{user?.name}</p>
                    {user?.email && <p className="text-xs text-subtle truncate">{user.email}</p>}
                  </div>
                  <Link to="/library" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-fg hover:bg-surface-2" role="menuitem">
                    <Icon name="library" className="w-[18px] h-[18px]" />
                    My Library
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10" role="menuitem">
                    <Icon name="logout" className="w-[18px] h-[18px]" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost text-sm py-2 px-4">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button className="p-2 rounded-lg text-muted hover:text-fg" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            <Icon name={menuOpen ? 'close' : 'menu'} className="w-6 h-6" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-surface border-t border-line px-4 pb-5 pt-3 flex flex-col gap-1.5 animate-slide-down">
          <Link to="/" onClick={() => setMenuOpen(false)} className={linkClass('/')}>Store</Link>
          {isLoggedIn && (
            <Link to="/library" onClick={() => setMenuOpen(false)} className={linkClass('/library')}>My Library</Link>
          )}
          <a href={mainSite} className="px-3.5 py-2 rounded-lg text-sm font-medium text-subtle hover:text-fg hover:bg-surface-2">Main Site ↗</a>
          <div className="border-t border-line pt-3 mt-1 flex flex-col gap-2">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="px-3.5 py-2 rounded-lg text-red-600 dark:text-red-400 font-medium hover:bg-red-500/10 text-left">Logout</button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary w-full">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
