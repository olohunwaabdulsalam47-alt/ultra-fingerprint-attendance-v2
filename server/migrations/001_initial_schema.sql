BEGIN;

CREATE TABLE IF NOT EXISTS platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL
        CHECK (role IN (
            'SUPER_ADMIN',
            'PLATFORM_ADMIN',
            'PLATFORM_SUPPORT',
            'PLATFORM_FINANCE',
            'PLATFORM_AUDITOR'
        )),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    school_code VARCHAR(50) NOT NULL UNIQUE,
    contact_phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'LOCKED'
        CHECK (status IN (
            'PENDING',
            'ACTIVE',
            'LOCKED',
            'SUSPENDED'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    full_name VARCHAR(150) NOT NULL,
    staff_id VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('PRINCIPAL', 'TEACHER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (school_id, staff_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    plan_code VARCHAR(50) NOT NULL,
    amount_due_minor BIGINT NOT NULL
        CHECK (amount_due_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'NGN',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'ACTIVE',
            'EXPIRED',
            'CANCELLED'
        )),
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        expires_at IS NULL
        OR starts_at IS NULL
        OR expires_at > starts_at
    )
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    subscription_id UUID REFERENCES subscriptions(id),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'NGN',
    provider VARCHAR(50) NOT NULL,
    provider_reference VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'VERIFIED',
            'FAILED',
            'REJECTED'
        )),
    verified_by UUID REFERENCES platform_users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_reference),
    CHECK (
        (status = 'VERIFIED'
            AND verified_by IS NOT NULL
            AND verified_at IS NOT NULL)
        OR status <> 'VERIFIED'
    )
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_platform_user_id UUID REFERENCES platform_users(id),
    actor_school_user_id UUID REFERENCES school_users(id),
    school_id UUID REFERENCES schools(id),
    event_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id VARCHAR(200),
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        actor_platform_user_id IS NOT NULL
        OR actor_school_user_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_school_users_school_id
    ON school_users(school_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_school_status
    ON subscriptions(school_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_school_status
    ON payments(school_id, status);

CREATE INDEX IF NOT EXISTS idx_audit_events_school_created
    ON audit_events(school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_created
    ON audit_events(created_at DESC);

COMMIT;
