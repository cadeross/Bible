-- Storage bucket for avatars (run this in Supabase Dashboard > SQL Editor)
-- 1. Create a bucket named 'avatars' with public access for reading (if it doesn't exist)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Storage policies for avatars bucket
-- Users can upload their own avatar
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar  
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read access for avatars
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
