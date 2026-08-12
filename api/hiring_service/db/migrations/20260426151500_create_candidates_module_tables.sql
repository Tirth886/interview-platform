-- migrate:up
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    resume_url TEXT NOT NULL DEFAULT '',
    experience_summary TEXT NOT NULL DEFAULT 'Experience summary not provided',
    profile_keywords TEXT [] NOT NULL DEFAULT ARRAY [] :: TEXT [],
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    ai_evaluation JSONB NOT NULL DEFAULT '{"overallScore":0,"atsScore":0,"codingScore":0,"communicationScore":0,"domainScore":0,"summary":"Pending evaluation"}' :: jsonb,
    final_decision VARCHAR(20),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_candidates_status CHECK (
        status IN (
            'pending',
            'active',
            'hold',
            'rejected',
            'selected'
        )
    )
);

CREATE TABLE candidate_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE candidate_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    label VARCHAR(255) NOT NULL,
    detail TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_candidate_timeline_type CHECK (
        type IN (
            'applied',
            'status',
            'automation',
            'note',
            'decision'
        )
    )
);

CREATE INDEX idx_candidates_company_id ON candidates(company_id);

CREATE INDEX idx_candidates_status ON candidates(status);

CREATE INDEX idx_candidates_applied_at ON candidates(applied_at DESC);

CREATE INDEX idx_candidates_job_id ON candidates(job_id);

CREATE INDEX idx_candidates_email ON candidates(email);

CREATE INDEX idx_candidate_notes_candidate_id ON candidate_notes(candidate_id);

CREATE INDEX idx_candidate_timeline_candidate_id ON candidate_timeline(candidate_id);

-- migrate:down
DROP INDEX IF EXISTS idx_candidate_timeline_candidate_id;

DROP INDEX IF EXISTS idx_candidate_notes_candidate_id;

DROP INDEX IF EXISTS idx_candidates_email;

DROP INDEX IF EXISTS idx_candidates_job_id;

DROP INDEX IF EXISTS idx_candidates_applied_at;

DROP INDEX IF EXISTS idx_candidates_status;

DROP INDEX IF EXISTS idx_candidates_company_id;

DROP TABLE IF EXISTS candidate_timeline;

DROP TABLE IF EXISTS candidate_notes;

DROP TABLE IF EXISTS candidates;