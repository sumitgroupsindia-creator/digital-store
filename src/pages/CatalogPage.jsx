import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { buyDigitalProduct } from '../lib/razorpay';
import { useAuth } from '../context/AuthContext';
import { Icon, EmptyState, Badge, ErrorState } from '../components/ui';
import ProductImage from '../components/ui/ProductImage';
import { categoryLabels, categoryIcons, categoryLabel } from '../lib/productImage';

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'discount', label: 'Biggest discount' },
];

function discountOf(p) {
  return p.originalPrice > p.salePrice ? Math.round((1 - p.salePrice / p.originalPrice) * 100) : 0;
}

export default function CatalogPage() {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [buyingId, setBuyingId] = useState(null);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['store-products', category, search],
    queryFn: () => api.get('/digital-products', { params: { category, search, limit: 50 } }).then((r) => r.data),
    retry: 1,
  });

  const { data: cats = [] } = useQuery({
    queryKey: ['store-categories'],
    queryFn: () => api.get('/digital-products/categories').then((r) => r.data),
  });

  // Featured rail — only when browsing the full catalog (no active filters)
  const { data: featuredData } = useQuery({
    queryKey: ['store-featured'],
    queryFn: () => api.get('/digital-products', { params: { featured: true, limit: 8 } }).then((r) => r.data),
  });

  const products = useMemo(() => {
    const list = [...(data?.products || [])];
    switch (sort) {
      case 'price_low': return list.sort((a, b) => a.salePrice - b.salePrice);
      case 'price_high': return list.sort((a, b) => b.salePrice - a.salePrice);
      case 'discount': return list.sort((a, b) => discountOf(b) - discountOf(a));
      case 'newest': return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      default: return list; // featured = API default sortOrder
    }
  }, [data, sort]);

  const featured = featuredData?.products || [];
  const showFeatured = !category && !search && featured.length > 1;
  const totalCount = cats.reduce((sum, c) => sum + (c.count || 0), 0);

  // Ownership badges (logged-in only) — batch query keeps it to one request
  const productIds = products.map((p) => p._id);
  const { data: ownership = {} } = useQuery({
    queryKey: ['digital-ownership-batch', productIds],
    queryFn: () => api.post('/digital-purchases/check-batch', { productIds }).then((r) => r.data),
    enabled: isLoggedIn && productIds.length > 0,
    staleTime: 30_000,
  });

  const onBuyNow = async (product) => {
    if (!isLoggedIn) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }
    if (ownership?.[product._id]?.owned) {
      navigate('/library');
      return;
    }

    setBuyingId(product._id);
    try {
      await buyDigitalProduct({
        productId: product._id,
        productTitle: product.title,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['digital-ownership'] });
          queryClient.invalidateQueries({ queryKey: ['digital-ownership-batch'] });
          navigate('/library');
        },
      });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to initiate purchase');
    } finally {
      setBuyingId(null);
    }
  };

  const clearFilters = () => { setCategory(''); setSearch(''); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 text-white p-8 sm:p-12 mb-8 shadow-card animate-fade-up">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-black/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white text-xs font-medium px-3 py-1 rounded-full border border-white/20 mb-4">
            <Icon name="sparkles" className="w-3.5 h-3.5" /> Instant download · Secure checkout
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold leading-tight">Sumit Digital Store</h1>
          <p className="text-brand-100 mt-3 text-base sm:text-lg max-w-xl">
            Premium CDR files, software keys, PDFs, photos and courses — delivered instantly with secure download access.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-50/90">
            <span className="inline-flex items-center gap-1.5"><Icon name="bolt" className="w-4 h-4" /> Instant access</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="shieldCheck" className="w-4 h-4" /> Secure payments</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="package" className="w-4 h-4" /> {totalCount || '100'}+ products</span>
          </div>
        </div>
      </div>

      {/* Mobile category chips */}
      <div className="lg:hidden -mx-4 px-4 mb-5 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max pb-1">
          <Chip active={category === ''} onClick={() => setCategory('')} icon="store">All</Chip>
          {cats.map((c) => (
            <Chip key={c.category} active={category === c.category} onClick={() => setCategory(c.category)} icon={categoryIcons[c.category] || 'package'}>
              {categoryLabels[c.category] || c.category}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block lg:sticky lg:top-20 h-fit space-y-4">
          <div className="card p-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle px-2 py-2">Browse categories</h2>
            <CategoryButton active={category === ''} icon="store" count={totalCount} onClick={() => setCategory('')}>
              All products
            </CategoryButton>
            {cats.map((c) => (
              <CategoryButton
                key={c.category}
                active={category === c.category}
                icon={categoryIcons[c.category] || 'package'}
                count={c.count}
                onClick={() => setCategory(c.category)}
              >
                {categoryLabels[c.category] || c.category}
              </CategoryButton>
            ))}
          </div>

          <div className="card bg-gradient-to-br from-brand-500/10 to-brand-600/5 border-brand-500/20">
            <Icon name="shieldCheck" className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            <h3 className="font-display font-bold text-fg mt-3">Buy with confidence</h3>
            <p className="text-sm text-muted mt-1">Encrypted payments via Razorpay and instant delivery to your library.</p>
          </div>
        </aside>

        {/* Main */}
        <section>
          {/* Featured rail */}
          {showFeatured && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-fg flex items-center gap-2">
                  <Icon name="trendingUp" className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Featured & trending
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2 snap-x">
                {featured.slice(0, 8).map((p) => (
                  <Link
                    key={p._id}
                    to={`/products/${p.slug}`}
                    className="group snap-start shrink-0 w-44 sm:w-52 card-interactive !p-0 overflow-hidden"
                  >
                    <div className="relative">
                      <ProductImage entity={p} ratio="4/3" zoom rounded="" />
                      {discountOf(p) > 0 && (
                        <span className="absolute top-2.5 left-2.5 badge bg-amber-500 text-amber-950 shadow-sm">{discountOf(p)}% OFF</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">{categoryLabel(p.category)}</p>
                      <p className="font-semibold text-fg text-sm line-clamp-1 mt-0.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{p.title}</p>
                      <p className="text-base font-display font-bold text-fg mt-1">₹{p.salePrice}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-subtle" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search digital products…"
                className="input-field pl-11"
                aria-label="Search products"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg" aria-label="Clear search">
                  <Icon name="close" className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="relative shrink-0">
              <Icon name="sliders" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field pl-10 pr-9 appearance-none cursor-pointer sm:w-56"
                aria-label="Sort products"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <Icon name="chevronDown" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
            </div>
          </div>

          {/* Result meta */}
          {!isLoading && products.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">
                <span className="font-semibold text-fg">{products.length}</span> {products.length === 1 ? 'product' : 'products'}
                {category ? <> in <span className="font-medium text-fg">{categoryLabel(category)}</span></> : null}
              </p>
              {(category || search) && (
                <button onClick={clearFilters} className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
                  <Icon name="close" className="w-3.5 h-3.5" /> Clear filters
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {isError ? (
            <div className="card">
              <ErrorState
                error={error}
                title="Couldn't load products"
                onRetry={() => refetch()}
                retrying={isFetching}
              />
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card !p-0 overflow-hidden">
                  <div className="skeleton aspect-[4/3] rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-3 w-16" />
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-6 w-20" />
                    <div className="skeleton h-9 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card">
              <EmptyState
                icon="search"
                title="No products found"
                description={search ? `We couldn't find anything matching "${search}".` : 'Try a different category or search term.'}
                action={
                  (category || search) && (
                    <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>
                  )
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {products.map((p) => {
                const owned = ownership?.[p._id]?.owned;
                const discount = discountOf(p);
                return (
                  <article key={p._id} className="group card-interactive !p-0 overflow-hidden flex flex-col">
                    <Link to={`/products/${p.slug}`} className="block relative">
                      <ProductImage entity={p} ratio="4/3" zoom rounded="" />
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                        {discount > 0 && <span className="badge bg-amber-500 text-amber-950 shadow-sm">{discount}% OFF</span>}
                        {owned && <Badge tone="success"><Icon name="checkCircle" className="w-3.5 h-3.5" /> Owned</Badge>}
                      </div>
                    </Link>

                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
                        {categoryLabel(p.category)}
                      </p>
                      <Link to={`/products/${p.slug}`} className="font-semibold text-fg line-clamp-2 leading-snug hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                        {p.title}
                      </Link>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-lg font-display font-bold text-fg">₹{p.salePrice}</span>
                        {discount > 0 && <span className="text-sm text-subtle line-through">₹{p.originalPrice}</span>}
                      </div>

                      {owned ? (
                        <Link to="/library" className="mt-4 btn text-white bg-emerald-600 hover:bg-emerald-700 w-full">
                          <Icon name="library" className="w-4 h-4" /> In your library
                        </Link>
                      ) : (
                        <button onClick={() => onBuyNow(p)} disabled={buyingId === p._id} className="mt-4 btn-primary w-full">
                          {buyingId === p._id ? (
                            <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Processing…</>
                          ) : (
                            <><Icon name="shoppingBag" className="w-4 h-4" /> Buy Now</>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryButton({ active, icon, count, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors ${
        active ? 'bg-brand-600 text-white shadow-sm' : 'text-muted hover:text-fg hover:bg-surface-2'
      }`}
    >
      <Icon name={icon} className="w-[18px] h-[18px] shrink-0" />
      <span className="flex-1 text-left truncate">{children}</span>
      {count != null && (
        <span className={`text-xs ${active ? 'text-white/80' : 'text-subtle'}`}>{count}</span>
      )}
    </button>
  );
}

function Chip({ active, icon, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active ? 'bg-brand-600 text-white shadow-sm' : 'bg-surface border border-line text-muted hover:text-fg hover:bg-surface-2'
      }`}
    >
      <Icon name={icon} className="w-4 h-4" /> {children}
    </button>
  );
}
