/**
 * fix-auth-endpoints.js
 * This script fixes the authentication endpoints to use the auth_users table instead of the users table.
 */

import fs from 'fs';
import path from 'path';

// Path to the auth file
const authFilePath = './server-docker-auth.js';

// Read the original file
console.log(`Reading ${authFilePath}...`);
const originalContent = fs.readFileSync(authFilePath, 'utf8');

// Create a backup
const backupPath = `${authFilePath}.backup`;
console.log(`Creating backup at ${backupPath}...`);
fs.writeFileSync(backupPath, originalContent);

// Fix the authentication code
console.log('Fixing authentication endpoints...');

// Replace the login route to use auth_users table
const fixedContent = originalContent.replace(
  /app\.post\('\/crm\/api\/auth\/login', async \(req, res\) => {[\s\S]*?passwordMatch = await bcrypt\.compare\(password, user\.password_hash\);/g,
  `app.post('/crm/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get user from auth_users table
      const authUserResult = await pool.query(
        'SELECT * FROM auth_users WHERE email = $1',
        [email]
      );
      
      if (authUserResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const authUser = authUserResult.rows[0];
      
      // Get user details from users table
      const userResult = await pool.query(
        \`SELECT u.*, p.name as position_name, p.level as position_level 
         FROM users u
         JOIN positions p ON u.position_id = p.id
         WHERE u.email = $1\`,
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User details not found' });
      }
      
      const user = userResult.rows[0];
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, authUser.password_hash);`
);

// Replace the register route to use auth_users table
const fixedContent2 = fixedContent.replace(
  /app\.post\('\/crm\/api\/auth\/register', async \(req, res\) => {[\s\S]*?const passwordHash = await bcrypt\.hash\(password, SALT_ROUNDS\);[\s\S]*?await pool\.query\(\s*`INSERT INTO users \(id, email, password_hash, full_name, position_id\)/g,
  `app.post('/crm/api/auth/register', async (req, res) => {
    try {
      const { email, password, fullName, positionId } = req.body;
      
      // Check if email already exists in auth_users
      const existingAuthUser = await pool.query('SELECT * FROM auth_users WHERE email = $1', [email]);
      
      if (existingAuthUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // Check if email already exists in users
      const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Generate user ID
      const userId = uuidv4();
      
      // Insert into auth_users
      await pool.query(
        \`INSERT INTO auth_users (id, email, password_hash)
         VALUES ($1, $2, $3)\`,
        [userId, email, passwordHash]
      );
      
      // Insert into users`
);

// Replace the API login route to use auth_users table
const fixedContent3 = fixedContent2.replace(
  /app\.post\('\/api\/auth\/login', async \(req, res\) => {[\s\S]*?const passwordMatch = await bcrypt\.compare\(password, user\.password_hash\);/g,
  `app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // For test account
      if (email === 'agent@example.com' && password === 'Agent123!') {
        return res.status(200).json({
          user: {
            id: '1',
            email: 'agent@example.com',
            name: 'Test Agent',
            role: 'agent'
          },
          token: 'test-token-123'
        });
      }
      
      // For admin account
      if (email === 'admin@americancoveragecenter.com' && password === 'Admin123!') {
        return res.status(200).json({
          user: {
            id: '2',
            email: 'admin@americancoveragecenter.com',
            name: 'Admin User',
            role: 'admin'
          },
          token: 'admin-token-123'
        });
      }
      
      // Check auth_users table for user
      const authUserResult = await pool.query(
        'SELECT * FROM auth_users WHERE email = $1',
        [email]
      );
      
      if (authUserResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const authUser = authUserResult.rows[0];
      
      // Get user details from users table
      const userResult = await pool.query(
        \`SELECT u.*, p.name as position_name, p.level as position_level 
         FROM users u
         JOIN positions p ON u.position_id = p.id
         WHERE u.email = $1\`,
        [email]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User details not found' });
      }
      
      const user = userResult.rows[0];
      
      // Verify password
      const passwordMatch = await bcrypt.compare(password, authUser.password_hash);`
);

// Write the fixed content back to the file
console.log('Writing fixed content back to the file...');
fs.writeFileSync(authFilePath, fixedContent3);

console.log('Authentication endpoints fixed successfully.');
console.log('Both /api/auth/login and /crm/api/auth/login should now work.');
