/**
 * Lightweight logger utility for consistent, grep-friendly debug logging.
 *
 * Usage:
 *   import { createLogger } from '../utils/logger.js';
 *   const log = createLogger('ChatService');
 *   log.info('validateChatAccess', 'Checking access', { rideId, userId });
 *   log.error('saveMessage', 'Failed to save', error);
 */

const timestamp = () => new Date().toISOString();

/**
 * Create a namespaced logger for a service.
 * @param {string} serviceName - The name of the service (e.g. 'ChatService')
 * @returns {{ info, warn, error, debug }}
 */
export const createLogger = (serviceName) => {
    const prefix = (fnName) => `[${timestamp()}] [${serviceName}] [${fnName}]`;

    return {
        info: (fnName, message, meta = null) => {
            console.log(`${prefix(fnName)} ℹ️  ${message}`, meta != null ? meta : '');
        },
        warn: (fnName, message, meta = null) => {
            console.warn(`${prefix(fnName)} ⚠️  ${message}`, meta != null ? meta : '');
        },
        error: (fnName, message, meta = null) => {
            console.error(`${prefix(fnName)} ❌ ${message}`, meta != null ? meta : '');
        },
        debug: (fnName, message, meta = null) => {
            console.debug(`${prefix(fnName)} 🐛 ${message}`, meta != null ? meta : '');
        }
    };
};

export default createLogger;
