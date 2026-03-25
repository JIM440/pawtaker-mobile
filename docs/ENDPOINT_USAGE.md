## New DB Endpoints and Usage

This app now has SQL RPC endpoints in:

- `supabase/migrations/20260324_add_app_endpoints.sql`

### 1) `public.get_home_feed(p_user_id, p_search, p_filter)`

Use in:

- `app/(private)/(tabs)/(home)/index.tsx`

What it returns:

- Open care requests with pet + owner summary
- Taker list (approved users)
- Current user pets (for send-request modal)

Why:

- Replaces scattered multi-query fetches for home page data
- Reduces false UI errors by using one backend aggregation call

---

### 2) `public.get_my_care_dashboard(p_user_id)`

Use in:

- `app/(private)/(tabs)/my-care/index.tsx`

What it returns:

- Active care contract summary
- Care given rows
- Care received rows
- Open/liked-style pet request items
- Stats (points, care given count, care received count)

Why:

- Makes My Care fully DB-driven from one endpoint
- Keeps empty states reliable when data is zero

---

### 3) `public.get_profile_bundle(p_user_id)`

Use in:

- `app/(private)/(tabs)/profile/index.tsx`
- `app/(private)/(tabs)/profile/edit.tsx`

What it returns:

- User profile
- Pets
- Availability (taker profile)
- Reviews + reviewer summary

Why:

- Simplifies profile loading path
- Prevents fragmented fetch failures causing incorrect error states

---

## Notes

- These functions enforce `auth.uid() = p_user_id`.
- They are granted to `authenticated`.
- If you want, next step is wiring the app screens to call `supabase.rpc(...)` directly for these three endpoints.
