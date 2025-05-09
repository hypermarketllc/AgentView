-- Add sample data to carriers table if empty
INSERT INTO carriers (id, name)
SELECT gen_random_uuid(), name
FROM (
  VALUES 
    ('Prudential'),
    ('MetLife'),
    ('AIG'),
    ('State Farm'),
    ('Allstate')
) AS data(name)
WHERE NOT EXISTS (SELECT 1 FROM carriers LIMIT 1);

-- Add sample data to products table if empty
INSERT INTO products (id, carrier_id, name)
SELECT 
  gen_random_uuid(), 
  c.id, 
  p.name
FROM 
  carriers c,
  (VALUES 
    ('Term Life 20'),
    ('Whole Life'),
    ('Universal Life'),
    ('Variable Life'),
    ('Group Life')
  ) AS p(name)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1)
LIMIT 5;

-- Add sample data to deals table if empty
INSERT INTO deals (
  id, 
  agent_id, 
  carrier_id, 
  product_id, 
  client_name, 
  annual_premium, 
  app_number, 
  client_phone, 
  effective_date, 
  from_referral, 
  status, 
  created_at
)
SELECT 
  gen_random_uuid(),
  u.id,
  c.id,
  p.id,
  'Sample Client ' || generate_series(1, 5),
  (random() * 5000 + 1000)::numeric(10,2),
  'APP-' || generate_series(1000, 1004),
  '555-' || generate_series(1000, 1004),
  current_date - (random() * 30)::integer,
  random() > 0.5,
  (ARRAY['Submitted', 'Approved', 'Pending', 'Completed'])[(random() * 3 + 1)::integer],
  now() - (random() * 30 || ' days')::interval
FROM 
  users u,
  carriers c,
  products p
WHERE 
  NOT EXISTS (SELECT 1 FROM deals LIMIT 1)
LIMIT 5;

-- Update positions table to ensure all users have a position
UPDATE users
SET position_id = (SELECT id FROM positions WHERE name = 'Agent' LIMIT 1)
WHERE position_id IS NULL;
