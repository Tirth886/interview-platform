-- migrate:up
ALTER TABLE
    companies
ADD
    COLUMN domain VARCHAR(255),
ADD
    COLUMN size VARCHAR(20);

UPDATE
    companies
SET
    domain = 'unknown.com'
WHERE
    domain IS NULL;

UPDATE
    companies
SET
    size = '1-10'
WHERE
    size IS NULL;

ALTER TABLE
    companies
ALTER COLUMN
    domain
SET
    NOT NULL,
ALTER COLUMN
    size
SET
    NOT NULL;

ALTER TABLE
    users
ADD
    COLUMN role VARCHAR(20);

UPDATE
    users
SET
    role = 'admin'
WHERE
    role IS NULL;

ALTER TABLE
    users
ALTER COLUMN
    role
SET
    NOT NULL;

-- migrate:down
ALTER TABLE
    users DROP COLUMN IF EXISTS role;

ALTER TABLE
    companies DROP COLUMN IF EXISTS size,
    DROP COLUMN IF EXISTS domain;