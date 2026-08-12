-- migrate:up
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    round_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    start_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    instructions TEXT NOT NULL,
    interview_link TEXT NOT NULL,
    ai_result TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_interviews_round_type CHECK (round_type IN ('ai-interview', 'coding')),
    CONSTRAINT chk_interviews_status CHECK (
        status IN (
            'scheduled',
            'in-progress',
            'completed',
            'cancelled'
        )
    ),
    CONSTRAINT chk_interviews_duration CHECK (duration_minutes >= 15)
);

CREATE INDEX idx_interviews_company_id ON interviews(company_id);

CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);

CREATE INDEX idx_interviews_status ON interviews(status);

CREATE INDEX idx_interviews_round_type ON interviews(round_type);

CREATE INDEX idx_interviews_start_at ON interviews(start_at);

-- migrate:down
DROP INDEX IF EXISTS idx_interviews_start_at;

DROP INDEX IF EXISTS idx_interviews_round_type;

DROP INDEX IF EXISTS idx_interviews_status;

DROP INDEX IF EXISTS idx_interviews_candidate_id;

DROP INDEX IF EXISTS idx_interviews_company_id;

DROP TABLE IF EXISTS interviews;