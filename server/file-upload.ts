import multer from 'multer';
import path from 'path';
import { uploadImageToCloudinary, deleteImageFromCloudinary } from './cloudinary';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Function to upload image to Cloudinary
export async function uploadImageToSupabase(
  file: Express.Multer.File, 
  restaurantName: string = 'default-restaurant',
  folder: string = 'menu'
): Promise<string> {
  try {
    console.log('📸 Uploading image to Cloudinary...');
    
    // Upload to Cloudinary instead of Supabase
    const imageUrl = await uploadImageToCloudinary(file, restaurantName, folder);
    
    console.log('✅ Image uploaded successfully to Cloudinary:', imageUrl);
    return imageUrl;
    
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
}

// Function to delete image from Cloudinary
export async function deleteImageFromSupabase(imageUrl: string): Promise<boolean> {
  try {
    console.log('🗑️ Deleting image from Cloudinary...');
    
    // Delete from Cloudinary instead of Supabase
    const success = await deleteImageFromCloudinary(imageUrl);
    
    if (success) {
      console.log('✅ Image deleted successfully from Cloudinary');
    } else {
      console.warn('⚠️ Image deletion from Cloudinary failed or was skipped');
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

// Function to ensure storage is ready (no longer needed for Cloudinary, but keeping for compatibility)
export async function ensureStorageBucket(): Promise<void> {
  // No bucket creation needed for Cloudinary
  console.log('📦 Using Cloudinary for image storage - no bucket setup required');
}

export { upload };
