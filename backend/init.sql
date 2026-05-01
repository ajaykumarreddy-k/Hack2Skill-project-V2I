-- V2I Database Schema Initial Migration

-- Parties Table
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(10) UNIQUE,
    founded_year INT,
    type VARCHAR(50), -- national, regional
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policies Table
CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    stance TEXT,
    stance_score FLOAT DEFAULT 0.5,
    source_url TEXT,
    confidence_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(party_id, category)
);

-- Translations Table
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- policy, party
    entity_id UUID NOT NULL,
    lang_code VARCHAR(5) NOT NULL,
    field VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_type, entity_id, lang_code, field)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhaar_hash VARCHAR(64) UNIQUE,
    epic_hash VARCHAR(64),
    phone_hash VARCHAR(64),
    email VARCHAR(255) UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voter Roll (for KYC simulation)
CREATE TABLE IF NOT EXISTS voter_roll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhaar_hash VARCHAR(64) UNIQUE,
    epic_hash VARCHAR(64) UNIQUE,
    full_name VARCHAR(255),
    constituency VARCHAR(255)
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    alignment_scores JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vote Events (Log for BigQuery streaming)
CREATE TABLE IF NOT EXISTS vote_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voter_id UUID REFERENCES users(id),
    constituency VARCHAR(255),
    candidate_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes (Efficiency Optimization)
CREATE INDEX IF NOT EXISTS idx_policies_party ON policies(party_id);
CREATE INDEX IF NOT EXISTS idx_policies_category ON policies(category);
CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations(entity_id, lang_code);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at);
