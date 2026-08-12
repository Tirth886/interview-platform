-- migrate:up
ALTER TABLE
    users DROP CONSTRAINT IF EXISTS fk_users_role_master;

ALTER TABLE
    role_master
ADD
    COLUMN id UUID;

UPDATE
    role_master
SET
    id = gen_random_uuid()
WHERE
    id IS NULL;

ALTER TABLE
    role_master
ALTER COLUMN
    id
SET
    NOT NULL;

ALTER TABLE
    role_master DROP CONSTRAINT IF EXISTS role_master_pkey;

ALTER TABLE
    role_master
ADD
    CONSTRAINT role_master_pkey PRIMARY KEY (id);

ALTER TABLE
    role_master
ADD
    CONSTRAINT uq_role_master_code UNIQUE (code);

ALTER TABLE
    users
ADD
    CONSTRAINT fk_users_role_master FOREIGN KEY (role) REFERENCES role_master(code);

-- migrate:down
ALTER TABLE
    users DROP CONSTRAINT IF EXISTS fk_users_role_master;

ALTER TABLE
    role_master DROP CONSTRAINT IF EXISTS uq_role_master_code;

ALTER TABLE
    role_master DROP CONSTRAINT IF EXISTS role_master_pkey;

ALTER TABLE
    role_master
ADD
    CONSTRAINT role_master_pkey PRIMARY KEY (code);

ALTER TABLE
    role_master DROP COLUMN IF EXISTS id;

ALTER TABLE
    users
ADD
    CONSTRAINT fk_users_role_master FOREIGN KEY (role) REFERENCES role_master(code);