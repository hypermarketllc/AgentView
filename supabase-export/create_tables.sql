-- SQL script for creating tables

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
