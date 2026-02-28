/**
 * Generates a unique, human-readable service reference code.
 * Format: SVC-<SERVICE_PREFIX>-<YYYYMMDD>-<6 random alphanum>
 * Example: SVC-WTR-20240315-A4F9K2
 */
function generateServiceCode(serviceType = 'GEN') {
  const prefix = serviceType
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `SVC-${prefix}-${date}-${rand}`;
}

module.exports = { generateServiceCode };
