/**
 * fix-admin-login.js
 * This script fixes the login functionality by adding additional checks and error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function fixAdminLogin() {
  console.log('=== Fixing Admin Login ===');
  
  try {
    // Check database connection
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('Database connected:', connectionResult.rows[0]);
    
    // Check if admin user exists
    const adminEmail = 'admin@example.com';
    const adminResult = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (adminResult.rows.length === 0) {
      console.log('Admin user not found. Creating default admin user...');
      
      // Create admin user
      const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const adminPassword = 'Admin123!';
      const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
      
      await pool.query(`
        INSERT INTO users (id, email, password_hash, full_name, position_id) VALUES
        ($1, $2, $3, $4, $5)
      `, [adminId, adminEmail, adminPasswordHash, 'Admin User', '599470e2-3803-41a2-a792-82911e60c2f4']);
      
      console.log('Default admin user created:');
      console.log('  Email:', adminEmail);
      console.log('  Password:', adminPassword);
    } else {
      console.log('Admin user found. Checking password hash...');
      
      const admin = adminResult.rows[0];
      
      // Check if password hash is valid
      if (!admin.password_hash) {
        console.log('Password hash is missing. Resetting admin password...');
        
        // Reset admin password
        const adminPassword = 'Admin123!';
        const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
        
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [adminPasswordHash, admin.id]);
        
        console.log('Admin password reset:');
        console.log('  Email:', adminEmail);
        console.log('  Password:', adminPassword);
      } else {
        // Test password hash
        try {
          const testPassword = 'Admin123!';
          const passwordMatch = await bcrypt.compare(testPassword, admin.password_hash);
          
          console.log('Password hash test:', passwordMatch ? 'PASSED' : 'FAILED');
          
          if (!passwordMatch) {
            console.log('Password hash is invalid. Resetting admin password...');
            
            // Reset admin password
            const adminPassword = 'Admin123!';
            const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
            
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [adminPasswordHash, admin.id]);
            
            console.log('Admin password reset:');
            console.log('  Email:', adminEmail);
            console.log('  Password:', adminPassword);
          }
        } catch (error) {
          console.error('Error testing password hash:', error);
          console.log('Resetting admin password due to error...');
          
          // Reset admin password
          const adminPassword = 'Admin123!';
          const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
          
          await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [adminPasswordHash, admin.id]);
          
          console.log('Admin password reset:');
          console.log('  Email:', adminEmail);
          console.log('  Password:', adminPassword);
        }
      }
    }
    
    // Fix server-docker.js login route
    console.log('Fixing login route in server-docker.js...');
    
    const serverDockerPath = path.join(__dirname, 'server-docker.js');
    let serverDockerContent = fs.readFileSync(serverDockerPath, 'utf8');
    
    // Replace the login route with a more robust version
    const oldLoginRoute = `app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const userResult = await pool.query(
      \`SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1\`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: {
          id: user.position_id,
          name: user.position_name,
          level: user.position_level
        }
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});`;

    const newLoginRoute = `app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get user from database
    const userResult = await pool.query(
      \`SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1\`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check if password hash exists
    if (!user.password_hash) {
      console.error('User has no password hash:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check password
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Password comparison error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: {
          id: user.position_id,
          name: user.position_name,
          level: user.position_level
        }
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});`;

    // Replace the login route
    serverDockerContent = serverDockerContent.replace(oldLoginRoute, newLoginRoute);
    
    // Write the updated content back to the file
    fs.writeFileSync(serverDockerPath, serverDockerContent);
    
    console.log('Login route fixed successfully');
    
    // Create missing tables
    console.log('Creating missing tables...');
    
    // Create system_health_checks table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_health_checks (
        id UUID PRIMARY KEY,
        component VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        endpoint VARCHAR(255),
        category VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Create user_accs table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_accs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        display_name VARCHAR(255),
        theme_preference VARCHAR(50) DEFAULT 'light',
        notification_preferences JSONB DEFAULT '{"email": true, "push": true, "deals": true, "system": true}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Create settings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(255) NOT NULL,
        value TEXT,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(key, category)
      )
    `);
    
    // Add extension for UUID generation if it doesn't exist
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    
    console.log('Missing tables created successfully');
    
    console.log('=== Admin Login Fixed ===');
  } catch (error) {
    console.error('Error fixing admin login:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the fix
fixAdminLogin();
