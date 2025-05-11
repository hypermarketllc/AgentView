-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'agent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert default admin and agent users if they don't exist
INSERT INTO users (email, password, full_name, role)
SELECT 'admin@americancoveragecenter.com', '$2b$10$eCJlsHbEQSAeGZrGijktdOsZMNq9VUQXSKzqzwrWFYNnl0oNvUJkW', 'Admin User', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@americancoveragecenter.com');

INSERT INTO users (email, password, full_name, role)
SELECT 'agent@example.com', '$2b$10$eCJlsHbEQSAeGZrGijktdOsZMNq9VUQXSKzqzwrWFYNnl0oNvUJkW', 'Agent User', 'agent'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'agent@example.com');

-- Note: The password hash above is for 'Agent123!' using bcrypt with 10 rounds
