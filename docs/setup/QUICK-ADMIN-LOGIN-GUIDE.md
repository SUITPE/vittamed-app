# 🔐 Quick Admin Login Guide

## Login Credentials
```
Email: admin@vittasami.com
Password: VittaSami2025!Admin
```

---

## ✅ Development - READY
```bash
# Check status
npx tsx scripts/check-custom-users.ts
# Expected: ✅ Admin user EXISTS and is ready to login!

# Test login
npx tsx scripts/test-login.ts
# Expected: 🎉 LOGIN SUCCESSFUL!

# Login URL
https://vittasami-git-staging-vittameds-projects.vercel.app/auth/login
```

---

## ⏳ Production - PENDING

### Step 1: Create custom_users table
1. Go to: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm/sql/new
2. Copy content from: `scripts/create-custom-users-table-production.sql`
3. Paste and Execute
4. Verify admin appears in result

### Step 2: Verify
```bash
npx tsx scripts/create-admin-production.ts
# Expected: ✅ Admin user created/updated successfully in PRODUCTION!
```

### Step 3: Login
```
https://app.vittasami.lat/auth/login
(after Digital Ocean is updated to Next.js 16)
```

---

## 🚨 Troubleshooting

### "Invalid credentials"
- Check you're using: `admin@vittasami.com` (NOT admin@clinicasanrafael.com)
- Password is case-sensitive: `VittaSami2025!Admin`

### "Table custom_users does not exist"
- Need to execute `create-custom-users-table-production.sql` in Supabase
- For production, this step is REQUIRED

### "Cannot find user"
- Verify admin exists: `npx tsx scripts/check-custom-users.ts`
- Should show admin@vittasami.com in list

---

## 📚 Full Documentation
See `docs/ADMIN-SETUP-COMPLETE.md` for complete details.
