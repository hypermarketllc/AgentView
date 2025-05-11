-- Table for capturing system error logs
CREATE TABLE IF NOT EXISTS system_errors (
    id SERIAL PRIMARY KEY,
    code TEXT,
    message TEXT,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);