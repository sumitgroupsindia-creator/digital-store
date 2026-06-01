import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Icon, EmptyState, Badge, ProductImage } from '../components/ui';
import { categoryLabel, resolveProductSlug } from '../lib/productImage';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expiring', label: 'Expiring' },
  { key: 'expired', label: 'Expired' },
];

export default function LibraryPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-digital-library'],
    queryFn: () => api.get('/digital-purchases/my-library').then((r) => r.data),
  });

  const purchases = data?.purchases || [];
  const [downloadingId, setDownloadingId] = useState(null);
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const handleDownload = async (purchaseId) => {
    setDownloadingId(purchaseId);
    try {
      const { data } = await api.get(`/digital-purchases/${purchaseId}/download`);
      if (data.type === 'license_key' || (!data.url && data.licenseKey)) {
        try {
          await navigator.clipboard.writeText(data.licenseKey);
          toast.success(`License key copied: ${data.licenseKey}`);
        } catch {
          toast.success(`Your license key: ${data.licenseKey}`);
        }
      } else {
        window.open(data.url, '_blank', 'noopener,noreferrer');
        toast.success(`Download started (${data.downloadCount}/${data.maxDownloads} used)`);
      }
      refetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const getDaysRemaining = (expiryDate) => {
    const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getAccessStatus = (purchase) => {
    const maxDownloads = purchase.maxDownloads || 10;
    const accessDays = purchase.accessDays || 30;
    const daysLeft = getDaysRemaining(purchase.expiryDate);
    const downloadsUsed = purchase.downloadCount || 0;
    const downloadsLeft = Math.max(0, maxDownloads - downloadsUsed);
    const isExpired = purchase.status !== 'active' || daysLeft <= 0;
    const isLimitReached = downloadsUsed >= maxDownloads;
    const canDownload = !isExpired && !isLimitReached;

    let disableReason = null;
    if (isExpired && isLimitReached) {
      disableReason = `${accessDays}-day access expired & download limit reached`;
    } else if (isExpired) {
      disableReason = `${accessDays}-day access period has expired`;
    } else if (isLimitReached) {
      disableReason = `Download limit reached (${maxDownloads}/${maxDownloads})`;
    }

    return { maxDownloads, accessDays, daysLeft, downloadsUsed, downloadsLeft, isExpired, isLimitReached, canDownload, disableReason };
  };

  // Summary stats
  const stats = useMemo(() => {
    let active = 0, expiring = 0, expired = 0, spent = 0;
    purchases.forEach((p) => {
      spent += Number(p.amountPaid || 0);
      const s = getAccessStatus(p);
      if (s.isExpired) expired++;
      else { active++; if (s.daysLeft <= 5) expiring++; }
    });
    return { active, expiring, expired, spent, total: purchases.length };
  }, [purchases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return purchases.filter((p) => {
      const s = getAccessStatus(p);
      if (filter === 'active' && s.isExpired) return false;
      if (filter === 'expired' && !s.isExpired) return false;
      if (filter === 'expiring' && (s.isExpired || s.daysLeft > 5)) return false;
      if (q && !(`${p.productTitle} ${p.productCategory} ${p.fileFormat || ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [purchases, filter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Your purchases</p>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-fg mt-1">My Digital Library</h1>
          <p className="text-muted mt-1">Manage, access and download every product you own.</p>
        </div>
        <Link to="/" className="btn-secondary text-sm">
          <Icon name="store" className="w-4 h-4" /> Browse Store
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && purchases.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatTile icon="package" tone="brand" label="Total products" value={stats.total} />
          <StatTile icon="checkCircle" tone="success" label="Active" value={stats.active} />
          <StatTile icon="clock" tone="warning" label="Expiring soon" value={stats.expiring} />
          <StatTile icon="wallet" tone="violet" label="Total spent" value={`₹${stats.spent.toLocaleString('en-IN')}`} />
        </div>
      )}

      {/* Toolbar */}
      {!isLoading && purchases.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface border border-line text-muted hover:text-fg hover:bg-surface-2'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search library…"
                className="input-field pl-10 py-2"
                aria-label="Search library"
              />
            </div>
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-xl bg-surface-2 border border-line">
              <ViewBtn active={view === 'grid'} onClick={() => setView('grid')} icon="grid" label="Grid view" />
              <ViewBtn active={view === 'list'} onClick={() => setView('list')} icon="list" label="List view" />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card !p-0 overflow-hidden">
                <div className="skeleton aspect-[16/9] rounded-none" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="library"
              title="Your library is empty"
              description="Purchase digital products from our store and they'll appear here, ready to download instantly."
              action={<Link to="/" className="btn-primary"><Icon name="store" className="w-4 h-4" /> Go to Store</Link>}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon="search"
              title="No matching products"
              description="Try a different filter or search term."
              action={<button onClick={() => { setFilter('all'); setSearch(''); }} className="btn-secondary text-sm">Clear filters</button>}
            />
          </div>
        ) : view === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((purchase) => (
              <LibraryCardGrid
                key={purchase._id}
                purchase={purchase}
                status={getAccessStatus(purchase)}
                downloading={downloadingId === purchase._id}
                onDownload={() => handleDownload(purchase._id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((purchase) => (
              <LibraryCardRow
                key={purchase._id}
                purchase={purchase}
                status={getAccessStatus(purchase)}
                downloading={downloadingId === purchase._id}
                onDownload={() => handleDownload(purchase._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status badge ─────────────────────────────────────────────── */
function StatusBadge({ status, cancelled }) {
  if (status.isExpired) return <Badge tone="danger">{cancelled ? 'Cancelled' : 'Expired'}</Badge>;
  if (status.isLimitReached) return <Badge tone="warning">Limit reached</Badge>;
  if (status.daysLeft <= 5) return <Badge tone="warning" dot>Expiring</Badge>;
  return <Badge tone="success" dot>Active</Badge>;
}

/* ── Download / unavailable action ────────────────────────────── */
function DownloadAction({ purchase, status, downloading, onDownload, isKey, block }) {
  if (status.canDownload) {
    return (
      <button onClick={onDownload} disabled={downloading} className={`btn-primary text-sm ${block ? 'w-full' : ''}`}>
        {downloading ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> {isKey ? 'Fetching…' : 'Downloading…'}</>
        ) : (
          <><Icon name={isKey ? 'key' : 'download'} className="w-4 h-4" /> {isKey ? `Get key (${status.downloadsLeft} left)` : `Download (${status.downloadsLeft} left)`}</>
        )}
      </button>
    );
  }
  return (
    <div className={`flex flex-col gap-1.5 ${block ? '' : 'items-end'}`}>
      <button disabled className={`btn-secondary text-sm cursor-not-allowed opacity-60 ${block ? 'w-full' : ''}`}>
        <Icon name="lock" className="w-4 h-4" /> Unavailable
      </button>
      <p className="text-xs text-red-500 dark:text-red-400 font-medium">{status.disableReason}</p>
      <Link to="/" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
        <Icon name="refresh" className="w-3.5 h-3.5" /> Repurchase
      </Link>
    </div>
  );
}

/* ── License key chip ─────────────────────────────────────────── */
function LicenseChip({ value }) {
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(value); toast.success('License key copied'); } catch { /* ignore */ } }}
      className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg hover:bg-emerald-500/15 transition-colors max-w-full"
      title="Click to copy"
    >
      <Icon name="key" className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{value}</span>
      <Icon name="copy" className="w-3 h-3 shrink-0 opacity-60" />
    </button>
  );
}

/* ── Grid card ────────────────────────────────────────────────── */
function LibraryCardGrid({ purchase, status, downloading, onDownload }) {
  const isKey = purchase.productCategory === 'software_key';
  const slug = resolveProductSlug(purchase);

  return (
    <div className={`group card !p-0 overflow-hidden flex flex-col ${!status.canDownload ? 'opacity-90' : ''}`}>
      <div className="relative">
        <ProductImage entity={purchase} category={purchase.productCategory} ratio="16/9" rounded="" iconClassName="w-9 h-9" />
        <div className="absolute top-3 left-3"><StatusBadge status={status} cancelled={purchase.status === 'cancelled'} /></div>
        {slug && (
          <Link to={`/products/${slug}`} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-white backdrop-blur hover:bg-black/60 transition-colors" aria-label="View product" title="View product">
            <Icon name="externalLink" className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{categoryLabel(purchase.productCategory)}</span>
          {purchase.fileFormat && <span className="text-[11px] text-subtle">· {purchase.fileFormat}</span>}
        </div>
        <h3 className="font-semibold text-fg line-clamp-2 leading-snug mt-1">{purchase.productTitle}</h3>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Meta icon="calendar" value={new Date(purchase.purchaseDate).toLocaleDateString('en-IN')} />
          <Meta icon="clock" value={status.isExpired ? 'Expired' : `${status.daysLeft}d left`} tone={status.isExpired ? 'danger' : status.daysLeft <= 5 ? 'warning' : 'default'} />
          <Meta icon="download" value={`${status.downloadsUsed}/${status.maxDownloads} used`} tone={status.isLimitReached ? 'danger' : status.downloadsLeft <= 3 ? 'warning' : 'default'} />
          <Meta icon="wallet" value={`₹${purchase.amountPaid}`} />
        </div>

        {purchase.licenseKey && <div className="mt-3"><LicenseChip value={purchase.licenseKey} /></div>}

        <div className="mt-4 pt-4 border-t border-line">
          <DownloadAction purchase={purchase} status={status} downloading={downloading} onDownload={onDownload} isKey={isKey} block />
        </div>
      </div>
    </div>
  );
}

/* ── List row ─────────────────────────────────────────────────── */
function LibraryCardRow({ purchase, status, downloading, onDownload }) {
  const isKey = purchase.productCategory === 'software_key';

  return (
    <div className={`card ${!status.canDownload ? 'opacity-90' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <ProductImage entity={purchase} category={purchase.productCategory} ratio="none" rounded="rounded-xl" className="w-20 h-20 shrink-0 border border-line" iconClassName="w-7 h-7" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{categoryLabel(purchase.productCategory)}</span>
              <StatusBadge status={status} cancelled={purchase.status === 'cancelled'} />
            </div>
            <h3 className="font-semibold text-fg truncate mt-1">{purchase.productTitle}</h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs">
              <Meta icon="calendar" value={new Date(purchase.purchaseDate).toLocaleDateString('en-IN')} />
              <Meta icon="clock" value={status.isExpired ? 'Expired' : `${status.daysLeft} day${status.daysLeft !== 1 ? 's' : ''} left`} tone={status.isExpired ? 'danger' : status.daysLeft <= 5 ? 'warning' : 'default'} />
              <Meta icon="download" value={`${status.downloadsUsed} / ${status.maxDownloads}`} tone={status.isLimitReached ? 'danger' : status.downloadsLeft <= 3 ? 'warning' : 'default'} />
            </div>
            {purchase.licenseKey && <div className="mt-2.5"><LicenseChip value={purchase.licenseKey} /></div>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <p className="text-lg font-display font-bold text-fg">₹{purchase.amountPaid}</p>
          <DownloadAction purchase={purchase} status={status} downloading={downloading} onDownload={onDownload} isKey={isKey} />
        </div>
      </div>
    </div>
  );
}

/* ── Small helpers ────────────────────────────────────────────── */
function Meta({ icon, value, tone = 'default' }) {
  const toneClass = tone === 'danger' ? 'text-red-600 dark:text-red-400 font-medium'
    : tone === 'warning' ? 'text-amber-600 dark:text-amber-400 font-medium'
    : 'text-muted';
  return (
    <span className={`inline-flex items-center gap-1.5 ${toneClass}`}>
      <Icon name={icon} className="w-3.5 h-3.5 text-subtle shrink-0" /> {value}
    </span>
  );
}

function ViewBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`p-2 rounded-lg transition-colors ${active ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-sm' : 'text-subtle hover:text-fg'}`}
    >
      <Icon name={icon} className="w-[18px] h-[18px]" />
    </button>
  );
}

const tileTones = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};
function StatTile({ icon, label, value, tone = 'brand' }) {
  return (
    <div className="card !p-4 flex items-center gap-3">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tileTones[tone]}`}>
        <Icon name={icon} className="w-[22px] h-[22px]" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-display font-extrabold text-fg leading-none truncate">{value}</p>
        <p className="text-xs text-muted mt-1">{label}</p>
      </div>
    </div>
  );
}
