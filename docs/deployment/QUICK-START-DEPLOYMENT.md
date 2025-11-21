# 🚀 Quick Start: Deployment Setup

**For:** Setting up staging environment on Vercel + production on Digital Ocean

**Time:** ~30 minutes

---

## 📋 Prerequisites

- [x] GitHub repository with VittaSami code
- [x] Digital Ocean droplet running (production)
- [x] Supabase Dev database (current - mvvxeqhsatkqtsrulcil)
- [x] Supabase Prod database (new - empty)
- [ ] Vercel account (free tier)

---

## 🎯 Step 1: Set Up Vercel Account (5 min)

1. **Sign up for Vercel**
   - Go to: https://vercel.com/signup
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   # Follow browser authentication
   ```

---

## 🎯 Step 2: Create Staging Branch (2 min)

```bash
# From your local machine
cd /Users/alvaro/Projects/VittaSamiApp

# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

---

## 🎯 Step 3: Link Project to Vercel (5 min)

```bash
# From project root
vercel link

# Answer prompts:
# ? Set up and deploy? [No]
# ? Which scope? [Your account]
# ? Link to existing project? [No]
# ? What's your project's name? vittasami
# ? In which directory is your code located? ./
```

**Or use Vercel Dashboard:**
1. Go to: https://vercel.com/new
2. Import Git Repository > Choose your VittaSami repo
3. Project Name: `vittasami`
4. Framework Preset: `Next.js`
5. Click "Import" (don't deploy yet)

---

## 🎯 Step 4: Configure Vercel Environment Variables (10 min)

Go to: Vercel Dashboard > vittasami > Settings > Environment Variables

**Copy these variables** (get actual values from your `.env.local`):

### For "Preview" and "Development" environments:

```bash
# Supabase (DEV database)
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[copy from .env.local]
SUPABASE_SERVICE_ROLE_KEY=[copy from .env.local]

# Domain (Staging)
NEXT_PUBLIC_DOMAIN_MAIN=https://vittasami-staging.vercel.app
NEXT_PUBLIC_DOMAIN_APP=https://vittasami-staging.vercel.app

# Stripe (TEST mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your test key or leave blank]
STRIPE_SECRET_KEY=[your test key or leave blank]
STRIPE_WEBHOOK_SECRET=[your test secret or leave blank]

# Email (optional for staging)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=dev@vittasami.com
EMAIL_PASSWORD=[your app password or leave blank]

# Node
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

**Important:**
- Check "Preview" checkbox for all variables
- Check "Development" checkbox for all variables
- DO NOT check "Production" (we'll keep Digital Ocean for production)

---

## 🎯 Step 5: Configure Git Integration (3 min)

In Vercel Dashboard > vittasami > Settings > Git:

1. **Production Branch:** Leave empty or set to `none` (we use Digital Ocean)
2. **Ignored Build Step:** Add this command:
   ```bash
   bash -c '[[ "$VERCEL_GIT_COMMIT_REF" == "main" ]] && exit 1 || exit 0'
   ```
   (This prevents deploying `main` to Vercel - we want that on Digital Ocean only)

---

## 🎯 Step 6: Deploy Staging (2 min)

```bash
# Push to staging branch
git checkout staging
git push origin staging

# Vercel will auto-deploy
# Check status at: https://vercel.com/dashboard
```

**Or manual deploy:**
```bash
vercel --prod
```

**Expected result:**
- ✅ Build succeeds
- ✅ Deployment URL: `https://vittasami-staging.vercel.app`
- ✅ App loads without errors

---

## 🎯 Step 7: Test Staging Environment (3 min)

```bash
# Visit staging URL
open https://vittasami-staging.vercel.app

# Test critical flows:
# 1. Homepage loads ✅
# 2. Login page loads ✅
# 3. Login with demo account:
#    - admin@clinicasanrafael.com / password123

# 4. Dashboard loads ✅
# 5. Can navigate app ✅
```

**If errors occur:**
- Check Vercel logs: Dashboard > Deployments > Latest > Function Logs
- Verify environment variables are set correctly
- Ensure Supabase DEV database is accessible

---

## 🎯 Step 8: Update Production Supabase (CRITICAL!)

**⚠️ WARNING: This changes production database!**

1. **Get new production Supabase credentials**
   - Project URL: `https://[new-project-id].supabase.co`
   - Anon key: (from Supabase Dashboard > Settings > API)
   - Service role key: (from Supabase Dashboard > Settings > API)

2. **Run migrations on production Supabase**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to production project
   supabase link --project-ref [new-project-id]

   # Push migrations
   cd supabase
   supabase db push

   # Verify schema
   supabase db diff
   ```

3. **Update `.env.production` on Digital Ocean server**
   ```bash
   # SSH into Digital Ocean
   ssh root@your-droplet-ip

   # Navigate to project
   cd /var/www/vittasami

   # Edit production env
   nano .env.production

   # Update these lines:
   NEXT_PUBLIC_SUPABASE_URL=https://[new-project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[new-prod-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[new-prod-service-role-key]

   # Save: Ctrl+X, Y, Enter
   ```

---

## 🎯 Step 9: Deploy to Production (5 min)

**⚠️ Do this during low-traffic hours**

```bash
# SSH into Digital Ocean
ssh root@your-droplet-ip

# Navigate to project
cd /var/www/vittasami

# Backup current deployment
docker-compose down
cp -r .next .next.backup-$(date +%Y%m%d-%H%M%S)

# Pull latest code
git checkout main
git pull origin main

# Verify you're on main branch
git branch
git log -1 --oneline

# Deploy
./deploy.sh

# Expected output:
# 🚀 Starting VittaMed deployment...
# [INFO] Building and deploying...
# ✅ VittaMed is running successfully!

# Verify deployment
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}

# Check logs
docker-compose logs -f --tail=50
```

---

## 🎯 Step 10: Verify Production (5 min)

```bash
# Test public URLs
curl https://vittasami.com
curl https://app.vittasami.lat

# Visit app in browser
open https://app.vittasami.lat

# Login as admin
# Email: admin@clinicasanrafael.com
# Password: password123

# Expected: Login should FAIL (new database is empty)

# Create first production tenant
# Visit: https://app.vittasami.lat/admin/create-tenant
# Fill form with real production data
```

---

## 🎯 Step 11: Set Up GitHub Actions (Optional - 10 min)

```bash
# From local machine
cd /Users/alvaro/Projects/VittaSamiApp

# Workflows are already created in .github/workflows/

# Add secrets to GitHub
# Go to: GitHub repo > Settings > Secrets and variables > Actions

# Add these secrets:
# - VERCEL_TOKEN (get from: https://vercel.com/account/tokens)
# - VERCEL_ORG_ID (get from: vercel.json or Vercel Dashboard)
# - VERCEL_PROJECT_ID (get from: vercel.json or Vercel Dashboard)
# - SUPABASE_URL_DEV
# - SUPABASE_ANON_KEY_DEV
# - SUPABASE_SERVICE_ROLE_KEY_DEV
```

---

## ✅ Success Checklist

- [ ] Vercel account created and linked
- [ ] Staging branch created and pushed
- [ ] Vercel environment variables configured
- [ ] Staging deployment successful (`vittasami-staging.vercel.app`)
- [ ] Staging app accessible and working
- [ ] Production Supabase migrated and configured
- [ ] Production `.env.production` updated with new Supabase
- [ ] Production deployment successful (`app.vittasami.lat`)
- [ ] Production app accessible
- [ ] First production tenant created
- [ ] GitHub Actions secrets configured (optional)

---

## 📝 Workflow Summary

```
Development Flow:
┌─────────────┐
│ Local Dev   │ → develop branch → PR → merge
└─────────────┘

Staging Flow:
┌─────────────┐
│ develop     │ → merge to staging → Vercel auto-deploys
└─────────────┘
        ↓
┌─────────────────────┐
│ QA Testing          │ → Test on vittasami-staging.vercel.app
└─────────────────────┘

Production Flow:
┌─────────────┐
│ staging     │ → merge to main → Manual deploy on Digital Ocean
└─────────────┘
        ↓
┌─────────────────────┐
│ ./deploy.sh         │ → Deploy to app.vittasami.lat
└─────────────────────┘
```

---

## 🆘 Troubleshooting

### Vercel build fails
```bash
# Check logs
vercel logs [deployment-url]

# Test build locally
npm run build

# If local build works, check environment variables in Vercel
```

### Staging app shows errors
```bash
# Check Vercel function logs
# Dashboard > Deployments > Latest > Function Logs

# Verify Supabase DEV is accessible
curl https://mvvxeqhsatkqtsrulcil.supabase.co
```

### Production deployment fails
```bash
# SSH into server
ssh root@your-droplet-ip

# Check Docker status
docker-compose ps
docker-compose logs

# Rebuild
docker-compose down
docker system prune -a
./deploy.sh
```

### Can't log in to production
**Expected!** Production database is empty. Create first tenant at:
`https://app.vittasami.lat/admin/create-tenant`

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **VittaSami Docs:** `/docs/DEPLOYMENT-STRATEGY.md`

---

**Setup complete! 🎉**

Next steps:
1. Document production credentials securely
2. Set up monitoring (UptimeRobot, Sentry)
3. Configure production email/payment providers
4. Train team on deployment workflow
