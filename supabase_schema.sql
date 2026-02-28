-- ==============================
-- STATUS TRACKING REMOVAL + RLS HARDENING (FINAL)
-- ==============================

-- 0) Ensure tables exist (safe if already created)
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_username TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  tweet_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1) DROP DESTRUCTIVE REMNANTS (status features)
DROP VIEW IF EXISTS public.public_submissions CASCADE;
DROP FUNCTION IF EXISTS public.public_get_status(TEXT) CASCADE;

-- 2) RESET PRIVILEGES (targeted zero-trust)
REVOKE ALL ON TABLE public.submissions FROM anon, authenticated, public;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated, public;

-- 3) ENABLE RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4) CLEANUP OLD POLICIES (idempotent)
DO $$
BEGIN
  -- submissions
  DROP POLICY IF EXISTS "admin_select_all" ON public.submissions;
  DROP POLICY IF EXISTS "admin_update_all" ON public.submissions;
  DROP POLICY IF EXISTS "admin_delete_all" ON public.submissions;
  DROP POLICY IF EXISTS "public_insert_only" ON public.submissions;
  DROP POLICY IF EXISTS "Enable admin all access" ON public.submissions;
  DROP POLICY IF EXISTS "Enable public insert" ON public.submissions;
  DROP POLICY IF EXISTS "submissions_admin_select" ON public.submissions;
  DROP POLICY IF EXISTS "submissions_admin_update" ON public.submissions;
  DROP POLICY IF EXISTS "submissions_admin_delete" ON public.submissions;
  DROP POLICY IF EXISTS "submissions_public_insert" ON public.submissions;
  DROP POLICY IF EXISTS "admin_select" ON public.submissions;
  DROP POLICY IF EXISTS "admin_update" ON public.submissions;
  DROP POLICY IF EXISTS "admin_delete" ON public.submissions;
  DROP POLICY IF EXISTS "submission_insert" ON public.submissions;

  -- admin_users
  DROP POLICY IF EXISTS "admin_users_read_own" ON public.admin_users;
  DROP POLICY IF EXISTS "admin_users_self_read" ON public.admin_users;
  DROP POLICY IF EXISTS "Enable read for admins" ON public.admin_users;
  DROP POLICY IF EXISTS "Enable access for own record or admins" ON public.admin_users;
  DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
END $$;

-- 5) SUBMISSIONS POLICIES (Admin-only SELECT/UPDATE/DELETE)
CREATE POLICY "submissions_admin_select"
ON public.submissions
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "submissions_admin_update"
ON public.submissions
FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid()));

CREATE POLICY "submissions_admin_delete"
ON public.submissions
FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.id = auth.uid()));

-- 6) SUBMISSIONS POLICY (Public INSERT only, hardened)
CREATE POLICY "submissions_public_insert"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND admin_note IS NULL
);

-- 7) ADMIN_USERS POLICY (non-recursive, self-read only)
CREATE POLICY "admin_users_self_read"
ON public.admin_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 8) MINIMAL GRANTS (only what the app needs)
GRANT INSERT ON public.submissions TO anon, authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 9) Maintain updated_at trigger (idempotent)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.submissions;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 10) Indexes (safe)
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_wallet ON public.submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_twitter ON public.submissions(twitter_username);