-- Create bucket for admin assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('admin-assets', 'admin-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for admin-assets
CREATE POLICY "Admin assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-assets');

CREATE POLICY "Admins can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
