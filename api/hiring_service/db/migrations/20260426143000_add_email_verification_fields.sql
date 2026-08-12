-- migrate:up
ALTER TABLE
    users
ADD
    COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD
    COLUMN email_verification_code VARCHAR(6),
ADD
    COLUMN email_verification_expires_at TIMESTAMPTZ;

UPDATE
    users
SET
    email_verified = TRUE
WHERE
    sso_provider IS NOT NULL
    OR password_hash IS NOT NULL;

CREATE INDEX idx_users_email_verification_code ON users (email_verification_code);

-- migrate:down
DROP INDEX IF EXISTS idx_users_email_verification_code;

ALTER TABLE
    users DROP COLUMN IF EXISTS email_verification_expires_at,
    DROP COLUMN IF EXISTS email_verification_code,
    DROP COLUMN IF EXISTS email_verified;