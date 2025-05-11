-- Seed roles into roles table
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('editor'),
  ('viewer')
ON CONFLICT DO NOTHING;