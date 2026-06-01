# Sumit Digital Store — `digital.sumitgroups.com`

Standalone React + Vite + Tailwind SPA for the Sumit Groups Digital Store, split out
of the main marketing site. Talks to the shared NestJS backend at `api.sumitgroups.com`.

## Features
- Public catalog (`/`) and product detail (`/products/:slug`)
- Buy Now → Razorpay → verify flow (`digital-purchases` + `payments/digital/*`)
- Customer login/register (shared backend auth, separate token key `sumit_digital_token`)
- My Library (`/library`) with download + access-expiry handling
- Backward-compat redirects for legacy `/store` and `/store/:slug` deep links

## Dev
```bash
npm install
cp .env.example .env   # adjust VITE_API_URL for local backend
npm run dev            # http://localhost:5176
```

For local backend use:
```
VITE_API_URL=http://localhost:3001/api
VITE_MAIN_SITE_URL=http://localhost:5173
```

## Build
```bash
npm run build
npm run preview
```

## Deploy (Vercel)
- New Vercel project rooted at `digital-portal/`
- Custom domain: `digital.sumitgroups.com`
- Env vars:
  - `VITE_API_URL=https://api.sumitgroups.com/api`
  - `VITE_PUBLIC_URL=https://digital.sumitgroups.com`
  - `VITE_MAIN_SITE_URL=https://sumitgroups.com`

Backend CORS already allows `https://digital.sumitgroups.com`.
