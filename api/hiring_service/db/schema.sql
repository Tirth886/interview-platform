SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    context_markdown text DEFAULT ''::text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: candidate_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    meta_key character varying(100) NOT NULL,
    meta_value text,
    value_type character varying(20) DEFAULT 'string'::character varying NOT NULL,
    source character varying(40) DEFAULT 'manual'::character varying NOT NULL,
    parse_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: candidate_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    candidate_id uuid NOT NULL,
    text text NOT NULL,
    author character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: candidate_resume_parses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_resume_parses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    workflow_id character varying(100),
    resume_key text,
    resume_url text,
    file_name text,
    parser_version character varying(50) DEFAULT 'resume_parser@1'::character varying NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    error_message text,
    personal_information jsonb DEFAULT '{}'::jsonb NOT NULL,
    professional_summary text,
    total_experience character varying(100),
    skills jsonb DEFAULT '{}'::jsonb NOT NULL,
    experience jsonb DEFAULT '[]'::jsonb NOT NULL,
    education jsonb DEFAULT '[]'::jsonb NOT NULL,
    projects jsonb DEFAULT '[]'::jsonb NOT NULL,
    certifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    languages jsonb DEFAULT '[]'::jsonb NOT NULL,
    achievements jsonb DEFAULT '[]'::jsonb NOT NULL,
    internships jsonb DEFAULT '[]'::jsonb NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    raw_payload jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_candidate_resume_parses_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: candidate_stage_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_stage_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    workflow_id character varying(100) NOT NULL,
    candidate_workflow_id uuid,
    workflow_stage_id character varying(100),
    stage_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    score integer,
    max_score integer DEFAULT 100 NOT NULL,
    result jsonb DEFAULT '{}'::jsonb NOT NULL,
    resume_parse_id uuid,
    jd_key text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    evaluated_by character varying(100),
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_candidate_stage_attempts_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'passed'::character varying, 'failed'::character varying, 'skipped'::character varying, 'completed'::character varying])::text[])))
);


--
-- Name: candidate_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    candidate_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    label character varying(255) NOT NULL,
    detail text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_candidate_timeline_type CHECK (((type)::text = ANY ((ARRAY['applied'::character varying, 'status'::character varying, 'automation'::character varying, 'note'::character varying, 'decision'::character varying])::text[])))
);


--
-- Name: candidate_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidate_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    workflow_id character varying(100) NOT NULL,
    batch_name character varying(255),
    current_stage_id character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    resume_url text DEFAULT ''::text NOT NULL,
    latest_parse_id uuid,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_candidate_workflows_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'hold'::character varying, 'rejected'::character varying, 'selected'::character varying])::text[])))
);


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    resume_url text DEFAULT ''::text NOT NULL,
    experience_summary text DEFAULT 'Experience summary not provided'::text NOT NULL,
    profile_keywords text[] DEFAULT ARRAY[]::text[] NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    ai_evaluation jsonb DEFAULT '{"summary": "Pending evaluation", "atsScore": 0, "codingScore": 0, "domainScore": 0, "overallScore": 0, "communicationScore": 0}'::jsonb NOT NULL,
    final_decision character varying(20),
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    phone_number character varying(30),
    workflow_id character varying(100),
    parsed_resume jsonb,
    batch_name character varying(255),
    current_job_title character varying(255),
    current_stage_id character varying(100),
    latest_parse_id uuid,
    latest_ats_attempt_id uuid,
    latest_ats_score integer,
    CONSTRAINT chk_candidates_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'hold'::character varying, 'rejected'::character varying, 'selected'::character varying])::text[])))
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    domain character varying(255) NOT NULL,
    size character varying(20) NOT NULL
);


--
-- Name: interview_schedule_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_schedule_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    workflow_id character varying(100) NOT NULL,
    workflow_node_id uuid,
    stage_label character varying(255) NOT NULL,
    stage_description text DEFAULT ''::text NOT NULL,
    round_type character varying(30) NOT NULL,
    duration_minutes integer DEFAULT 45 NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    scheduled_start_at timestamp with time zone,
    interview_id uuid,
    emailed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_schedule_invites_duration CHECK ((duration_minutes >= 15)),
    CONSTRAINT chk_schedule_invites_round_type CHECK (((round_type)::text = ANY ((ARRAY['ai-interview'::character varying, 'coding'::character varying, 'human-interview'::character varying, 'qa-evaluation'::character varying])::text[]))),
    CONSTRAINT chk_schedule_invites_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'scheduled'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: interviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    round_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'scheduled'::character varying NOT NULL,
    start_at timestamp with time zone NOT NULL,
    duration_minutes integer NOT NULL,
    instructions text NOT NULL,
    interview_link text NOT NULL,
    ai_result text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    qa_bank_id uuid,
    CONSTRAINT chk_interviews_duration CHECK ((duration_minutes >= 15)),
    CONSTRAINT chk_interviews_round_type CHECK (((round_type)::text = ANY ((ARRAY['ai-interview'::character varying, 'coding'::character varying, 'human-interview'::character varying, 'qa-evaluation'::character varying])::text[]))),
    CONSTRAINT chk_interviews_status CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: qa_banks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_banks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    is_delete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: qa_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    question_id uuid NOT NULL,
    option_text text DEFAULT ''::text NOT NULL,
    is_code_view boolean DEFAULT false NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_delete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: qa_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    qa_bank_id uuid NOT NULL,
    question_text text DEFAULT ''::text NOT NULL,
    is_code_view boolean DEFAULT false NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_delete boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: role_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_master (
    code character varying(30) NOT NULL,
    display_name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: stage_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stage_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    stage_type character varying(50) NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    icon character varying(64) DEFAULT 'circle'::character varying NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    full_name character varying(255) NOT NULL,
    sso_provider character varying(50),
    sso_subject character varying(255),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role character varying(20) NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    email_verification_code character varying(6),
    email_verification_expires_at timestamp with time zone
);


--
-- Name: workflow_edges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_edges (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    source_node_id uuid NOT NULL,
    target_node_id uuid NOT NULL,
    source_handle character varying(100),
    target_handle character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_delete boolean DEFAULT false NOT NULL
);


--
-- Name: workflow_nodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_nodes (
    id uuid NOT NULL,
    company_id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    kind character varying(50) NOT NULL,
    label character varying(255) DEFAULT ''::character varying NOT NULL,
    stage_definition_id uuid,
    ai_agent_id uuid,
    position_x double precision DEFAULT 0 NOT NULL,
    position_y double precision DEFAULT 0 NOT NULL,
    width double precision,
    height double precision,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    code character varying(100) DEFAULT ''::character varying NOT NULL,
    conductor character varying(20) DEFAULT 'ai'::character varying NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    is_delete boolean DEFAULT false NOT NULL,
    qa_bank_id uuid,
    CONSTRAINT chk_workflow_nodes_conductor CHECK (((conductor)::text = ANY ((ARRAY['ai'::character varying, 'human'::character varying, 'qa'::character varying])::text[])))
);


--
-- Name: workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    designation_id character varying(100) DEFAULT ''::character varying NOT NULL,
    nodes jsonb DEFAULT '[]'::jsonb NOT NULL,
    edges jsonb DEFAULT '[]'::jsonb NOT NULL,
    stages jsonb DEFAULT '[]'::jsonb NOT NULL,
    job_description_file_name text DEFAULT ''::text NOT NULL,
    job_description_url text DEFAULT ''::text NOT NULL,
    job_description_key text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_agents ai_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agents
    ADD CONSTRAINT ai_agents_pkey PRIMARY KEY (id);


--
-- Name: candidate_metadata candidate_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_metadata
    ADD CONSTRAINT candidate_metadata_pkey PRIMARY KEY (id);


--
-- Name: candidate_notes candidate_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_notes
    ADD CONSTRAINT candidate_notes_pkey PRIMARY KEY (id);


--
-- Name: candidate_resume_parses candidate_resume_parses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_resume_parses
    ADD CONSTRAINT candidate_resume_parses_pkey PRIMARY KEY (id);


--
-- Name: candidate_stage_attempts candidate_stage_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_stage_attempts
    ADD CONSTRAINT candidate_stage_attempts_pkey PRIMARY KEY (id);


--
-- Name: candidate_timeline candidate_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_timeline
    ADD CONSTRAINT candidate_timeline_pkey PRIMARY KEY (id);


--
-- Name: candidate_workflows candidate_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_workflows
    ADD CONSTRAINT candidate_workflows_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: interview_schedule_invites interview_schedule_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_schedule_invites
    ADD CONSTRAINT interview_schedule_invites_pkey PRIMARY KEY (id);


--
-- Name: interview_schedule_invites interview_schedule_invites_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_schedule_invites
    ADD CONSTRAINT interview_schedule_invites_token_key UNIQUE (token);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: qa_banks qa_banks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_banks
    ADD CONSTRAINT qa_banks_pkey PRIMARY KEY (id);


--
-- Name: qa_options qa_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_options
    ADD CONSTRAINT qa_options_pkey PRIMARY KEY (id);


--
-- Name: qa_questions qa_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: role_master role_master_display_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT role_master_display_name_key UNIQUE (display_name);


--
-- Name: role_master role_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT role_master_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: stage_definitions stage_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_definitions
    ADD CONSTRAINT stage_definitions_pkey PRIMARY KEY (id);


--
-- Name: users unique_sso_identity; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_sso_identity UNIQUE (sso_provider, sso_subject);


--
-- Name: ai_agents uq_ai_agents_company_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agents
    ADD CONSTRAINT uq_ai_agents_company_name UNIQUE (company_id, name);


--
-- Name: candidate_metadata uq_candidate_metadata_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_metadata
    ADD CONSTRAINT uq_candidate_metadata_key UNIQUE (candidate_id, meta_key);


--
-- Name: candidate_workflows uq_candidate_workflows_candidate_workflow; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_workflows
    ADD CONSTRAINT uq_candidate_workflows_candidate_workflow UNIQUE (candidate_id, workflow_id);


--
-- Name: role_master uq_role_master_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT uq_role_master_code UNIQUE (code);


--
-- Name: stage_definitions uq_stage_definitions_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stage_definitions
    ADD CONSTRAINT uq_stage_definitions_code UNIQUE (code);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: workflow_edges workflow_edges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_pkey PRIMARY KEY (id);


--
-- Name: workflow_nodes workflow_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_pkey PRIMARY KEY (id);


--
-- Name: workflows workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);


--
-- Name: idx_ai_agents_company_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_agents_company_enabled ON public.ai_agents USING btree (company_id, is_enabled);


--
-- Name: idx_ai_agents_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_agents_company_id ON public.ai_agents USING btree (company_id);


--
-- Name: idx_candidate_metadata_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_metadata_candidate_id ON public.candidate_metadata USING btree (candidate_id);


--
-- Name: idx_candidate_notes_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_notes_candidate_id ON public.candidate_notes USING btree (candidate_id);


--
-- Name: idx_candidate_resume_parses_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_resume_parses_candidate_id ON public.candidate_resume_parses USING btree (candidate_id, created_at DESC);


--
-- Name: idx_candidate_resume_parses_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_resume_parses_company_id ON public.candidate_resume_parses USING btree (company_id);


--
-- Name: idx_candidate_stage_attempts_candidate_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_stage_attempts_candidate_created ON public.candidate_stage_attempts USING btree (candidate_id, created_at DESC);


--
-- Name: idx_candidate_stage_attempts_candidate_workflow; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_stage_attempts_candidate_workflow ON public.candidate_stage_attempts USING btree (candidate_id, workflow_id);


--
-- Name: idx_candidate_stage_attempts_stage_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_stage_attempts_stage_type ON public.candidate_stage_attempts USING btree (workflow_id, stage_type);


--
-- Name: idx_candidate_timeline_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_timeline_candidate_id ON public.candidate_timeline USING btree (candidate_id);


--
-- Name: idx_candidate_workflows_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_workflows_candidate_id ON public.candidate_workflows USING btree (candidate_id);


--
-- Name: idx_candidate_workflows_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_workflows_company_id ON public.candidate_workflows USING btree (company_id);


--
-- Name: idx_candidate_workflows_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_workflows_workflow_id ON public.candidate_workflows USING btree (workflow_id);


--
-- Name: idx_candidates_applied_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_applied_at ON public.candidates USING btree (applied_at DESC);


--
-- Name: idx_candidates_batch_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_batch_name ON public.candidates USING btree (batch_name);


--
-- Name: idx_candidates_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_company_id ON public.candidates USING btree (company_id);


--
-- Name: idx_candidates_current_stage_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_current_stage_id ON public.candidates USING btree (current_stage_id);


--
-- Name: idx_candidates_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_email ON public.candidates USING btree (email);


--
-- Name: idx_candidates_phone_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_phone_number ON public.candidates USING btree (phone_number);


--
-- Name: idx_candidates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_status ON public.candidates USING btree (status);


--
-- Name: idx_candidates_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_workflow_id ON public.candidates USING btree (workflow_id);


--
-- Name: idx_interviews_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_candidate_id ON public.interviews USING btree (candidate_id);


--
-- Name: idx_interviews_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_company_id ON public.interviews USING btree (company_id);


--
-- Name: idx_interviews_qa_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_qa_bank_id ON public.interviews USING btree (qa_bank_id);


--
-- Name: idx_interviews_round_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_round_type ON public.interviews USING btree (round_type);


--
-- Name: idx_interviews_start_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_start_at ON public.interviews USING btree (start_at);


--
-- Name: idx_interviews_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_status ON public.interviews USING btree (status);


--
-- Name: idx_qa_banks_company_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_banks_company_active ON public.qa_banks USING btree (company_id) WHERE (is_delete = false);


--
-- Name: idx_qa_banks_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_banks_company_id ON public.qa_banks USING btree (company_id);


--
-- Name: idx_qa_options_question_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_options_question_active ON public.qa_options USING btree (question_id) WHERE (is_delete = false);


--
-- Name: idx_qa_options_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_options_question_id ON public.qa_options USING btree (question_id);


--
-- Name: idx_qa_questions_bank_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_questions_bank_active ON public.qa_questions USING btree (qa_bank_id) WHERE (is_delete = false);


--
-- Name: idx_qa_questions_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_questions_bank_id ON public.qa_questions USING btree (qa_bank_id);


--
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_schedule_invites_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_invites_candidate_id ON public.interview_schedule_invites USING btree (candidate_id);


--
-- Name: idx_schedule_invites_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_invites_company_id ON public.interview_schedule_invites USING btree (company_id);


--
-- Name: idx_schedule_invites_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_invites_status ON public.interview_schedule_invites USING btree (status);


--
-- Name: idx_schedule_invites_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_invites_token ON public.interview_schedule_invites USING btree (token);


--
-- Name: idx_stage_definitions_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stage_definitions_enabled ON public.stage_definitions USING btree (is_enabled);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_email_verification_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email_verification_code ON public.users USING btree (email_verification_code);


--
-- Name: idx_users_sso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_sso ON public.users USING btree (sso_provider, sso_subject);


--
-- Name: idx_workflow_edges_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_edges_company_id ON public.workflow_edges USING btree (company_id);


--
-- Name: idx_workflow_edges_is_delete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_edges_is_delete ON public.workflow_edges USING btree (workflow_id, is_delete);


--
-- Name: idx_workflow_edges_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_edges_source ON public.workflow_edges USING btree (source_node_id);


--
-- Name: idx_workflow_edges_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_edges_target ON public.workflow_edges USING btree (target_node_id);


--
-- Name: idx_workflow_edges_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_edges_workflow_id ON public.workflow_edges USING btree (workflow_id);


--
-- Name: idx_workflow_nodes_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_nodes_company_id ON public.workflow_nodes USING btree (company_id);


--
-- Name: idx_workflow_nodes_is_delete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_nodes_is_delete ON public.workflow_nodes USING btree (workflow_id, is_delete);


--
-- Name: idx_workflow_nodes_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_nodes_kind ON public.workflow_nodes USING btree (workflow_id, kind);


--
-- Name: idx_workflow_nodes_qa_bank_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_nodes_qa_bank_id ON public.workflow_nodes USING btree (qa_bank_id);


--
-- Name: idx_workflow_nodes_stage_definition_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_nodes_stage_definition_id ON public.workflow_nodes USING btree (stage_definition_id);


--
-- Name: idx_workflow_nodes_workflow_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflow_nodes_workflow_id ON public.workflow_nodes USING btree (workflow_id);


--
-- Name: idx_workflows_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflows_company_id ON public.workflows USING btree (company_id);


--
-- Name: idx_workflows_company_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_workflows_company_name ON public.workflows USING btree (company_id, name);


--
-- Name: uq_workflow_nodes_workflow_code_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_workflow_nodes_workflow_code_active ON public.workflow_nodes USING btree (workflow_id, code) WHERE ((is_delete = false) AND ((code)::text <> ''::text));


--
-- Name: ai_agents ai_agents_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_agents
    ADD CONSTRAINT ai_agents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: candidate_metadata candidate_metadata_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_metadata
    ADD CONSTRAINT candidate_metadata_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_metadata candidate_metadata_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_metadata
    ADD CONSTRAINT candidate_metadata_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: candidate_metadata candidate_metadata_parse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_metadata
    ADD CONSTRAINT candidate_metadata_parse_id_fkey FOREIGN KEY (parse_id) REFERENCES public.candidate_resume_parses(id) ON DELETE SET NULL;


--
-- Name: candidate_notes candidate_notes_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_notes
    ADD CONSTRAINT candidate_notes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_resume_parses candidate_resume_parses_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_resume_parses
    ADD CONSTRAINT candidate_resume_parses_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_resume_parses candidate_resume_parses_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_resume_parses
    ADD CONSTRAINT candidate_resume_parses_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: candidate_stage_attempts candidate_stage_attempts_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_stage_attempts
    ADD CONSTRAINT candidate_stage_attempts_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_stage_attempts candidate_stage_attempts_candidate_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_stage_attempts
    ADD CONSTRAINT candidate_stage_attempts_candidate_workflow_id_fkey FOREIGN KEY (candidate_workflow_id) REFERENCES public.candidate_workflows(id) ON DELETE SET NULL;


--
-- Name: candidate_stage_attempts candidate_stage_attempts_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_stage_attempts
    ADD CONSTRAINT candidate_stage_attempts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: candidate_stage_attempts candidate_stage_attempts_resume_parse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_stage_attempts
    ADD CONSTRAINT candidate_stage_attempts_resume_parse_id_fkey FOREIGN KEY (resume_parse_id) REFERENCES public.candidate_resume_parses(id) ON DELETE SET NULL;


--
-- Name: candidate_timeline candidate_timeline_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_timeline
    ADD CONSTRAINT candidate_timeline_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_workflows candidate_workflows_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_workflows
    ADD CONSTRAINT candidate_workflows_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_workflows candidate_workflows_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_workflows
    ADD CONSTRAINT candidate_workflows_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: candidates candidates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: candidates candidates_latest_ats_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_latest_ats_attempt_id_fkey FOREIGN KEY (latest_ats_attempt_id) REFERENCES public.candidate_stage_attempts(id) ON DELETE SET NULL;


--
-- Name: candidates candidates_latest_parse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_latest_parse_id_fkey FOREIGN KEY (latest_parse_id) REFERENCES public.candidate_resume_parses(id) ON DELETE SET NULL;


--
-- Name: users fk_users_role_master; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role_master FOREIGN KEY (role) REFERENCES public.role_master(code);


--
-- Name: interview_schedule_invites interview_schedule_invites_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_schedule_invites
    ADD CONSTRAINT interview_schedule_invites_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: interview_schedule_invites interview_schedule_invites_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_schedule_invites
    ADD CONSTRAINT interview_schedule_invites_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: interview_schedule_invites interview_schedule_invites_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_schedule_invites
    ADD CONSTRAINT interview_schedule_invites_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE SET NULL;


--
-- Name: interview_schedule_invites interview_schedule_invites_workflow_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_schedule_invites
    ADD CONSTRAINT interview_schedule_invites_workflow_node_id_fkey FOREIGN KEY (workflow_node_id) REFERENCES public.workflow_nodes(id) ON DELETE SET NULL;


--
-- Name: interviews interviews_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: interviews interviews_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: interviews interviews_qa_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_qa_bank_id_fkey FOREIGN KEY (qa_bank_id) REFERENCES public.qa_banks(id) ON DELETE SET NULL;


--
-- Name: qa_banks qa_banks_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_banks
    ADD CONSTRAINT qa_banks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: qa_options qa_options_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_options
    ADD CONSTRAINT qa_options_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: qa_options qa_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_options
    ADD CONSTRAINT qa_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.qa_questions(id) ON DELETE CASCADE;


--
-- Name: qa_questions qa_questions_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: qa_questions qa_questions_qa_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_questions
    ADD CONSTRAINT qa_questions_qa_bank_id_fkey FOREIGN KEY (qa_bank_id) REFERENCES public.qa_banks(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: workflow_edges workflow_edges_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: workflow_edges workflow_edges_source_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_source_node_id_fkey FOREIGN KEY (source_node_id) REFERENCES public.workflow_nodes(id) ON DELETE CASCADE;


--
-- Name: workflow_edges workflow_edges_target_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_target_node_id_fkey FOREIGN KEY (target_node_id) REFERENCES public.workflow_nodes(id) ON DELETE CASCADE;


--
-- Name: workflow_edges workflow_edges_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_edges
    ADD CONSTRAINT workflow_edges_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflow_nodes workflow_nodes_ai_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_ai_agent_id_fkey FOREIGN KEY (ai_agent_id) REFERENCES public.ai_agents(id) ON DELETE SET NULL;


--
-- Name: workflow_nodes workflow_nodes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: workflow_nodes workflow_nodes_qa_bank_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_qa_bank_id_fkey FOREIGN KEY (qa_bank_id) REFERENCES public.qa_banks(id) ON DELETE SET NULL;


--
-- Name: workflow_nodes workflow_nodes_stage_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_stage_definition_id_fkey FOREIGN KEY (stage_definition_id) REFERENCES public.stage_definitions(id) ON DELETE SET NULL;


--
-- Name: workflow_nodes workflow_nodes_workflow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_nodes
    ADD CONSTRAINT workflow_nodes_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE;


--
-- Name: workflows workflows_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflows
    ADD CONSTRAINT workflows_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20260426120000'),
    ('20260426123000'),
    ('20260426124500'),
    ('20260426130000'),
    ('20260426143000'),
    ('20260426151500'),
    ('20260426162000'),
    ('20260426170000'),
    ('20260426190000'),
    ('20260427120000'),
    ('20260427130000'),
    ('20260427140000'),
    ('20260427150000'),
    ('20260427160000'),
    ('20260427170000'),
    ('20260427180000'),
    ('20260427190000'),
    ('20260427200000'),
    ('20260428120000'),
    ('20260428140000'),
    ('20260428160000'),
    ('20260428180000'),
    ('20260428190000'),
    ('20260428200000');
