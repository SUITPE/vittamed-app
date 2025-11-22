-- Migration: User activation and security enhancements
-- Add email verification tokens and mandatory password change functionality

-- 1. Add new columns to custom_users table
ALTER TABLE custom_users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- 2. Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES custom_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE
);

-- 3. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- 4. Update existing users to mark them as verified (backwards compatibility)
UPDATE custom_users
SET
  email_verified = true,
  must_change_password = false
WHERE email_verified IS NULL OR email_verified = false;

-- 5. Add comment to table
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens for user activation';
COMMENT ON COLUMN email_verification_tokens.token IS 'Unique token sent via email for account activation';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'Timestamp when token was used (null if unused)';

-- 6. Add RLS policies for email_verification_tokens
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to manage tokens
CREATE POLICY "Service role can manage verification tokens" ON email_verification_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Create function to clean up expired tokens (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_tokens
  WHERE expires_at < now() - INTERVAL '7 days'
  AND used_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_verification_tokens() IS 'Deletes expired verification tokens older than 7 days';
