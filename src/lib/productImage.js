/**
 * Centralised product image + category helpers for the Digital Store.
 *
 * IMPORTANT (image bug fix): a `DigitalPurchase` document stores
 * `thumbnailUrl: undefined` at creation time, so the customer's library never
 * had a thumbnail of its own. The real image lives on the *product*, which the
 * `my-library` endpoint populates onto `purchase.productId`. The resolver below
 * checks every known location so images render correctly everywhere — store,
 * product detail and library — without any backend change.
 */

export const categoryLabels = {
  cdr_file: 'CDR Files',
  photo: 'Photos',
  software_key: 'Software Keys',
  pdf: 'PDF',
  course: 'Courses',
  bundle: 'Bundles',
};

export const categoryIcons = {
  cdr_file: 'document',
  photo: 'image',
  software_key: 'key',
  pdf: 'document',
  course: 'library',
  bundle: 'package',
};

export const categoryLabel = (cat) => categoryLabels[cat] || (cat ? String(cat).replace(/_/g, ' ') : 'Product');
export const categoryIcon = (cat) => categoryIcons[cat] || 'package';

/**
 * Resolve the best available image URL from a product OR a purchase record.
 * Order of preference:
 *   1. direct thumbnailUrl
 *   2. first preview image
 *   3. populated product (purchase.productId) thumbnail / preview
 */
export function resolveProductImage(entity) {
  if (!entity) return null;

  const fromPreview = (e) =>
    Array.isArray(e?.previewImages) && e.previewImages.length
      ? e.previewImages[0]?.url || null
      : null;

  // 1 & 2 — the entity itself (a product, or a purchase that happens to carry it)
  if (entity.thumbnailUrl) return entity.thumbnailUrl;
  const preview = fromPreview(entity);
  if (preview) return preview;

  // 3 — populated product on a purchase (productId may be an object once populated)
  const prod = entity.productId;
  if (prod && typeof prod === 'object') {
    if (prod.thumbnailUrl) return prod.thumbnailUrl;
    const p = fromPreview(prod);
    if (p) return p;
  }

  return null;
}

/** Resolve the product slug from a product or a purchase (for deep links). */
export function resolveProductSlug(entity) {
  if (!entity) return null;
  if (entity.slug) return entity.slug;
  const prod = entity.productId;
  if (prod && typeof prod === 'object' && prod.slug) return prod.slug;
  return null;
}
