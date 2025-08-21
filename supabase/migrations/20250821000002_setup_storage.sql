-- Create storage buckets and policies for menu item images
-- Run this in your Supabase SQL editor

-- Create the menu-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access to menu images
CREATE POLICY "Public read access for menu images" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');

-- Create policy to allow authenticated users to upload menu images
CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update menu images
CREATE POLICY "Authenticated users can update menu images" ON storage.objects
FOR UPDATE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete menu images
CREATE POLICY "Authenticated users can delete menu images" ON storage.objects
FOR DELETE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
