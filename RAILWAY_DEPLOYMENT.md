# Railway Deployment Guide — ehos-admin-panel

Panduan lengkap untuk deploy Next.js 15 admin panel EHOS ke Railway dengan SSR, RSC, dan environment management otomatis.

## 📋 Prasyarat

- GitHub account dengan repo `ehos-admin-panel` ter-push
- Railway account ([railway.app](https://railway.app)) — buat gratis
- Railway CLI (optional, untuk local testing)
- Node.js 18+ (untuk local development)

## 🚀 Quick Start (5 menit)

### 1. Connect GitHub & Create Project

1. Login ke [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub**
3. Authorize Railway untuk akses GitHub
4. Select repository: `ehos-admin-panel`
5. Railway auto-detect Node.js + Next.js setup
6. Click **Deploy** — Railway mulai build

### 2. Environment Variables

Di Railway dashboard, go to **Admin Panel Service** → **Variables**. Set:

```env
# Frontend Public Variables (visible ke browser)
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_STORAGE_URL=https://storage.yourdomain.com
NEXT_PUBLIC_DEFAULT_THEME=light
NEXT_PUBLIC_FORCE_THEME=

# Optional: Monitoring & Observability
NEXT_PUBLIC_ENVIRONMENT=production
```

**Important:** Prefix `NEXT_PUBLIC_` artinya variable ini **visible di browser**. JANGAN pakai untuk secrets.

### 3. Verify Build Output

Railway akan:
1. Auto-detect `package.json` + `next.config.ts`
2. Run `npm install`
3. Run `npm run build` (generate static + SSR bundle)
4. Start production server: `npm start`

## 🔧 Build Configuration

### package.json Scripts

Railway akan run:
```bash
npm install               # Install dependencies
npm run build             # Next.js build
npm start                 # Start production server
```

**Verify scripts** di `package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

### Next.js Config

File `next.config.ts` sudah configured untuk:
- **Transpile packages** — @incodiy packages dari workspace
- **Image optimization** — remote patterns untuk MinIO/S3
- **API rewrites** — proxy requests ke backend API

**Verify production-ready settings:**

```typescript
// next.config.ts sudah ada, tapi verify:

const nextConfig: NextConfig = {
  // Production mode
  productionBrowserSourceMaps: false,  // Disable source maps di prod
  
  // Image patterns
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.yourdomain.com"
      }
    ]
  }
};
```

### Optional: railway.json

Create `railway.json` di root untuk fine-tune build:

```json
{
  "build": {
    "builder": "heroku-20",
    "buildCommand": "npm install && npm run build",
    "watchPatterns": ["src/**/*", "public/**/*", "next.config.ts"]
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "always",
    "healthcheckPath": "/",
    "healthcheckTimeout": 30,
    "port": 3000
  }
}
```

## 🌐 Domain & Custom URL

### Setup Custom Domain

1. Railway Dashboard → **Admin Panel Service** → **Settings** → **Domain**
2. Add custom domain: `admin.yourdomain.com`
3. Railway auto-generate SSL certificate (Let's Encrypt)
4. Update DNS CNAME to Railway endpoint

**Example DNS:**
```
admin.yourdomain.com CNAME railway-prod-xyz.railway.app
```

### Public URL

Railway auto-generate URL:
```
https://ehos-admin-panel-prod-xyz.railway.app
```

## 🔗 Linking Services

Railway dashboard automatically link services. Setup API communication:

### Option 1: Link Backend Service (Recommended)

1. **Admin Panel Service** → **Variables**
2. Add: `NEXT_PUBLIC_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}/api/v1`
3. Railway auto-populate URL dari backend service

### Option 2: Manual URL

1. Deploy backend API terlebih dahulu
2. Copy public URL (e.g., `https://api.yourdomain.com`)
3. Set `NEXT_PUBLIC_API_BASE_URL` manually

## 🏗️ Build Optimization

### Next.js Buildout Size

Minimal build output:
- SSR bundle: ~2-3 MB
- Static assets: ~1-2 MB

**Optimization tips:**

1. **Remove unused packages** di `package.json`:
   ```bash
   npm prune --production
   ```

2. **Analyze bundle** (optional):
   ```bash
   npm run build
   npm install -g next-bundle-analyzer
   ```

3. **Code splitting** — Next.js automatic
4. **Image optimization** — auto-handled by Next.js

### Build Performance

Railway build time: ~2-5 menit (depend on dependencies size)

**Accelerate:**
- Cache `node_modules` (Railway auto-cache)
- Use `npm ci` instead `npm install` (untuk consistency)
- Minimal devDependencies

## 📊 Monitoring & Logs

### Logs

1. Railway Dashboard → **Admin Panel Service** → **Logs**
2. Real-time output dari Next.js server
3. Filter build vs runtime logs

### Common Log Entries

```
# Build phase
npm install completed
next build started
Successfully compiled client and server bundles

# Runtime phase
Ready in 1.234s
> Local: http://localhost:3000
```

### Metrics

1. **Deployments** tab → history, rollback
2. **Monitoring** → CPU, Memory, Network
3. **Bandwidth** → data transfer (important untuk ISP costs)

## 🔐 Security Checklist

- [ ] **No secrets di `NEXT_PUBLIC_*`** — semua visible di browser
- [ ] `NEXT_PUBLIC_API_BASE_URL` point ke production API
- [ ] `NEXT_PUBLIC_STORAGE_URL` point ke secure storage (HTTPS)
- [ ] API authentication via JWT (stored di httpOnly cookies)
- [ ] CSP headers configured (check next.config.ts)
- [ ] No sensitive data di static files (`/public`)
- [ ] Environment variables di-rotate regularly

### Security Headers

Add ke `next.config.ts` untuk production:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          }
        ]
      }
    ];
  }
};
```

## 🚨 Troubleshooting

### Issue: Build Fails — Missing Dependencies

**Error:** `Module not found: @incodiy/cavable`

**Solution:**
1. Verify npm package registry accessible
2. Check `.npmrc` (jika using private registry)
3. Clear cache: `npm cache clean --force`
4. Re-run: `npm install`

### Issue: Build Timeout

**Error:** `Build cancelled after 30 minutes`

**Solution:**
1. Reduce dependencies (move unused to devDependencies)
2. Use `npm ci` instead `npm install`
3. Enable Railway build cache
4. Contact Railway support untuk timeout extension

### Issue: API Connection Failed

**Error:** `NEXT_PUBLIC_API_BASE_URL unreachable`

**Solution:**
1. Verify backend API deployed & running
2. Check `NEXT_PUBLIC_API_BASE_URL` correct di environment
3. Verify CORS enabled di backend (check API logs)
4. Test curl: `curl https://api.yourdomain.com/health`

### Issue: Image Loading Failed

**Error:** `Image from CDN failed to load`

**Solution:**
1. Verify `NEXT_PUBLIC_STORAGE_URL` correct
2. Check image remote patterns di `next.config.ts`
3. Verify storage service (MinIO/S3) accessible
4. Test image URL manual di browser

### Issue: Source Maps Leak in Production

**Error:** `.map` files exposed (security issue)

**Solution:**
1. Add ke `next.config.ts`:
   ```typescript
   productionBrowserSourceMaps: false
   ```
2. Re-deploy

## 📦 Deployment Strategy

### Development → Staging → Production

**Option 1: Multiple Railway Projects**
- Create 3 projects di Railway (dev, staging, prod)
- Each link ke different GitHub branch
- Auto-deploy on branch push

**Option 2: Single Project with Environment Variable**
- Set `NEXT_PUBLIC_ENVIRONMENT=production`
- Conditional rendering based on environment

### Recommended: Branch-based Deploy

Setup automatic deployment:

1. **main** branch → staging deployment
2. **production** branch → production deployment

Configure di Railway:
- Project 1 (Staging): Watch `main` branch
- Project 2 (Production): Watch `production` branch

## 🔄 CI/CD Integration (GitHub Actions)

### Auto-Deploy on Push

Create `.github/workflows/railway-deploy.yml`:

```yaml
name: Deploy to Railway (Admin Panel)

on:
  push:
    branches:
      - main
      - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway deploy --service admin-panel
```

**Setup:**
1. Railway → **Account Settings** → **API Tokens**
2. Generate token
3. GitHub Repo → **Settings** → **Secrets** → Add `RAILWAY_TOKEN`

### Testing Before Deploy

Create `.github/workflows/test-before-deploy.yml`:

```yaml
name: Test & Lint

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main, production]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
```

## 📚 References

- [Railway Docs — Node.js Deployment](https://docs.railway.app/guides/nodejs)
- [Railway Docs — Environments](https://docs.railway.app/develop/environments)
- [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)

## 📝 Next Steps

1. ✅ Push code ke GitHub
2. ✅ Create Railway project & connect GitHub (main branch)
3. ✅ Configure environment variables
4. ✅ Trigger first deployment
5. ✅ Verify build logs (`npm run build` successful)
6. ✅ Test admin panel: `https://admin.yourdomain.com`
7. ✅ Verify API connection to backend
8. ✅ Setup custom domain
9. ✅ Enable auto-deploy on GitHub push
10. ✅ Setup staging → production workflow

---

**Last Updated:** October 2026
**Status:** Production Ready
**Framework:** Next.js 15 (SSR + RSC)
