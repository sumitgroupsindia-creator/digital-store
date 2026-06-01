import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { buyDigitalProduct } from '../lib/razorpay';
import { useAuth } from '../context/AuthContext';
import { Icon, ProductImage, ErrorState } from '../components/ui';
import { categoryLabel } from '../lib/productImage';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [buying, setBuying] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['store-product', slug],
    queryFn: () => api.get(`/digital-products/slug/${slug}`).then((r) => r.data),
    enabled: !!slug,
    retry: 1,
  });

  // Check ownership
  const { data: ownership } = useQuery({
    queryKey: ['digital-ownership', product?._id],
    queryFn: () => api.get(`/digital-purchases/check/${product._id}`).then((r) => r.data),
    enabled: isLoggedIn && !!product?._id,
    staleTime: 30_000,
  });

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    if (ownership?.owned) {
      toast('You already own this product!', { icon: '✅' });
      navigate('/library');
      return;
    }

    setBuying(true);
    try {
      await buyDigitalProduct({
        productId: product._id,
        productTitle: product.title,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['digital-ownership'] });
          navigate('/library');
        },
      });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to initiate purchase');
    } finally {
      setBuying(false);
    }
  };

  // NOTE: all hooks must run on every render (before any early return) to
  // satisfy the Rules of Hooks. These are null-safe when product is undefined.
  const gallery = useMemo(() => {
    const imgs = [];
    if (product?.thumbnailUrl) imgs.push(product.thumbnailUrl);
    (product?.previewImages || []).forEach((p) => { if (p?.url && !imgs.includes(p.url)) imgs.push(p.url); });
    return imgs;
  }, [product]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-8 card">
          <div className="skeleton aspect-square rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-10 w-32 mt-4" />
            <div className="skeleton h-11 w-48 mt-6" />
          </div>
        </div>
      </div>
    );
  }

  // A real failure (network/CORS/5xx) that isn't a genuine 404 → offer retry
  if (isError && error?.response?.status !== 404) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg mb-5">
          <Icon name="arrowLeft" className="w-4 h-4" /> Back to Store
        </Link>
        <div className="card">
          <ErrorState
            error={error}
            title="Couldn't load this product"
            onRetry={() => refetch()}
            retrying={isFetching}
          />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-subtle mb-5">
          <Icon name="package" className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-display font-bold text-fg">Product not found</h2>
        <p className="text-sm text-muted mt-1.5">This product may have been removed or is no longer available.</p>
        <Link to="/" className="btn-primary inline-flex mt-6"><Icon name="store" className="w-4 h-4" /> Back to Store</Link>
      </div>
    );
  }

  const discount = product.originalPrice > product.salePrice
    ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
    : 0;

  const activeSrc = gallery[activeImg] || gallery[0] || null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 animate-fade-up">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg mb-5">
        <Icon name="arrowLeft" className="w-4 h-4" /> Back to Store
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="relative">
            <ProductImage
              entity={product}
              src={activeSrc}
              category={product.category}
              alt={product.title}
              ratio="square"
              rounded="rounded-2xl"
              className="border border-line"
              iconClassName="w-16 h-16"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-amber-950 shadow-lg">
                <Icon name="tag" className="w-3.5 h-3.5" /> {discount}% OFF
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 mt-3">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === activeImg ? 'border-brand-500' : 'border-line hover:border-brand-300'
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="badge-brand">
              <Icon name="package" className="w-3.5 h-3.5" /> {categoryLabel(product.category)}
            </span>
            {product.fileFormat && (
              <span className="badge-neutral">
                <Icon name="document" className="w-3.5 h-3.5" /> {product.fileFormat}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-fg leading-tight">{product.title}</h1>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-display font-extrabold text-fg">₹{product.salePrice}</span>
            {discount > 0 && <span className="text-lg text-subtle line-through pb-0.5">₹{product.originalPrice}</span>}
            {discount > 0 && <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 pb-1">Save {discount}%</span>}
          </div>

          <p className="text-muted mt-5 whitespace-pre-line leading-relaxed">
            {product.description || 'No description available.'}
          </p>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <TrustItem icon="bolt" title="Instant" subtitle="Access now" />
            <TrustItem icon="shieldCheck" title="Secure" subtitle="Safe payment" />
            <TrustItem icon="download" title="Download" subtitle="Anytime" />
          </div>

          {/* CTA */}
          <div className="mt-auto pt-8">
            {ownership?.owned ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge-success">
                    <Icon name="checkCircle" className="w-3.5 h-3.5" /> In your library
                  </span>
                  {typeof ownership.daysLeft === 'number' && (
                    <span className="text-sm text-muted">{ownership.daysLeft} days remaining</span>
                  )}
                </div>
                <Link to="/library" className="btn text-white bg-emerald-600 hover:bg-emerald-700 inline-flex w-full sm:w-auto justify-center">
                  <Icon name="library" className="w-4 h-4" /> Go to My Library to Download
                </Link>
              </div>
            ) : (
              <button onClick={handleBuyNow} disabled={buying} className="btn-primary text-base px-6 py-3 w-full sm:w-auto justify-center">
                {buying ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Icon name="wallet" className="w-5 h-5" /> Buy Now — ₹{product.salePrice}
                  </>
                )}
              </button>
            )}
            <p className="text-xs text-subtle mt-3 flex items-center gap-1.5">
              <Icon name="lock" className="w-3.5 h-3.5" /> Secure checkout powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustItem({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center gap-1 p-3 rounded-xl bg-surface-2 border border-line">
      <Icon name={icon} className="w-5 h-5 text-brand-600 dark:text-brand-400" />
      <p className="text-sm font-semibold text-fg leading-none">{title}</p>
      <p className="text-xs text-subtle">{subtitle}</p>
    </div>
  );
}
