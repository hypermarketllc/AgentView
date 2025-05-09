-- Combined SQL script for initializing the database

-- Create tables first
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  position_id UUID NOT NULL,
  upline_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  national_producer_number VARCHAR(255),
  annual_goal NUMERIC,
  phone VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  advance_rate NUMERIC,
  payment_type VARCHAR(50),
  advance_period_months INTEGER
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  carrier_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (carrier_id) REFERENCES carriers(id)
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  carrier_id UUID NOT NULL,
  product_id UUID NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  annual_premium NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  app_number VARCHAR(255),
  client_phone VARCHAR(255),
  effective_date DATE,
  from_referral BOOLEAN DEFAULT FALSE,
  status VARCHAR(50),
  policy_number VARCHAR(255),
  submitted_at TIMESTAMPTZ,
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (carrier_id) REFERENCES carriers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY,
  deal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  position_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  commission_type VARCHAR(50),
  payment_date DATE,
  is_chargeback BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (deal_id) REFERENCES deals(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (position_id) REFERENCES positions(id)
);

-- Create discord_notifications table
CREATE TABLE IF NOT EXISTS discord_notifications (
  id UUID PRIMARY KEY,
  deal_id UUID,
  message JSONB NOT NULL,
  webhook_url TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  FOREIGN KEY (deal_id) REFERENCES deals(id)
);

-- Create telegram_chats table
CREATE TABLE IF NOT EXISTS telegram_chats (
  id UUID PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL,
  chat_title VARCHAR(255),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_position FOREIGN KEY (position_id) REFERENCES positions(id);
ALTER TABLE users ADD CONSTRAINT fk_upline FOREIGN KEY (upline_id) REFERENCES users(id);

-- Create auth_users table for authentication
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position_id);
CREATE INDEX IF NOT EXISTS idx_deals_agent ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_id);

-- Insert data for positions
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('cc8e8626-9bc9-430f-8d5a-1c249a137ac5', 'Admin', 4, 'Administrator with full management access', '2025-04-16T14:40:48.468137+00:00', '2025-04-16T14:40:48.468137+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb', 'Manager', 3, 'Team manager with limited management access', '2025-04-16T14:40:48.468137+00:00', '2025-04-16T14:40:48.468137+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('1f1d71c2-beec-43cd-99b2-2048c0afbde4', 'Senior Agent', 2, 'Experienced sales agent', '2025-04-15T15:55:36.205892+00:00', '2025-04-15T15:55:36.205892+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('599470e2-3803-41a2-a792-82911e60c2f4', 'Agent', 1, 'Agent who closes the deal', '2025-04-16T14:40:48.468137+00:00', '2025-04-16T14:40:48.468137+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('8395f610-6c95-4cd5-b778-ee6825ac78d1', 'Owner', 2, 'Agency owner', '2025-04-16T14:31:56.932235+00:00', '2025-04-16T14:31:56.932235+00:00');

-- Insert data for users
INSERT INTO users ("id", "email", "full_name", "position_id", "created_at", "updated_at", "national_producer_number", "annual_goal", "phone", "is_active") VALUES ('a9692c3e-a415-4fc3-a3e0-30c8eb652f09', 'admin@americancoveragecenter.com', 'American Coverage Center', '8395f610-6c95-4cd5-b778-ee6825ac78d1', '2025-04-16T14:31:56.932235+00:00', '2025-05-03T20:57:12.153103+00:00', '', 1000000, '', true);
INSERT INTO users ("id", "email", "full_name", "position_id", "created_at", "updated_at", "national_producer_number", "annual_goal", "phone", "is_active") VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', '599470e2-3803-41a2-a792-82911e60c2f4', '2025-04-16T14:10:49.955548+00:00', '2025-05-03T21:01:19.617558+00:00', '487651', 5000, '4574124512', true);

-- Insert auth_users for the existing users with bcrypt hashed passwords
-- Password for admin@americancoveragecenter.com: Admin123!
-- Password for admin@example.com: Admin123!
INSERT INTO auth_users ("id", "email", "password_hash") VALUES ('a9692c3e-a415-4fc3-a3e0-30c8eb652f09', 'admin@americancoveragecenter.com', '$2b$10$3Eo9VwrVUwHxHV.B0FqzAu8QP/6BKBHQXPs2yg1dXbfGYGtAgjiJC');
INSERT INTO auth_users ("id", "email", "password_hash") VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', '$2b$10$3Eo9VwrVUwHxHV.B0FqzAu8QP/6BKBHQXPs2yg1dXbfGYGtAgjiJC');
