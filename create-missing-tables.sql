-- Create system_health_checks table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create user_accs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name VARCHAR(100),
  theme_preference JSONB,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(category, key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_health_checks_category ON system_health_checks(category);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_user_accs_user_id ON user_accs(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
