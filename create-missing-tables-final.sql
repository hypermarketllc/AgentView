-- Create missing tables

-- Create system_health_checks table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_health_checks (
  id SERIAL PRIMARY KEY,
  component VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_accs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  account_status VARCHAR(50) NOT NULL,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data into system_health_checks if empty
INSERT INTO system_health_checks (component, status, message)
SELECT 'Database', 'OK', 'Database connection successful'
WHERE NOT EXISTS (SELECT 1 FROM system_health_checks LIMIT 1);

-- Insert sample data into user_accs if empty
INSERT INTO user_accs (user_id, account_type, account_status, settings)
SELECT 
  (SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1),
  'admin',
  'active',
  '{"theme": "light", "notifications": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM user_accs LIMIT 1);

-- Insert sample data into settings if empty
INSERT INTO settings (key, value, description)
VALUES 
  ('site_name', 'Agent View CRM', 'The name of the site'),
  ('theme_color', '#007bff', 'Primary theme color'),
  ('enable_notifications', 'true', 'Whether to enable notifications'),
  ('maintenance_mode', 'false', 'Whether the site is in maintenance mode')
ON CONFLICT (key) DO NOTHING;
