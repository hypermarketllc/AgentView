-- create-missing-tables-fixed.sql
-- This SQL script creates all the missing tables needed for the application
-- FIXED: Updated to match the actual database schema

-- Create system_health_checks table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_time INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(key, category)
);

-- Create user_accs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    display_name TEXT,
    theme_preference TEXT,
    notification_preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_health_checks_endpoint ON system_health_checks(endpoint);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_category ON system_health_checks(category);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

CREATE INDEX IF NOT EXISTS idx_user_accs_user_id ON user_accs(user_id);

-- Insert default system settings if they don't exist
INSERT INTO settings (key, value, category)
VALUES 
    ('name', 'MyAgentView', 'system'),
    ('logo_url', '/images/logo.png', 'system')
ON CONFLICT (key, category) DO NOTHING;

-- Insert default notification settings if they don't exist
INSERT INTO settings (key, value, category)
VALUES 
    ('email_notifications', 'true', 'notifications'),
    ('push_notifications', 'true', 'notifications'),
    ('deal_notifications', 'true', 'notifications'),
    ('system_notifications', 'true', 'notifications')
ON CONFLICT (key, category) DO NOTHING;
