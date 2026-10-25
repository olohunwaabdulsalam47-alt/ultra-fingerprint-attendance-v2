
-- ULTRA FINGERPRINT ATTENDANCE V2
-- Migration 004: SuperAdmin Staff ID mapping.
-- Does not create an account or grant access.

BEGIN;

ALTER TABLE platform_users
  ADD COLUMN IF NOT EXISTS staff_id VARCHAR(40);

CREATE UNIQUE INDEX IF NOT EXISTS
  platform_users_superadmin_staff_id_unique
ON platform_users (UPPER(staff_id))
WHERE staff_id IS NOT NULL
  AND role = 'SUPER_ADMIN';

COMMIT;
