-- SQL script for inserting data

-- Data for table: positions
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('cc8e8626-9bc9-430f-8d5a-1c249a137ac5', 'Admin', 4, 'Administrator with full management access', '2025-04-16T14:40:48.468137+00:00', '2025-04-16T14:40:48.468137+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb', 'Manager', 3, 'Team manager with limited management access', '2025-04-16T14:40:48.468137+00:00', '2025-04-16T14:40:48.468137+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('1f1d71c2-beec-43cd-99b2-2048c0afbde4', 'Senior Agent', 2, 'Experienced sales agent', '2025-04-15T15:55:36.205892+00:00', '2025-04-15T15:55:36.205892+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('599470e2-3803-41a2-a792-82911e60c2f4', 'Agent', 1, 'Agent who closes the deal', '2025-04-16T14:40:48.468137+00:00', '2025-04-16T14:40:48.468137+00:00');
INSERT INTO positions ("id", "name", "level", "description", "created_at", "updated_at") VALUES ('8395f610-6c95-4cd5-b778-ee6825ac78d1', 'Owner', 2, 'Agency owner', '2025-04-16T14:31:56.932235+00:00', '2025-04-16T14:31:56.932235+00:00');

-- Data for table: users
INSERT INTO users ("id", "email", "full_name", "position_id", "created_at", "updated_at", "national_producer_number", "annual_goal", "phone", "is_active") VALUES ('a9692c3e-a415-4fc3-a3e0-30c8eb652f09', 'admin@americancoveragecenter.com', 'American Coverage Center', '8395f610-6c95-4cd5-b778-ee6825ac78d1', '2025-04-16T14:31:56.932235+00:00', '2025-05-03T20:57:12.153103+00:00', '', 1000000, '', true);
INSERT INTO users ("id", "email", "full_name", "position_id", "created_at", "updated_at", "national_producer_number", "annual_goal", "phone", "is_active") VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', 'Admin User', '599470e2-3803-41a2-a792-82911e60c2f4', '2025-04-16T14:10:49.955548+00:00', '2025-05-03T21:01:19.617558+00:00', '487651', 5000, '4574124512', true);
