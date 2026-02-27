/**
 * express-version-api
 *
 * A powerful and flexible versioning middleware for Express.js APIs.
 * Supports semantic versioning with caret (^) and tilde (~) ranges.
 *
 * @packageDocumentation
 */

// ─────────────────────────────────────────────────────────────────────────────
// Main Middleware
// ─────────────────────────────────────────────────────────────────────────────

export { versioningMiddleware } from './middleware.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type {
  // Version types
  ParsedVersion,
  ParsedVersionRange,
  VersionRangeType,

  // Handler types
  VersionHandlers,
  VersionedRequest,
  VersionedRequestHandler,

  // Configuration types
  VersioningOptions,
  VersionExtractionConfig,
  ErrorResponseConfig,
  FallbackStrategy,
  VersionSource,
  HeaderVersionConfig,
  QueryVersionConfig,
  PathVersionConfig,
  CustomVersionExtractor,

  // Error types
  VersioningErrorCode,
  VersioningErrorDetails,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Error Classes
// ─────────────────────────────────────────────────────────────────────────────

export { VersioningError } from './types.js';

export {
  createMissingVersionError,
  createVersionNotFoundError,
  createInvalidVersionFormatError,
  createInvalidHandlerError,
  createInvalidConfigurationError,
  isVersioningError,
  hasErrorCode,
} from './errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// Version Utilities
// ─────────────────────────────────────────────────────────────────────────────

export {
  parseVersion,
  parseVersionRange,
  versionSatisfies,
  compareVersions,
  findLatestVersion,
  isValidVersion,
  isValidVersionRange,
  normalizeVersion,
} from './version-parser.js';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export { DEFAULT_CONFIG } from './config.js';
