-- ULTRA FINGERPRINT ATTENDANCE V2
-- Migration 002: Phone authentication and trusted devices.
--
-- This migration prepares the database schema.
-- It does not create a SuperAdmin account or implement login.

BEGIN;

-- Phone numbers will be stored in international E.164 format,
-- for example: +2348012345678.

ALTER TABLE platform_users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE platform_users
  ADD COLUMN phone_number VARCHAR(16);

ALTER TABLE platform_users
  ADD CONSTRAINT platform_users_phone_number_format_check
  CHECK (
    phone_number IS NULL
    OR phone_number ~ '^\+[1-9][0-9]{7,14}$'
  );

CREATE UNIQUE INDEX platform_users_phone_number_unique_idx
  ON platform_users (phone_number)
  WHERE phone_number IS NOT NULL;

-- Store hashed OTP challenges, never plaintext OTP codes.

CREATE TABLE platform_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  platform_user_id UUID NOT NULL
    REFERENCES platform_users(id)
    ON DELETE CASCADE,

  phone_number VARCHAR(16) NOT NULL,

  otp_hash TEXT NOT NULL,

  purpose VARCHAR(32) NOT NULL
    CHECK (purpose = 'TRUST_NEW_DEVICE'),

  expires_at TIMESTAMPTZ NOT NULL,

  attempts INTEGER NOT NULL DEFAULT 0
    CHECK (attempts >= 0 AND attempts <= 5),

  consumed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX platform_otp_challenges_user_created_idx
  ON platform_otp_challenges (
    platform_user_id,
    created_at DESC
  );

CREATE INDEX platform_otp_challenges_expiry_idx
  ON platform_otp_challenges (expires_at);

-- Store only hashes of trusted-device tokens.
-- The raw device token must never be stored in this table.

CREATE TABLE platform_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  platform_user_id UUID NOT NULL
    REFERENCES platform_users(id)
    ON DELETE CASCADE,

  device_token_hash TEXT NOT NULL UNIQUE,

  device_name VARCHAR(120),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  last_used_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ NOT NULL,

  revoked_at TIMESTAMPTZ
);

CREATE INDEX platform_trusted_devices_user_idx
  ON platform_trusted_devices (platform_user_id);

CREATE INDEX platform_trusted_devices_expiry_idx
  ON platform_trusted_devices (expires_at);

COMMIT;
