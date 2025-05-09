-- Fix positions table: ensure Owner has the highest level (5)
UPDATE positions 
SET level = 5 
WHERE name = 'Owner';

-- If Owner position doesn't exist with level 5, create it
INSERT INTO positions (id, name, level, description)
SELECT gen_random_uuid(), 'Owner', 5, 'Owner with full access to all features'
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE name = 'Owner' AND level = 5);

-- Update admin@americancoveragecenter.com to have Owner position (level 5)
UPDATE users 
SET position_id = (SELECT id FROM positions WHERE name = 'Owner' AND level = 5)
WHERE email = 'admin@americancoveragecenter.com';

-- Remove duplicate entries for admin@example.com, keeping only the Agent position
DELETE FROM users 
WHERE email = 'admin@example.com' 
AND position_id IN (
    SELECT p.id 
    FROM positions p 
    WHERE p.name = 'Owner'
);

-- Ensure admin@example.com has Agent position
UPDATE users 
SET position_id = (SELECT id FROM positions WHERE name = 'Agent' AND level = 1)
WHERE email = 'admin@example.com';

-- Create auth_users entries for both users
INSERT INTO auth_users (id, email, password_hash)
SELECT u.id, u.email, '$2b$10$rRMHx1NwLPHBXPlrTwFSJOQNlVlvWw3adlVzZLzOLx5XL2.7.0jlC' -- Password: Admin123!
FROM users u
WHERE u.email IN ('admin@example.com', 'admin@americancoveragecenter.com')
ON CONFLICT (id) DO UPDATE
SET password_hash = '$2b$10$rRMHx1NwLPHBXPlrTwFSJOQNlVlvWw3adlVzZLzOLx5XL2.7.0jlC';

-- Verify the changes
SELECT p.id, p.name, p.level, p.description
FROM positions p
WHERE p.name IN ('Owner', 'Agent', 'Admin')
ORDER BY p.level DESC;

SELECT u.id, u.email, u.full_name, p.name as position_name, p.level as position_level
FROM users u
JOIN positions p ON u.position_id = p.id
WHERE u.email IN ('admin@example.com', 'admin@americancoveragecenter.com')
ORDER BY p.level DESC;

SELECT a.id, a.email, u.id as user_id, u.email as user_email
FROM auth_users a
LEFT JOIN users u ON a.id = u.id
WHERE a.email IN ('admin@example.com', 'admin@americancoveragecenter.com');
