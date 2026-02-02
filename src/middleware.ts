import type { RequestHandler, Response, NextFunction } from 'express';
import type {
  VersionHandlers,
  VersioningOptions,
  VersionedRequest,
  CompiledHandler,
  ResolvedConfig,
} from './types.js';
import type { VersioningError } from './types.js';
import { resolveConfig, freezeConfig } from './config.js';
import { createVersionExtractor } from './version-extractor.js';
import { parseVersion } from './version-parser.js';
import {
  compileHandlers,
  findMatchingHandler,
  findLatestHandler,
  getAvailableVersions,
} from './handler-compiler.js';
import {
  createMissingVersionError,
  createVersionNotFoundError,
  createInvalidVersionFormatError,
  createInvalidConfigurationError,
} from './errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// Error Response Helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends an error response to the client.
 */
function sendErrorResponse(
  error: VersioningError,
  req: VersionedRequest,
  res: Response,
  next: NextFunction,
  config: ResolvedConfig
): void {
  // Check for custom error handler
  if (config.errorResponse.onError) {
    const handled = config.errorResponse.onError(error, req, res, next);
    if (handled === true) {
      return;
    }
  }

  // Default error response
  const response: Record<string, unknown> = {
    error: error.code,
    message: error.message,
  };

  if (config.errorResponse.includeRequestedVersion && error.requestedVersion) {
    response['requestedVersion'] = error.requestedVersion;
  }

  if (error.availableVersions && error.availableVersions.length > 0) {
    response['availableVersions'] = error.availableVersions;
  }

  res.status(error.statusCode).json(response);
}

/**
 * Gets the version not found message based on configuration.
 */
function getVersionNotFoundMessage(version: string, config: ResolvedConfig): string {
  const message = config.errorResponse.versionNotFoundMessage;

  if (typeof message === 'function') {
    return message(version);
  }

  return message;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a versioning middleware for Express.
 *
 * This middleware inspects incoming requests for a semantic version and routes
 * them to the appropriate handler based on version matching rules.
 *
 * @param handlers - Object mapping version strings to request handlers
 * @param options - Configuration options for the middleware
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * // Basic usage
 * app.use('/api', versioningMiddleware({
 *   '^1': v1Handler,
 *   '^2': v2Handler,
 *   '3.0.0': v3Handler,
 * }));
 *
 * // With options
 * app.use('/api', versioningMiddleware(
 *   {
 *     '^1': v1Handler,
 *     '^2': v2Handler,
 *   },
 *   {
 *     extraction: {
 *       sources: ['header', 'query', 'path'],
 *       header: { name: 'x-api-version' },
 *     },
 *     fallbackStrategy: 'latest',
 *   }
 * ));
 * ```
 */
export function versioningMiddleware(
  handlers: VersionHandlers,
  options?: VersioningOptions
): RequestHandler {
  // Validate handlers argument
  if (Array.isArray(handlers)) {
    throw createInvalidConfigurationError("'handlers' must be a non-null, non-array object");
  }

  // Resolve and freeze configuration
  const config = freezeConfig(resolveConfig(options));

  // Compile handlers (validates and sorts by priority)
  const compiledHandlers = compileHandlers(handlers, config.validateHandlers);

  // Check if we have any valid handlers
  if (compiledHandlers.length === 0) {
    throw createInvalidConfigurationError(
      'No valid handlers provided. At least one handler is required.'
    );
  }

  // Create version extractor
  const extractVersion = createVersionExtractor(config);

  // Get available versions for error messages
  const availableVersions = getAvailableVersions(compiledHandlers);

  // Return the middleware function
  return (req: VersionedRequest, res: Response, next: NextFunction): void => {
    // Extract version from request
    const extraction = extractVersion(req);

    // Handle missing version
    if (!extraction) {
      if (!config.requireVersion) {
        // Use fallback strategy
        handleFallback(undefined, compiledHandlers, config, availableVersions, req, res, next);
        return;
      }

      const error = createMissingVersionError(config.errorResponse.missingVersionStatus);
      sendErrorResponse(error, req, res, next, config);
      return;
    }

    const { version: versionString, source } = extraction;

    // Parse the client version
    const clientVersion = parseVersion(versionString);

    if (!clientVersion) {
      const error = createInvalidVersionFormatError(versionString);
      sendErrorResponse(error, req, res, next, config);
      return;
    }

    // Find matching handler
    const matchedHandler = findMatchingHandler(clientVersion, compiledHandlers);

    if (matchedHandler) {
      // Attach version info if configured
      if (config.attachVersionInfo) {
        req.versionInfo = {
          requested: versionString,
          matched: matchedHandler.key,
          source,
        };
      }

      // Execute the handler
      executeHandler(matchedHandler, req, res, next);
      return;
    }

    // No match found, use fallback strategy
    handleFallback(versionString, compiledHandlers, config, availableVersions, req, res, next);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles the fallback strategy when no version matches.
 */
function handleFallback(
  requestedVersion: string | undefined,
  compiledHandlers: readonly CompiledHandler[],
  config: ResolvedConfig,
  availableVersions: readonly string[],
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void {
  switch (config.fallbackStrategy) {
    case 'none': {
      // Return error, no fallback
      const error = createVersionNotFoundError(
        requestedVersion ?? 'unknown',
        availableVersions,
        config.errorResponse.versionNotFoundStatus
      );
      error.message = getVersionNotFoundMessage(requestedVersion ?? 'unknown', config);
      sendErrorResponse(error, req, res, next, config);
      break;
    }

    case 'latest': {
      // Use latest version handler
      const latestHandler = findLatestHandler(compiledHandlers);

      if (latestHandler) {
        if (config.attachVersionInfo && requestedVersion) {
          req.versionInfo = {
            requested: requestedVersion,
            matched: latestHandler.key,
            source: 'header', // Default since we're falling back
          };
        }
        executeHandler(latestHandler, req, res, next);
      } else {
        // This shouldn't happen if we validated handlers
        const error = createVersionNotFoundError(
          requestedVersion ?? 'unknown',
          availableVersions,
          config.errorResponse.versionNotFoundStatus
        );
        sendErrorResponse(error, req, res, next, config);
      }
      break;
    }

    case 'default': {
      // Use default handler if provided, otherwise fall back to latest
      if (config.defaultHandler) {
        if (config.attachVersionInfo && requestedVersion) {
          req.versionInfo = {
            requested: requestedVersion,
            matched: 'default',
            source: 'header',
          };
        }
        void Promise.resolve(config.defaultHandler(req, res, next));
      } else {
        // Fall back to latest
        const latestHandler = findLatestHandler(compiledHandlers);

        if (latestHandler) {
          if (config.attachVersionInfo && requestedVersion) {
            req.versionInfo = {
              requested: requestedVersion,
              matched: latestHandler.key,
              source: 'header',
            };
          }
          executeHandler(latestHandler, req, res, next);
        } else {
          const error = createVersionNotFoundError(
            requestedVersion ?? 'unknown',
            availableVersions,
            config.errorResponse.versionNotFoundStatus
          );
          sendErrorResponse(error, req, res, next, config);
        }
      }
      break;
    }
  }
}

/**
 * Executes a compiled handler safely.
 */
function executeHandler(
  handler: CompiledHandler,
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const result = handler.handler(req, res, next);

    // Handle async handlers
    if (result instanceof Promise) {
      result.catch((error: unknown) => {
        next(error);
      });
    }
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy API (Backward Compatibility)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a versioning middleware with a simpler API.
 * This is provided for backward compatibility with the original API.
 *
 * @param handlers - Object mapping version strings to request handlers
 * @param defaultHandler - Optional default handler for unmatched versions
 * @returns Express middleware function
 *
 * @deprecated Use `versioningMiddleware` with options instead
 *
 * @example
 * ```ts
 * // Legacy usage
 * app.use(createVersionMiddleware(
 *   { '^1': v1Handler, '^2': v2Handler },
 *   fallbackHandler
 * ));
 *
 * // Recommended usage
 * app.use(versioningMiddleware(
 *   { '^1': v1Handler, '^2': v2Handler },
 *   { defaultHandler: fallbackHandler }
 * ));
 * ```
 */
export function createVersionMiddleware(
  handlers: VersionHandlers,
  defaultHandler?: RequestHandler
): RequestHandler {
  const options: VersioningOptions = {
    fallbackStrategy: 'default',
    ...(defaultHandler && { defaultHandler }),
  };

  return versioningMiddleware(handlers, options);
}
