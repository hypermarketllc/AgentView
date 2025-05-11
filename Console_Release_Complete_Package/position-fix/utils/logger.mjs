/**
 * Logger utility for position fix
 * Provides colored console logging functions
 */

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 * @param {string} message - Message to log
 * @param {string} color - Color to use
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a section header
 * @param {string} title - Section title
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

/**
 * Log a success message
 * @param {string} message - Success message
 */
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

/**
 * Log an error message
 * @param {string} message - Error message
 */
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

/**
 * Log an info message
 * @param {string} message - Info message
 */
function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

export {
  colors,
  log,
  logSection,
  logSuccess,
  logError,
  logWarning,
  logInfo
};
