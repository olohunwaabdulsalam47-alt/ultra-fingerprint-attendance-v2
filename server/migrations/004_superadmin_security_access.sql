-- ULTRA FINGERPRINT ATTENDANCE V2
-- Migration 004: SuperAdmin security-page access grants.
--
-- Security grants are separate from ordinary login sessions.
-- A grant must be issued only after successful security-page OTP
-- verification by the backend.
--
-- Store only hashes of security-access tokens.
-- Never store raw security-access tokens.
--
-- This migration prepares the database only.
-- It does not create a SuperAdmin account or implement OTP routes.

BEGIN;

CREATE TABLE platform_security_access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  platform_user_id UUID NOT NULL
    REFERENCES platform_users(id)
    ON DELETE CASCADE,

  session_token_hash TEXT NOT NULL
    REFERENCES platform_sessions(session_token_hash)
    ON DELETE CASCADE,

  grant_token_hash TEXT NOT NULL UNIQUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  expires_at TIMESTAMPTZ NOT NULL,

  revoked_at TIMESTAMPTZ,

  CHECK (expires_at > created_at)
);

CREATE INDEX platform_security_access_grants_user_idx
  ON platform_security_access_grants (
    platform_user_id,
    created_at DESC
  );

CREATE INDEX platform_security_access_grants_session_idx
  ON platform_security_access_grants (
    session_token_hash,
    expires_at
  );

CREATE INDEX platform_security_access_grants_expiry_idx
  ON platform_security_access_grants (expires_at);

CREATE INDEX platform_security_access_grants_active_idx
  ON platform_security_access_grants (
    platform_user_id,
    session_token_hash,
    expires_at
  )
  WHERE revoked_at IS NULL;

COMMIT;
