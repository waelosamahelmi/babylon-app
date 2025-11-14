# Image Upload Architecture

## Current Flow (Before Implementation)

```
┌─────────────┐
│ Admin Panel │
│  (Upload)   │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   Backend API    │
│ /api/upload-image│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Cloudinary     │
│  (CDN Storage)   │
└──────┬───────────┘
       │
       ▼
https://res.cloudinary.com/...
```

## New Flow (With Hostinger Upload)

```
┌─────────────┐
│ Admin Panel │
│  (Upload)   │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│    Backend API       │
│  /api/upload-image   │
└──────┬───────────────┘
       │
       │ Check: IMAGE_UPLOAD_STRATEGY
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
       │ = 'hostinger'   │  = 'cloudinary'  │
       ▼                 ▼                  │
┌──────────────┐  ┌─────────────┐         │
│ hostinger-   │  │ cloudinary. │         │
│ upload.ts    │  │ ts          │         │
└──────┬───────┘  └──────┬──────┘         │
       │                 │                  │
       ▼                 ▼                  │
┌──────────────┐  ┌─────────────┐         │
│  FTP Upload  │  │  Cloudinary │         │
│  to Hostinger│  │    API      │         │
└──────┬───────┘  └──────┬──────┘         │
       │                 │                  │
       ▼                 ▼                  │
images.ravintolababylon  res.cloudinary    │
       .fi/uploads/...   .com/...          │
       │                 │                  │
       └─────────────────┴──────────────────┘
                         │
                         ▼
            ┌────────────────────┐
            │   Database Record  │
            │  (imageUrl field)  │
            └────────────────────┘
```

## Image Optimization Pipeline

```
┌─────────────┐
│ Original    │
│ Image       │  jpg/png, 5MB, 3000x2000
└──────┬──────┘
       │
       ▼
┌──────────────┐
│    Sharp     │
│ Processing   │
└──────┬───────┘
       │
       ├─ Resize: max 1200x900 (keep aspect ratio)
       ├─ Convert: WebP format
       ├─ Compress: 85% quality
       │
       ▼
┌──────────────┐
│ Optimized    │
│ Image        │  webp, 500KB, 1200x800
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ FTP Upload   │
│ to Hostinger │
└──────────────┘
```

## Directory Structure on Hostinger

```
/public_html/
├── wp-content/              ← OLD WordPress images (keep!)
│   └── uploads/
│       ├── 2024/
│       │   ├── 05/
│       │   ├── 06/
│       │   └── ...
│       └── 2025/
│
├── uploads/                 ← NEW uploaded images
│   ├── 2024/
│   │   └── 11/
│   │       ├── menu-items/
│   │       │   ├── 1731612345-abc123.webp
│   │       │   └── 1731612456-def456.webp
│   │       ├── categories/
│   │       │   └── 1731613000-xyz789.webp
│   │       └── banners/
│   │           └── 1731614000-qwe123.webp
│   └── 2025/
│       ├── 01/
│       ├── 02/
│       └── ...
│
└── index.html               ← Main website
```

## Subdomain Configuration

```
DNS Records:
┌──────────────────────────────┐
│ ravintolababylon.fi          │ → Fly.io (New React App)
│   A Record: 66.241.124.xxx   │
└──────────────────────────────┘

┌──────────────────────────────┐
│ images.ravintolababylon.fi   │ → Hostinger (Image Server)
│   A Record: Hostinger IP     │
│   Document Root: /uploads    │
└──────────────────────────────┘
```

## API Request Flow

### Upload Request
```http
POST /api/upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

┌─────────────────────────┐
│ folder: "menu-items"    │
│ image: <binary data>    │
└─────────────────────────┘
```

### Response
```json
{
  "imageUrl": "https://images.ravintolababylon.fi/uploads/2024/11/menu-items/1731612345-abc123.webp"
}
```

## Delete Request Flow

```
┌──────────────────────────┐
│ Delete Menu Item with    │
│ imageUrl                 │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│ deleteImageFromSupabase()│
│ (in file-upload.ts)      │
└───────────┬──────────────┘
            │
            │ Check URL domain
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
Contains         Contains
'ravintola       'cloudinary'
babylon.fi'?        ?
    │               │
    ▼               ▼
┌────────┐      ┌────────┐
│Hostinger│     │Cloudinary│
│ Delete │      │ Delete   │
└────────┘      └──────────┘
```

## Storage Strategy Decision Tree

```
Start Upload
    │
    ▼
Check IMAGE_UPLOAD_STRATEGY
    │
    ├─────────────┬──────────────┐
    │             │              │
'hostinger'   'cloudinary'   undefined
    │             │              │
    ▼             ▼              ▼
Upload to     Upload to     Upload to
Hostinger     Cloudinary    Cloudinary
via FTP       via API       (default)
    │             │              │
    └─────────────┴──────────────┘
                  │
                  ▼
        Return imageUrl
```

## Security & Performance

```
┌─────────────────────────────────────┐
│          Upload Security            │
├─────────────────────────────────────┤
│ ✓ FTPS (FTP over SSL)               │
│ ✓ Credentials in Fly.io secrets     │
│ ✓ File type validation (jpg/png/wp) │
│ ✓ File size limit (10MB)            │
│ ✓ Unique filenames (no overwrites)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│       Performance Metrics           │
├─────────────────────────────────────┤
│ Upload Time: 2-5 seconds            │
│ Optimization: 60-80% size reduction │
│ Format: WebP (modern, efficient)    │
│ Max Dimensions: 1200x900px          │
│ Quality: 85% (optimal balance)      │
└─────────────────────────────────────┘
```

## Migration Path

### Phase 1: Setup (Now)
```
✓ Code implemented
✓ Dependencies installed
⚠ Configure FTP credentials
⚠ Create subdomain
⚠ Test connection
```

### Phase 2: Coexistence
```
→ New uploads go to Hostinger
→ Old Cloudinary images still work
→ Both systems active
```

### Phase 3: Full Migration (Optional)
```
→ Update existing image URLs in database
→ Migrate Cloudinary images to Hostinger
→ Disable Cloudinary
```

---

**Legend:**
- ✓ Complete
- ⚠ Action required
- → In progress / planned
