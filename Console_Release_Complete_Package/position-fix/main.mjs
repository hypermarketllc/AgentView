/**
 * Main entry point for position fix
 * Orchestrates all operations to fix user positions
 */

import { createDatabasePool } from './utils/config.mjs';
import { logSection, logInfo, logSuccess, logError } from './utils/logger.mjs';
import { 
  checkPositionIdField, 
  addPositionIdField, 
  checkPositionsTable,
  addForeignKeyConstraint,
  createUserPositionView
} from './schema.mjs';
import { createPositionsTable } from './positions.mjs';
import { updateUsersWithPositions } from './users.mjs';

/**
 * Main function
 */
async function main() {
  logSection('Enhanced User Position Fix');
  
  let pool;
  
  try {
    // Create database connection pool
    pool = await createDatabasePool();
    
    // Check if the position_id field exists
    const positionIdExists = await checkPositionIdField(pool);
    
    if (!positionIdExists) {
      // Add the position_id field
      await addPositionIdField(pool);
    }
    
    // Create the enhanced positions table
    await createPositionsTable(pool);
    
    // Update users with appropriate positions
    await updateUsersWithPositions(pool);
    
    // Add foreign key constraint
    await addForeignKeyConstraint(pool);
    
    // Create user_positions view
    await createUserPositionView(pool);
    
    logSection('Enhanced User Position Fix Completed Successfully');
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      logInfo('Database connection closed');
    }
  }
}

// Run the main function
main();
