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

-- Insert default user account settings for existing users
INSERT INTO user_accs (user_id, display_name)
SELECT id, full_name FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_accs WHERE user_accs.user_id = users.id
);
