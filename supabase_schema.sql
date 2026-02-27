-- Create the submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    twitter_username TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    tweet_url TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_hash TEXT,
    user_agent TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Allow public to insert (anyone can submit)
CREATE POLICY "Enable insert for all" ON submissions FOR INSERT WITH CHECK (true);

-- 2. No public select! Status checks are handled server-side.
-- 3. Service role (admin) bypasses RLS naturally, but we specify policies for clarity if needed.
-- In Supabase, service_role bypasses RLS by default.

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_wallet ON submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_twitter ON submissions(twitter_username);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
