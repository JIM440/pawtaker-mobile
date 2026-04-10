-- Allow authenticated users to delete only their own chat messages (app enforces sender match).
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
on public.messages
for delete
to authenticated
using (sender_id = auth.uid());
