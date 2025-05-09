-- Complete PostgreSQL Migration Script

-- 1. Update admin@americancoveragecenter.com to have Admin position
UPDATE users 
SET position_id = (SELECT id FROM positions WHERE name = 'Admin')
WHERE email = 'admin@americancoveragecenter.com';

-- 2. Create auth_users entries for existing users
-- First, check if entries already exist to avoid duplicates
INSERT INTO auth_users (id, email, password_hash)
SELECT id, email, '$2b$10$rRMHx1NwLPHBXPlrTwFSJOQNlVlvWw3adlVzZLzOLx5XL2.7.0jlC' -- Password: Admin123!
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM auth_users a WHERE a.id = u.id
);

-- 3. Add mock carriers
INSERT INTO carriers (id, name, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Allstate', NOW(), NOW()),
  (gen_random_uuid(), 'State Farm', NOW(), NOW()),
  (gen_random_uuid(), 'Progressive', NOW(), NOW()),
  (gen_random_uuid(), 'GEICO', NOW(), NOW()),
  (gen_random_uuid(), 'Liberty Mutual', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 4. Add mock products
INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Auto Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'Allstate'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Home Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'Allstate'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Life Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'State Farm'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Auto Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'State Farm'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Motorcycle Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'Progressive'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Boat Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'Progressive'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Auto Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'GEICO'
ON CONFLICT DO NOTHING;

INSERT INTO products (id, name, carrier_id, created_at, updated_at)
SELECT gen_random_uuid(), 'Renters Insurance', id, NOW(), NOW() FROM carriers WHERE name = 'Liberty Mutual'
ON CONFLICT DO NOTHING;

-- 5. Add mock deals
INSERT INTO deals (
  id, 
  client_name, 
  client_email, 
  client_phone, 
  policy_number, 
  premium_amount, 
  commission_amount, 
  status, 
  notes, 
  agent_id, 
  carrier_id, 
  product_id, 
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),
  'John Smith',
  'john.smith@example.com',
  '555-123-4567',
  'POL-' || floor(random() * 1000000)::text,
  floor(random() * 2000 + 500)::numeric,
  floor(random() * 500 + 100)::numeric,
  'Active',
  'New auto policy',
  (SELECT id FROM users WHERE email = 'admin@americancoveragecenter.com'),
  c.id,
  p.id,
  NOW() - (random() * interval '30 days'),
  NOW() - (random() * interval '15 days')
FROM 
  carriers c
JOIN 
  products p ON p.carrier_id = c.id
WHERE 
  c.name = 'Allstate' AND p.name = 'Auto Insurance'
LIMIT 1;

INSERT INTO deals (
  id, 
  client_name, 
  client_email, 
  client_phone, 
  policy_number, 
  premium_amount, 
  commission_amount, 
  status, 
  notes, 
  agent_id, 
  carrier_id, 
  product_id, 
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Jane Doe',
  'jane.doe@example.com',
  '555-987-6543',
  'POL-' || floor(random() * 1000000)::text,
  floor(random() * 1500 + 800)::numeric,
  floor(random() * 400 + 200)::numeric,
  'Active',
  'Home insurance policy',
  (SELECT id FROM users WHERE email = 'admin@example.com'),
  c.id,
  p.id,
  NOW() - (random() * interval '60 days'),
  NOW() - (random() * interval '30 days')
FROM 
  carriers c
JOIN 
  products p ON p.carrier_id = c.id
WHERE 
  c.name = 'State Farm' AND p.name = 'Home Insurance'
LIMIT 1;

INSERT INTO deals (
  id, 
  client_name, 
  client_email, 
  client_phone, 
  policy_number, 
  premium_amount, 
  commission_amount, 
  status, 
  notes, 
  agent_id, 
  carrier_id, 
  product_id, 
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),
  'Robert Johnson',
  'robert.johnson@example.com',
  '555-456-7890',
  'POL-' || floor(random() * 1000000)::text,
  floor(random() * 3000 + 1000)::numeric,
  floor(random() * 600 + 300)::numeric,
  'Pending',
  'Life insurance application',
  (SELECT id FROM users WHERE email = 'admin@americancoveragecenter.com'),
  c.id,
  p.id,
  NOW() - (random() * interval '15 days'),
  NOW() - (random() * interval '5 days')
FROM 
  carriers c
JOIN 
  products p ON p.carrier_id = c.id
WHERE 
  c.name = 'Progressive' AND p.name = 'Motorcycle Insurance'
LIMIT 1;

-- 6. Add commission splits
INSERT INTO commission_splits (
  id,
  user_id,
  position_id,
  percentage,
  created_at,
  updated_at
)
VALUES
  (gen_random_uuid(), 
   (SELECT id FROM users WHERE email = 'admin@americancoveragecenter.com'),
   (SELECT id FROM positions WHERE name = 'Admin'),
   80,
   NOW(),
   NOW()),
  (gen_random_uuid(), 
   (SELECT id FROM users WHERE email = 'admin@example.com'),
   (SELECT id FROM positions WHERE name = 'Agent'),
   60,
   NOW(),
   NOW());

-- 7. Add commissions
INSERT INTO commissions (
  id,
  user_id,
  deal_id,
  amount,
  percentage,
  status,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  d.agent_id,
  d.id,
  d.commission_amount,
  (SELECT percentage FROM commission_splits WHERE user_id = d.agent_id LIMIT 1),
  'Paid',
  d.created_at,
  d.updated_at
FROM
  deals d;
