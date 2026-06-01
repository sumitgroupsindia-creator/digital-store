import { useState, useEffect } from 'react';
import Icon from './Icon';
import { resolveProductImage, categoryIcon } from '../../lib/productImage';

/**
 * Robust product image with:
 *  - smart URL resolution (handles product OR purchase records),
 *  - a shimmer skeleton while loading,
 *  - a graceful category-icon fallback on missing/broken images,
 *  - smooth fade-in + optional hover zoom.
 *
 * Usage: <ProductImage entity={product} ratio="square" zoom />
 */
const ratios = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '16/9': 'aspect-video',
  '3/2': 'aspect-[3/2]',
  none: '',
};

export default function ProductImage({
  entity,
  src: srcProp,
  alt = '',
  category,
  ratio = '4/3',
  zoom = false,
  rounded = '',
  className = '',
  iconClassName = 'w-10 h-10',
}) {
  const resolved = srcProp || resolveProductImage(entity);
  const cat = category || entity?.category || entity?.productCategory;
  const [status, setStatus] = useState(resolved ? 'loading' : 'error');

  useEffect(() => {
    setStatus(resolved ? 'loading' : 'error');
  }, [resolved]);

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${ratios[ratio] || ''} ${rounded} ${className}`.trim()}>
      {status === 'loading' && <div className="skeleton absolute inset-0 rounded-none" aria-hidden="true" />}

      {resolved && status !== 'error' ? (
        <img
          src={resolved}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full h-full object-cover transition-all duration-500 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${zoom ? 'group-hover:scale-105' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-subtle">
          <Icon name={categoryIcon(cat)} className={iconClassName} />
        </div>
      )}
    </div>
  );
}
