-- create-missing-tables.sql
--
-- This script creates the necessary tables for system health monitoring,
-- error tracking, user settings, and system settings.

-- Create system_health_checks table for storing health check results
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY,
  endpoint TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL')),
  response_time INTEGER,
  status_code INTEGER,
  error_message TEXT,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on system_health_checks for faster queries
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_endpoint ON system_health_checks(endpoint);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_category ON system_health_checks(category);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status);

-- Create system_errors table for storing error information
CREATE TABLE IF NOT EXISTS system_errors (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  status INTEGER,
  endpoint TEXT,
  request_id TEXT,
  details JSONB,
  stack_trace TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on system_errors for faster queries
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_system_errors_code ON system_errors(code);
CREATE INDEX IF NOT EXISTS idx_system_errors_endpoint ON system_errors(endpoint);
CREATE INDEX IF NOT EXISTS idx_system_errors_user_id ON system_errors(user_id);

-- Create user_accs table for storing user settings and preferences
CREATE TABLE IF NOT EXISTS user_accs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'light',
  notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
  dashboard_layout JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on user_accs for faster queries
CREATE INDEX IF NOT EXISTS idx_user_accs_user_id ON user_accs(user_id);

-- Create settings table for storing system settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(category, key)
);

-- Create index on settings for faster queries
CREATE INDEX IF NOT EXISTS idx_settings_category_key ON settings(category, key);

-- Insert default settings
INSERT INTO settings (id, category, key, value, description)
VALUES 
  (gen_random_uuid(), 'system', 'retention_period', 
   '{"health_checks": 7, "errors": 30}'::jsonb, 
   'Retention period in days for health checks and error logs')
ON CONFLICT (category, key) DO NOTHING;

INSERT INTO settings (id, category, key, value, description)
VALUES 
  (gen_random_uuid(), 'system', 'notification', 
   '{"admin_email": true, "slack": false}'::jsonb, 
   'Notification settings for system alerts')
ON CONFLICT (category, key) DO NOTHING;

INSERT INTO settings (id, category, key, value, description)
VALUES 
  (gen_random_uuid(), 'system', 'health_check', 
   '{"interval": 5, "timeout": 10000}'::jsonb, 
   'Health check settings (interval in minutes, timeout in ms)')
ON CONFLICT (category, key) DO NOTHING;

INSERT INTO settings (id, category, key, value, description)
VALUES 
  (gen_random_uuid(), 'ui', 'theme', 
   '{"default": "light", "options": ["light", "dark", "system"]}'::jsonb, 
   'UI theme settings')
ON CONFLICT (category, key) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_accs_updated_at ON user_accs;
CREATE TRIGGER update_user_accs_updated_at
BEFORE UPDATE ON user_accs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to the application user
GRANT SELECT, INSERT, UPDATE, DELETE ON system_health_checks TO crm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_errors TO crm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_accs TO crm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO crm_user;
