# Hostinger Image Upload Setup Guide

## Overview
This implementation allows you to upload restaurant images (menu items, categories, banners) directly to your Hostinger hosting via FTP, instead of using Cloudinary.

## What Was Implemented

### 1. New Files Created
- **`server/hostinger-upload.ts`**: Core FTP upload/delete functions
  - `uploadImageToHostinger()`: Upload images via FTPS
  - `deleteImageFromHostinger()`: Delete images from Hostinger
  - `testHostingerConnection()`: Test FTP credentials

### 2. Modified Files
- **`server/file-upload.ts`**: 
  - Added strategy switcher (Hostinger vs Cloudinary)
  - Auto-detects image URLs to determine which service to use for deletion
  
- **`server/routes.ts`**:
  - Added `/api/test-hostinger` endpoint to test FTP connection
  - Import `testHostingerConnection` function

- **`package.json`**:
  - Added `basic-ftp` (v5.0.5) for FTP operations
  - Added `sharp` (v0.33.5) for image optimization

- **`.env`**:
  - Added Hostinger FTP configuration variables

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd babylon-app
npm install
```

This will install:
- `basic-ftp` - FTP client library
- `sharp` - Image processing library (already may be installed)

### Step 2: Get Hostinger FTP Credentials

#### Option A: Via Hostinger cPanel
1. Log in to your Hostinger account
2. Go to cPanel
3. Navigate to **Files → FTP Accounts**
4. Either use existing FTP account or create new one
5. Note down:
   - FTP Host: `ftp.ravintolababylon.fi` (or `ftp.yourdomain.com`)
   - FTP Username: e.g., `username@ravintolababylon.fi`
   - FTP Password: Your FTP password

#### Option B: Via Hostinger Dashboard
1. Log in to Hostinger
2. Go to **Hosting** → Your hosting plan
3. Click **File Manager** or **FTP Access**
4. Copy FTP credentials

### Step 3: Update Environment Variables

Edit `babylon-app/.env`:

```env
# Image Upload Strategy (choose: 'hostinger' or 'cloudinary')
IMAGE_UPLOAD_STRATEGY=hostinger

# Hostinger FTP Configuration
HOSTINGER_FTP_HOST=ftp.ravintolababylon.fi
HOSTINGER_FTP_USER=your_actual_ftp_username@ravintolababylon.fi
HOSTINGER_FTP_PASSWORD=your_actual_ftp_password

# Image CDN URL (subdomain you'll create)
IMAGE_CDN_URL=https://images.ravintolababylon.fi
```

**Important**: Replace placeholder values with your actual credentials!

### Step 4: Set Up Subdomain on Hostinger

#### Create Subdomain
1. Go to Hostinger cPanel
2. Navigate to **Domains → Subdomains**
3. Create subdomain: `images` (will become `images.ravintolababylon.fi`)
4. Set Document Root to: `/public_html/uploads` (or `/public_html/babylon-images`)

#### Copy Existing Images (Optional)
If you have WordPress images to preserve:
```bash
# Via SSH or File Manager
cp -r /public_html/wp-content/uploads /public_html/uploads
```

Or via File Manager:
1. Navigate to `/public_html/wp-content/uploads`
2. Select all folders
3. Copy
4. Navigate to `/public_html/` 
5. Create folder `uploads`
6. Paste inside

### Step 5: Test FTP Connection (Development)

Start the dev server:
```bash
cd babylon-app
npm run dev:mobile
```

Test the connection (using curl or your API client):
```bash
curl -X GET https://babylon-admin.fly.dev/api/test-hostinger \
  -H "Authorization: Bearer your_token"
```

Expected response:
```json
{
  "success": true,
  "message": "Hostinger FTP connection successful",
  "strategy": "hostinger"
}
```

### Step 6: Deploy to Fly.io

Set Fly.io secrets:
```bash
cd babylon-app

fly secrets set \
  IMAGE_UPLOAD_STRATEGY=hostinger \
  HOSTINGER_FTP_HOST=ftp.ravintolababylon.fi \
  HOSTINGER_FTP_USER="your_username@ravintolababylon.fi" \
  HOSTINGER_FTP_PASSWORD="your_password" \
  IMAGE_CDN_URL=https://images.ravintolababylon.fi
```

Deploy:
```bash
fly deploy
```

## How It Works

### Upload Flow
1. Admin uploads image via `/api/upload-image` or `/api/menu-items/:id/images`
2. System checks `IMAGE_UPLOAD_STRATEGY` environment variable
3. If `hostinger`:
   - Connects to FTP server via FTPS (secure)
   - Optimizes image using Sharp (resize, convert to WebP)
   - Generates unique filename: `timestamp-random.webp`
   - Creates directory structure: `/uploads/YYYY/MM/folder/filename.webp`
   - Uploads file to Hostinger
   - Returns public URL: `https://images.ravintolababylon.fi/uploads/2024/11/menu-items/123456-abc.webp`

### Image Optimization
All uploaded images are automatically:
- **Resized**: Max 1200x900px (maintains aspect ratio)
- **Converted**: To WebP format (85% quality)
- **Compressed**: Reduces file size by ~60-80%

### Delete Flow
1. When deleting menu item or changing image
2. System detects storage provider from URL
3. If URL contains `ravintolababylon.fi` → uses Hostinger FTP delete
4. Otherwise → uses Cloudinary delete

## Directory Structure on Hostinger

```
/public_html/uploads/
├── 2024/
│   ├── 11/
│   │   ├── menu-items/
│   │   │   ├── 1731612345-abc123.webp
│   │   │   ├── 1731612456-def456.webp
│   │   ├── categories/
│   │   │   ├── 1731613000-xyz789.webp
│   │   ├── banners/
│   │       ├── 1731614000-qwe123.webp
│   ├── 12/
│       ├── menu-items/
│           ├── ...
├── 2025/
    ├── 01/
        ├── ...
```

## API Endpoints

### 1. Test Connection
```http
GET /api/test-hostinger
Authorization: Bearer <token>
```

### 2. Upload Image (General)
```http
POST /api/upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <file>,
  "folder": "menu-items" | "categories" | "banners",
  "restaurantName": "babylon" (optional, unused with Hostinger)
}
```

### 3. Upload Menu Item Image
```http
POST /api/menu-items/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <file>
}
```

## Switching Between Hostinger and Cloudinary

To switch back to Cloudinary:
```env
IMAGE_UPLOAD_STRATEGY=cloudinary
```

The system will:
- Use Cloudinary for new uploads
- Still detect and delete old Hostinger images correctly
- Maintain backward compatibility

## Troubleshooting

### Connection Failed
- **Check credentials**: Ensure FTP username/password are correct
- **Check host**: Try `ftp.yourdomain.com` or IP address
- **Firewall**: Ensure Fly.io can reach Hostinger FTP (port 21)
- **SSL/TLS**: Hostinger uses FTPS (implicit SSL on port 21)

### Upload Fails
- **Permissions**: Ensure FTP user has write access to `/uploads`
- **Disk space**: Check Hostinger storage quota
- **File size**: Max 10MB per image (configured in `file-upload.ts`)

### Images Not Loading
- **Subdomain DNS**: Ensure `images.ravintolababylon.fi` points to Hostinger
- **Directory**: Verify document root is `/public_html/uploads`
- **File permissions**: Should be 644 or 755

### Testing FTP Manually
```bash
# Install lftp (on Linux/Mac)
lftp -u username@ravintolababylon.fi ftp://ftp.ravintolababylon.fi

# Or use FileZilla:
# Host: ftp.ravintolababylon.fi
# Port: 21
# Encryption: Use explicit FTP over TLS
```

## Security Considerations

1. **FTPS**: Connection uses SSL/TLS encryption
2. **Credentials**: Stored in Fly.io secrets (encrypted)
3. **File validation**: Only JPEG, PNG, WebP allowed
4. **Size limit**: 10MB max file size
5. **Unique filenames**: Prevents overwrites/conflicts
6. **No public FTP**: Only programmatic access

## Performance

### Upload Speed
- Hostinger FTP: ~2-5 seconds (depends on file size + server load)
- Cloudinary: ~1-3 seconds (optimized CDN)

### Image Delivery
- Subdomain: Direct from Hostinger (fast, no CDN)
- Optional: Add CloudFlare CDN in front of `images.ravintolababylon.fi`

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ⚠️ **Configure FTP credentials** in `.env`
3. ✅ Test connection: `npm run dev:mobile` → `/api/test-hostinger`
4. ⚠️ **Create subdomain** on Hostinger
5. ✅ Deploy to Fly.io with secrets
6. ✅ Test upload from admin panel

## Future Enhancements

- [ ] Batch upload support
- [ ] Image thumbnail generation
- [ ] Automatic backup to Cloudinary
- [ ] Admin UI to switch upload strategy
- [ ] Image compression settings
- [ ] CDN integration (CloudFlare)
- [ ] Migration script: Cloudinary → Hostinger
