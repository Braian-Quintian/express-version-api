import { VersioningError, type VersioningErrorCode } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Error Factory Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a VersioningError for missing version in request.
 */
export function createMissingVersionError(
  statusCode = 422,
  message = 'API version is required'
): VersioningError {
  return new VersioningError(
    {
      code: 'MISSING_VERSION',
      message,
    },
    statusCode
  );
}

/**
 * Creates a VersioningError for version not found.
 */
export function createVersionNotFoundError(
  requestedVersion: string,
  availableVersions: readonly string[],
  statusCode = 422
): VersioningError {
  return new VersioningError(
    {
      code: 'VERSION_NOT_FOUND',
      message: `No handler found for API version '${requestedVersion}'`,
      requestedVersion,
      availableVersions,
    },
    statusCode
  );
}

/**
 * Creates a VersioningError for invalid version format.
 */
export function createInvalidVersionFormatError(
  version: string,
  statusCode = 400
): VersioningError {
  return new VersioningError(
    {
      code: 'INVALID_VERSION_FORMAT',
      message: `Invalid version format: '${version}'`,
      requestedVersion: version,
    },
    statusCode
  );
}

/**
 * Creates a VersioningError for invalid handler configuration.
 */
export function createInvalidHandlerError(key: string, reason: string): VersioningError {
  return new VersioningError(
    {
      code: 'INVALID_HANDLER',
      message: `Invalid handler for version '${key}': ${reason}`,
    },
    500
  );
}

/**
 * Creates a VersioningError for invalid configuration.
 */
export function createInvalidConfigurationError(reason: string): VersioningError {
  return new VersioningError(
    {
      code: 'INVALID_CONFIGURATION',
      message: `Invalid configuration: ${reason}`,
    },
    500
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Type Guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Type guard to check if an error is a VersioningError.
 */
export function isVersioningError(error: unknown): error is VersioningError {
  return error instanceof VersioningError;
}

/**
 * Type guard to check if an error has a specific error code.
 */
export function hasErrorCode(error: unknown, code: VersioningErrorCode): error is VersioningError {
  return isVersioningError(error) && error.code === code;
}
