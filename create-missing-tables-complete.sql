-- create-missing-tables-complete.sql
-- This SQL script creates all the missing tables needed for the application

-- Create system_health_checks table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_health_checks (
    id UUID PRIMARY KEY,
    component VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    endpoint VARCHAR(255),
    category VARCHAR(100) DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    last_checked TIMESTAMP WITH TIME ZONE
);

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(key, category)
);

-- Create user_accs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    display_name VARCHAR(255),
    theme_preference VARCHAR(50) DEFAULT 'light',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "deals": true, "system": true}'::jsonb,
    account_type VARCHAR(50) DEFAULT 'standard',
    account_status VARCHAR(50) DEFAULT 'active',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_health_checks_component ON system_health_checks(component);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_category ON system_health_checks(category);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

CREATE INDEX IF NOT EXISTS idx_user_accs_user_id ON user_accs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accs_account_type ON user_accs(account_type);
CREATE INDEX IF NOT EXISTS idx_user_accs_account_status ON user_accs(account_status);

-- Insert default system settings if they don't exist
INSERT INTO settings (key, value, description, category)
VALUES 
    ('name', 'MyAgentView', 'Application name', 'system'),
    ('logo_url', '/images/logo.png', 'Application logo URL', 'system'),
    ('theme', 'light', 'Default application theme', 'system'),
    ('support_email', 'support@myagentview.com', 'Support email address', 'system')
ON CONFLICT (key, category) DO NOTHING;

-- Insert default notification settings if they don't exist
INSERT INTO settings (key, value, description, category)
VALUES 
    ('email_notifications', 'true', 'Enable email notifications', 'notifications'),
    ('push_notifications', 'true', 'Enable push notifications', 'notifications'),
    ('deal_notifications', 'true', 'Enable deal notifications', 'notifications'),
    ('system_notifications', 'true', 'Enable system notifications', 'notifications')
ON CONFLICT (key, category) DO NOTHING;
