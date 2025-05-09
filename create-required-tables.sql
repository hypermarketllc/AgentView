-- Create carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES carriers(id),
  name text NOT NULL
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  level integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  password_hash text,
  position_id uuid REFERENCES positions(id),
  upline_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_accs table
CREATE TABLE IF NOT EXISTS user_accs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  theme_preference text DEFAULT 'light',
  notification_preferences jsonb DEFAULT '{
    "email": true,
    "push": true,
    "deals": true,
    "system": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  carrier_id uuid NOT NULL REFERENCES carriers(id),
  product_id uuid NOT NULL REFERENCES products(id),
  client_name text NOT NULL,
  annual_premium numeric(10,2) NOT NULL,
  app_number text,
  client_phone text,
  effective_date date,
  from_referral boolean DEFAULT false,
  status text DEFAULT 'Submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert sample carriers
INSERT INTO carriers (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Prudential'),
  ('22222222-2222-2222-2222-222222222222', 'MetLife'),
  ('33333333-3333-3333-3333-333333333333', 'AIG')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (carrier_id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Term Life 20'),
  ('11111111-1111-1111-1111-111111111111', 'Whole Life'),
  ('22222222-2222-2222-2222-222222222222', 'Universal Life'),
  ('33333333-3333-3333-3333-333333333333', 'Variable Life')
ON CONFLICT DO NOTHING;

-- Insert positions
INSERT INTO positions (name, level, description) VALUES
  ('Agent', 1, 'Entry level sales agent'),
  ('Senior Agent', 2, 'Experienced sales agent'),
  ('District Manager', 3, 'Manages a team of agents'),
  ('Regional Manager', 4, 'Oversees multiple districts'),
  ('Owner', 5, 'Company owner')
ON CONFLICT (name) DO NOTHING;

-- Insert a default admin user if no users exist
INSERT INTO users (id, email, full_name, position_id, password_hash)
SELECT 
  'a9692c3e-a415-4fc3-a3e0-30c8eb652f09', 
  'admin@americancoveragecenter.com', 
  'American Coverage Center', 
  p.id,
  '$2a$10$XdJrX7qxNQUUC9b5/30nVO.nTYn9xiLhg8ZU27rCgz9I8pHQNVJfy' -- password: admin123
FROM positions p
WHERE p.name = 'Owner'
AND NOT EXISTS (SELECT 1 FROM users)
ON CONFLICT DO NOTHING;

-- Create a trigger to update the updated_at timestamp for user_accs
CREATE OR REPLACE FUNCTION update_user_accs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_accs_updated_at
  BEFORE UPDATE ON user_accs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accs_updated_at();

-- Create a trigger to update the updated_at timestamp for users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Create a trigger to update the updated_at timestamp for deals
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deals_updated_at();

-- Insert default user account settings for existing users
INSERT INTO user_accs (user_id, display_name)
SELECT id, full_name FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_accs WHERE user_accs.user_id = users.id
);
