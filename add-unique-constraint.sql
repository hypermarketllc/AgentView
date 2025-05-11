-- Add unique constraint to system_health_checks table
ALTER TABLE system_health_checks
ADD CONSTRAINT system_health_checks_component_key UNIQUE (component);
