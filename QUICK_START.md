# 🚀 Quick Start: Hostinger Image Upload

## What You Need to Do Now

### 1️⃣ Get FTP Credentials from Hostinger
**Go to**: Hostinger cPanel → Files → FTP Accounts

You need:
- FTP Username (e.g., `user@ravintolababylon.fi`)
- FTP Password
- FTP Host: `ftp.ravintolababylon.fi`

### 2️⃣ Update .env File
Replace placeholders in `babylon-app/.env`:

```env
HOSTINGER_FTP_USER=your_actual_username@ravintolababylon.fi
HOSTINGER_FTP_PASSWORD=your_actual_password
```

### 3️⃣ Create Subdomain (5 minutes)
**Hostinger cPanel → Domains → Subdomains**

- Subdomain: `images`
- Full domain: `images.ravintolababylon.fi`
- Document root: `/public_html/uploads`

Create the `/uploads` folder if it doesn't exist.

### 4️⃣ Test Locally
```bash
cd babylon-app
npm run dev:mobile

# In another terminal or browser:
# Visit: http://localhost:5000/api/test-hostinger
# (You'll need to be authenticated)
```

### 5️⃣ Deploy to Fly.io
```bash
cd babylon-app

# Set secrets
fly secrets set \
  IMAGE_UPLOAD_STRATEGY=hostinger \
  HOSTINGER_FTP_USER="your_username@ravintolababylon.fi" \
  HOSTINGER_FTP_PASSWORD="your_password" \
  IMAGE_CDN_URL=https://images.ravintolababylon.fi

# Deploy
fly deploy
```

## That's It! 🎉

Your images will now upload to:
```
https://images.ravintolababylon.fi/uploads/2024/11/menu-items/123456-abc.webp
```

## Test Upload After Deploy

Go to admin panel → Menu Items → Upload image

Image should:
- ✅ Upload to Hostinger (not Cloudinary)
- ✅ Be optimized to WebP
- ✅ Have URL starting with `https://images.ravintolababylon.fi/`

## Switch Back to Cloudinary?

Just change:
```env
IMAGE_UPLOAD_STRATEGY=cloudinary
```

---

**Need Help?** Check:
- `HOSTINGER_UPLOAD_SETUP.md` - Detailed setup
- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `IMAGE_HOSTING_MIGRATION_PLAN.md` - Migration strategy
