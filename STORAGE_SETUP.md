# Supabase Storage Setup Instructions

## 1. Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to Storage in the sidebar
3. Click "Create bucket"
4. Bucket name: `menu-images`
5. Set as Public bucket: ✅ Yes
6. File size limit: 5 MB
7. Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

## 2. Set Storage Policies

Go to Storage > Policies and create the following policies:

### Policy 1: Public read access
- Policy name: "Public read access for menu images"
- Allowed operation: SELECT
- Target roles: public
- USING expression: `bucket_id = 'menu-images'`

### Policy 2: Authenticated upload
- Policy name: "Authenticated users can upload menu images"  
- Allowed operation: INSERT
- Target roles: authenticated
- WITH CHECK expression: `bucket_id = 'menu-images'`

### Policy 3: Authenticated update
- Policy name: "Authenticated users can update menu images"
- Allowed operation: UPDATE  
- Target roles: authenticated
- USING expression: `bucket_id = 'menu-images'`

### Policy 4: Authenticated delete
- Policy name: "Authenticated users can delete menu images"
- Allowed operation: DELETE
- Target roles: authenticated  
- USING expression: `bucket_id = 'menu-images'`

## 3. Alternatively, Run SQL Script

You can also run this SQL in the Supabase SQL Editor:

```sql
-- Create the menu-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for menu images" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update menu images" ON storage.objects
FOR UPDATE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete menu images" ON storage.objects
FOR DELETE USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');
```

## 4. Test the Setup

After setting up the storage, you should be able to:
- Upload images when creating/editing menu items
- View uploaded images in the menu
- Update/replace existing images
- Delete images when removing menu items
