-- ULTRA FINGERPRINT ATTENDANCE V2
-- Migration 003: Secure platform sessions.
--
-- Stores hashes of session tokens, never raw session tokens.
-- This migration prepares the database only.
-- It does not implement login or create a SuperAdmin account.

BEGIN;

CREATE TABLE platform_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  platform_user_id UUID NOT NULL
    REFERENCES platform_users(id)
    ON DELETE CASCADE,

  trusted_device_id UUID
    REFERENCES platform_trusted_devices(id)
    ON DELETE SET NULL,

  session_token_hash TEXT NOT NULL UNIQUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  last_used_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ NOT NULL,

  revoked_at TIMESTAMPTZ,

  CHECK (expires_at > created_at)
);

CREATE INDEX platform_sessions_user_idx
  ON platform_sessions (
    platform_user_id,
    created_at DESC
  );

CREATE INDEX platform_sessions_expiry_idx
  ON platform_sessions (expires_at);

CREATE INDEX platform_sessions_active_user_idx
  ON platform_sessions (platform_user_id, expires_at)
  WHERE revoked_at IS NULL;

COMMIT;
