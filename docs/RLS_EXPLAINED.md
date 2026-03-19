# Row Level Security — Explained Simply
## What It Is, Why It Exists, and How PawTaker Uses It

---

## The Problem It Solves

Imagine you have a database table called `users` with 10,000 rows — one row per user. Every row has a name, email, city, KYC status, and points balance.

Without any protection, **anyone who can talk to your database can read every single row**. That means User A could read User B's private data. A hacker who gets hold of your API key could dump every user's information. Even your own app code could accidentally overwrite the wrong user's data.

Row Level Security (RLS) is the database's way of saying:

> **"Before you touch any row, I'll check whether you're actually allowed to touch *that specific row*."**

Not the whole table. Not a broad permission. Each. Individual. Row.

---

## The Analogy: A Hotel and Room Keys

Think of your database table as a hotel with 10,000 rooms.

- Without RLS: every guest has a master key. Anyone can open any door.
- With RLS: every guest only gets a key to their own room. The hotel checks your key *every time* you try to open a door.

The hotel doesn't need to trust that guests will behave. The locks enforce it automatically.

---

## How Supabase Knows Who You Are

When your app sends a request to Supabase, it attaches a **JWT token** in the request header. That token is signed by Supabase and contains the user's ID:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Inside the token, Supabase can read who is making the request. It exposes this as a special function you can use in any RLS policy:

```sql
auth.uid()
```

This returns the UUID of the currently logged-in user. It's the foundation of every RLS policy in PawTaker.

---

## Two Separate Layers (This Trips Everyone Up)

Before RLS even runs, there is a lower-level permission system. These two layers work together — **both must be configured or nothing works**.

### Layer 1 — Table-Level Grants (PostgreSQL roles)

This controls whether a role (like `authenticated` — meaning any logged-in user) is even *allowed to attempt* an operation on a table.

```sql
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
```

Think of this as the hotel letting guests into the building at all.

### Layer 2 — RLS Policies (row-by-row rules)

Once a role is granted table access, RLS policies decide *which specific rows* they can touch.

Think of this as the room key system — you're in the building, but you can only open your own door.

**If you enable RLS but forget the GRANT:** Supabase rejects the request at layer 1. You get a `403 Forbidden` error before RLS even runs.

**If you do the GRANT but skip RLS policies:** all rows are accessible to all authenticated users. That's a security hole.

**You need both layers** — the GRANT to let them in, and the policies to lock individual rows.

---

## PawTaker's RLS Setup

### Step 1 — Enable RLS on the table

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

This line turns on the security system. From this moment on, no row can be read, written, or deleted without a matching policy that allows it.

### Step 2 — Create the policies

PawTaker has three policies on `public.users`:

---

#### Policy 1 — `users_select_own`
*"You can only READ your own row."*

```sql
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);
```

**Plain English:**
- `FOR SELECT` — this rule applies when someone tries to read data
- `TO authenticated` — only applies to logged-in users
- `USING (auth.uid() = id)` — the request is only allowed if the `id` column of the row being read matches the ID of the person making the request

Result: when the app fetches the current user's profile, Supabase only returns rows where `id = the logged-in user's UUID`. If you try to fetch someone else's row, you get zero results — not an error, just empty. The data is invisible to you.

---

#### Policy 2 — `users_update_own`
*"You can only UPDATE your own row."*

```sql
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Plain English:**
- `FOR UPDATE` — this rule applies when someone tries to change data
- `USING (auth.uid() = id)` — the row being updated must belong to the logged-in user
- `WITH CHECK (auth.uid() = id)` — after the update, the row must still belong to the same user (prevents tricks like changing your own `id` to steal someone else's row)

Result: the declaration screen can call `UPDATE public.users SET city = '...' WHERE id = ?` and it only succeeds if the `id` in the WHERE clause matches the logged-in user. If you tried `WHERE id = 'some-other-users-id'`, the database silently refuses — no error, just 0 rows affected.

---

#### Policy 3 — `users_insert_own`
*"You can only INSERT a row with your own ID."*

```sql
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
```

**Plain English:**
- `FOR INSERT` — this rule applies when a new row is being added
- `WITH CHECK (auth.uid() = id)` — the new row's `id` field must match the logged-in user's UUID

Result: a user cannot create a row in `public.users` pretending to be someone else. The `id` in the new row must be their own.

> Note: in PawTaker's case, `public.users` rows are actually created by the `handle_new_user()` PostgreSQL trigger — which runs as `supabase_auth_admin` (a superuser that bypasses RLS entirely). This policy mainly prevents edge cases where app code tries to manually insert a row.

---

## The `kyc_submissions` Table

The same pattern applies to `kyc_submissions`:

```sql
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own submissions
CREATE POLICY "kyc_select_own" ON public.kyc_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can only submit their own KYC
CREATE POLICY "kyc_insert_own" ON public.kyc_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

The column is `user_id` (not `id`), so the condition becomes `auth.uid() = user_id`.

This means:
- A user can submit their own KYC documents
- They can see the status of their own submission
- They cannot see or modify any other user's submission
- Admins (who connect with service-role credentials that bypass RLS) can see all submissions for review

---

## What Happens Without RLS

If you removed all the policies and just left `GRANT SELECT ON public.users TO authenticated`, every logged-in user could run:

```sql
SELECT * FROM public.users;
```

...and get back **every user's row**. 10,000 names, emails, cities, KYC statuses, points balances — all exposed.

With RLS enabled, that same query returns exactly **one row**: the user's own.

---

## Common Mistakes (And What Went Wrong in PawTaker's Case)

### Mistake 1 — Enabling RLS without creating policies

RLS enabled + no policies = **nothing is accessible**. Every query returns empty results or 403. This confuses developers because the table seems broken.

### Mistake 2 — Creating policies without GRANT

Policies exist but the `authenticated` role was never granted table access. Supabase rejects the request at the PostgreSQL level before the policy is even checked. Result: `403 Forbidden`.

**This is exactly what happened during PawTaker development:**
- RLS policies were created for `UPDATE`
- But `GRANT UPDATE ON public.users TO authenticated` had never been run
- Fix: `GRANT USAGE ON SCHEMA public TO authenticated; GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;`

### Mistake 3 — Forgetting the schema GRANT

Even if you grant on the table, PostgreSQL requires you to also grant `USAGE` on the schema:

```sql
GRANT USAGE ON SCHEMA public TO authenticated;
```

Without this, the role can't even see the `public` schema, let alone the tables inside it.

---

## Summary Table

| Policy | Operation | Condition | What It Prevents |
|--------|-----------|-----------|-----------------|
| `users_select_own` | SELECT | `auth.uid() = id` | Reading other users' profiles |
| `users_update_own` | UPDATE | `auth.uid() = id` | Modifying other users' data |
| `users_insert_own` | INSERT | `auth.uid() = id` | Creating rows as someone else |
| `kyc_select_own` | SELECT | `auth.uid() = user_id` | Viewing other users' KYC status |
| `kyc_insert_own` | INSERT | `auth.uid() = user_id` | Submitting KYC as someone else |

---

## The Key Takeaway

RLS is not something your app code enforces. It's enforced by the **database itself**, on every single query, automatically. Even if a bug in your app code tries to fetch the wrong user's data, the database refuses to return it. Even if someone gets your Supabase anon key and writes their own queries, they still can only see their own rows.

That's the power of Row Level Security — the protection lives in the database, not in your app.
