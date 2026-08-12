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
    CONSTRAINT chk_interviews_duration CHECK ((duration_minutes >= 15)),
    CONSTRAINT chk_interviews_round_type CHECK (((round_type)::text = ANY ((ARRAY['ai-interview'::character varying, 'coding'::character varying])::text[]))),
    CONSTRAINT chk_interviews_status CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'in-progress'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
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
-- Name: candidate_notes candidate_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_notes
    ADD CONSTRAINT candidate_notes_pkey PRIMARY KEY (id);


--
-- Name: candidate_timeline candidate_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_timeline
    ADD CONSTRAINT candidate_timeline_pkey PRIMARY KEY (id);


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
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


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
-- Name: users unique_sso_identity; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_sso_identity UNIQUE (sso_provider, sso_subject);


--
-- Name: role_master uq_role_master_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_master
    ADD CONSTRAINT uq_role_master_code UNIQUE (code);


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
-- Name: idx_candidate_notes_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_notes_candidate_id ON public.candidate_notes USING btree (candidate_id);


--
-- Name: idx_candidate_timeline_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidate_timeline_candidate_id ON public.candidate_timeline USING btree (candidate_id);


--
-- Name: idx_candidates_applied_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_applied_at ON public.candidates USING btree (applied_at DESC);


--
-- Name: idx_candidates_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_company_id ON public.candidates USING btree (company_id);


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
-- Name: idx_interviews_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_candidate_id ON public.interviews USING btree (candidate_id);


--
-- Name: idx_interviews_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_company_id ON public.interviews USING btree (company_id);


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
-- Name: idx_refresh_tokens_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens USING btree (token_hash);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


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
-- Name: candidate_notes candidate_notes_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_notes
    ADD CONSTRAINT candidate_notes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidate_timeline candidate_timeline_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidate_timeline
    ADD CONSTRAINT candidate_timeline_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: candidates candidates_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: users fk_users_role_master; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role_master FOREIGN KEY (role) REFERENCES public.role_master(code);


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
    ('20260426190000');
