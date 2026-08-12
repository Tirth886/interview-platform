-- migrate:up
CREATE TABLE role_master (
    code VARCHAR(30) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO
    role_master (code, display_name)
VALUES
    ('admin', 'Admin'),
    ('company_admin', 'Company Admin'),
    ('team_member', 'Team Member');

UPDATE
    users
SET
    role = 'admin'
WHERE
    role IS NULL;

UPDATE
    users
SET
    role = 'team_member'
WHERE
    role = 'recruiter';

UPDATE
    users
SET
    role = 'team_member'
WHERE
    role NOT IN ('admin', 'company_admin', 'team_member');

ALTER TABLE
    users
ADD
    CONSTRAINT fk_users_role_master FOREIGN KEY (role) REFERENCES role_master(code);

-- migrate:down
ALTER TABLE
    users DROP CONSTRAINT IF EXISTS fk_users_role_master;

DROP TABLE IF EXISTS role_master;