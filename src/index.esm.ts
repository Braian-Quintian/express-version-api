/**
 * ESM entrypoint.
 *
 * Re-exports all named APIs and keeps a default export for ESM consumers.
 */
export * from './index.js';
export { versioningMiddleware as default } from './middleware.js';
