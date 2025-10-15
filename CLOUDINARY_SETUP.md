# Cloudinary Setup Instructions

## 1. Create Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After registration, you'll be taken to your dashboard
3. Note down your Cloud Name, API Key, and API Secret from the dashboard

## 2. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
```

Replace the placeholder values with your actual Cloudinary credentials:
- `your-cloud-name`: Your Cloudinary cloud name (from dashboard)
- `your-api-key`: Your API Key (from dashboard)
- `your-api-secret`: Your API Secret (from dashboard)

## 3. Cloudinary Features Enabled

This setup provides:

### Server-side Upload (Recommended)
- Secure uploads using API secret
- Automatic image optimization (quality: auto, format: auto)
- Image transformations (resize to max 800x600)
- Organized storage in folders (`restaurant-menu/`)

### Image Management
- Automatic deletion of old images when updating
- Support for JPEG, PNG, WebP, and GIF formats
- 10MB file size limit
- Automatic URL generation for displaying images

## 4. Usage

### In Components
```typescript
import { uploadImageToCloudinary, updateImageInCloudinary } from "@/lib/cloudinary";

// Upload new image with restaurant name
const imageUrl = await uploadImageToCloudinary(file, 'Pizzeria Antonio', 'menu-items');

// Update existing image (deletes old, uploads new)
const imageUrl = await updateImageInCloudinary(oldImageUrl, newFile, 'Pizzeria Antonio', 'menu-items');
```

**Note:** The restaurant name is automatically fetched from the restaurant configuration, so you typically don't need to pass it manually.

### API Endpoints
- `POST /api/upload-image` - General image upload
- `POST /api/menu-items/:id/images` - Menu item specific image upload

## 5. Folder Structure

Images are now organized by restaurant name in Cloudinary:
```
pizzeria-antonio/           # Restaurant name (sanitized)
├── menu-items/            # Menu item images
│   ├── timestamp-random.jpg
│   └── timestamp-random.png
├── menu/                  # General menu images
│   └── special-offers.jpg
└── logos/                 # Restaurant logos and branding
    └── logo.png

another-restaurant/         # Another restaurant
├── menu-items/
└── menu/
```

**Folder Naming:**
- Restaurant names are automatically sanitized (lowercase, special characters replaced with hyphens)
- Examples:
  - "Pizzeria Antonio" → `pizzeria-antonio/`
  - "Café De Luxe" → `cafe-de-luxe/`
  - "Restaurant & Bar" → `restaurant-bar/`

## 6. Benefits over Supabase Storage

✅ **Better Performance**: Global CDN for faster image delivery  
✅ **Automatic Optimization**: Images are automatically optimized for web  
✅ **Transformations**: Real-time image resizing and format conversion  
✅ **Better Reliability**: Dedicated image storage service  
✅ **More Storage**: Generous free tier limits  
✅ **Advanced Features**: AI-powered cropping, effects, and more  

## 7. Migration from Supabase

The app has been updated to use Cloudinary instead of Supabase Storage:

- All new image uploads will go to Cloudinary
- Existing Supabase image URLs will continue to work
- Old images can be manually migrated if needed

## 8. Testing the Setup

1. Ensure your `.env` file has the correct Cloudinary credentials
2. Restart your development server: `npm run dev`
3. Try uploading an image in the admin panel
4. Check the browser console for upload success messages
5. Verify the image appears correctly in your app

## 9. Troubleshooting

### Common Issues:

**"Cloudinary not configured" error:**
- Check that all environment variables are set correctly
- Restart your development server after adding environment variables

**Upload fails with 401 error:**
- Verify your API Key and API Secret are correct
- Check that the credentials haven't expired

**Images not displaying:**
- Verify the returned URL is accessible
- Check browser console for any CORS issues

**File size errors:**
- Current limit is 10MB, adjust in the code if needed
- Cloudinary free tier has monthly limits

### Need Help?

Check the Cloudinary documentation: https://cloudinary.com/documentation