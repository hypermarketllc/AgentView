-- Create system_errors table for error logging
CREATE TABLE IF NOT EXISTS system_errors (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    resolution_notes TEXT
);

-- Create index on error_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_system_errors_error_type ON system_errors(error_type);

-- Create index on created_at for faster date range queries
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at);

-- Create index on resolved for faster filtering of resolved/unresolved errors
CREATE INDEX IF NOT EXISTS idx_system_errors_resolved ON system_errors(resolved);
