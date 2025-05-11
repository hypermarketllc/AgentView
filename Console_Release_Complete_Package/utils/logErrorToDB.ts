import { Pool } from 'pg';
const pool = new Pool();

export const logErrorToDB = async (code, message, context = {}) => {
  try {
    await pool.query(
      'INSERT INTO system_errors (code, message, context) VALUES ($1, $2, $3)',
      [code, message, JSON.stringify(context)]
    );
  } catch (e) {
    console.error('Failed to log error to DB:', e);
  }
};