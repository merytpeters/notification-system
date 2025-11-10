/**
 * Utility for safely tracking uptime across different environments
 * Provides fallback mechanisms when process.uptime() is not available
 */

// Store the application start time as a fallback
const applicationStartTime = Date.now();

/**
 * Safely gets the uptime in seconds
 * @returns Uptime in seconds, or 0 if unable to calculate
 */
export function getSafeUptime(): number {
  try {
    // Try to use the Node.js process.uptime() if available
    if (typeof globalThis !== 'undefined' &&
        'process' in globalThis &&
        (globalThis as any).process &&
        (globalThis as any).process.uptime) {
      return (globalThis as any).process.uptime();
    }
  } catch (error) {
    // Fall back to manual calculation if process.uptime() fails
  }

  // Fallback: Calculate uptime based on stored start time
  const currentTime = Date.now();
  const uptimeMs = currentTime - applicationStartTime;
  return Math.floor(uptimeMs / 1000);
}

/**
 * Gets uptime in a human-readable format
 * @returns Formatted uptime string (e.g., "2 days, 3 hours, 45 minutes")
 */
export function getFormattedUptime(): string {
  const totalSeconds = getSafeUptime();
  
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }
  
  return parts.join(', ');
}