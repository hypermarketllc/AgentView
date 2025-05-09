-- Ensure all necessary positions exist
DO $$
BEGIN
    -- Ensure Owner position exists (highest level - 5)
    IF NOT EXISTS (SELECT 1 FROM positions WHERE name = 'Owner' OR level = 5) THEN
        INSERT INTO positions (id, name, level, description)
        VALUES (gen_random_uuid(), 'Owner', 5, 'Owner with full access to all features');
    END IF;
    
    -- Ensure Admin position exists (level 4)
    IF NOT EXISTS (SELECT 1 FROM positions WHERE name = 'Admin' OR level = 4) THEN
        INSERT INTO positions (id, name, level, description)
        VALUES (gen_random_uuid(), 'Admin', 4, 'Administrator with access to most features');
    END IF;
    
    -- Ensure Manager position exists (level 3)
    IF NOT EXISTS (SELECT 1 FROM positions WHERE name = 'Manager' OR level = 3) THEN
        INSERT INTO positions (id, name, level, description)
        VALUES (gen_random_uuid(), 'Manager', 3, 'Manager with access to team features');
    END IF;
    
    -- Ensure Agent position exists (level 1)
    IF NOT EXISTS (SELECT 1 FROM positions WHERE name = 'Agent' OR level = 1) THEN
        INSERT INTO positions (id, name, level, description)
        VALUES (gen_random_uuid(), 'Agent', 1, 'Agent with basic access');
    END IF;
END $$;

-- Update admin@example.com to have Agent position (level 1)
UPDATE users 
SET position_id = (SELECT id FROM positions WHERE name = 'Agent' OR level = 1 LIMIT 1)
WHERE email = 'admin@example.com';

-- If admin@example.com doesn't exist, create it with Agent position
INSERT INTO users (id, email, full_name, position_id, is_active)
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'admin@example.com', 
    'Admin User', 
    (SELECT id FROM positions WHERE name = 'Agent' OR level = 1 LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@example.com'
);

-- Update admin@americancoveragecenter.com to have Owner position (level 5)
UPDATE users 
SET position_id = (SELECT id FROM positions WHERE name = 'Owner' OR level = 5 LIMIT 1)
WHERE email = 'admin@americancoveragecenter.com';

-- If admin@americancoveragecenter.com doesn't exist, create it with Owner position
INSERT INTO users (id, email, full_name, position_id, is_active)
SELECT 
    gen_random_uuid(), 
    'admin@americancoveragecenter.com', 
    'Owner Admin', 
    (SELECT id FROM positions WHERE name = 'Owner' OR level = 5 LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@americancoveragecenter.com'
);

-- Make sure both users have auth entries
INSERT INTO auth_users (id, email, password_hash)
SELECT u.id, u.email, '$2b$10$rRMHx1NwLPHBXPlrTwFSJOQNlVlvWw3adlVzZLzOLx5XL2.7.0jlC' -- Password: Admin123!
FROM users u
WHERE u.email IN ('admin@example.com', 'admin@americancoveragecenter.com')
ON CONFLICT (id) DO UPDATE
SET password_hash = '$2b$10$rRMHx1NwLPHBXPlrTwFSJOQNlVlvWw3adlVzZLzOLx5XL2.7.0jlC';

-- Verify the changes
SELECT u.id, u.email, u.full_name, p.name as position_name, p.level as position_level
FROM users u
JOIN positions p ON u.position_id = p.id
WHERE u.email IN ('admin@example.com', 'admin@americancoveragecenter.com')
ORDER BY p.level DESC;

SELECT * FROM auth_users WHERE email IN ('admin@example.com', 'admin@americancoveragecenter.com');
