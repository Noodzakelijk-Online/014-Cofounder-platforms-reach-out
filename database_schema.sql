-- This file defines the database schema for the Co-Founders Automated Reach Out Platform.
-- It includes table definitions and indexes for performance.

-- Users Table
-- (Assuming this table already exists from the initial setup)
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   first_name VARCHAR(255),
--   last_name VARCHAR(255),
--   hourly_rate NUMERIC(10, 2) DEFAULT 0,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- Projects Table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  message_interval INTEGER NOT NULL DEFAULT 1,
  interval_unit VARCHAR(50) NOT NULL DEFAULT 'day', -- e.g., 'day', 'week', 'month'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages Table
-- (Assuming this table already exists, we are adding project_id)
-- ALTER TABLE messages ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  platform_id INTEGER, -- Assuming a platforms table exists
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'responded', 'unresponsive'
  response_received BOOLEAN DEFAULT FALSE,
  follow_up_count INTEGER DEFAULT 0,
  follow_up_scheduled BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  unresponsive_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach Logs Table
CREATE TABLE outreach_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  outreach_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- INDEXES FOR PERFORMANCE --

-- Index for fetching projects by user
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Index for fetching draft messages for a project (for the scheduler)
CREATE INDEX idx_messages_project_status ON messages(project_id, status) WHERE status = 'draft';

-- Index for counting messages sent in an interval (for the scheduler)
CREATE INDEX idx_messages_project_status_updated ON messages(project_id, status, updated_at) WHERE status = 'sent';

-- Index for checking recent outreach (for spam prevention)
CREATE INDEX idx_outreach_logs_user_recipient_date ON outreach_logs(user_id, recipient, outreach_date);
