import type { Request, Response, NextFunction, RequestHandler } from 'express';

// ─────────────────────────────────────────────────────────────────────────────
// Version Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parsed semantic version components.
 */
export interface ParsedVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly raw: string;
}

/**
 * Version range type indicating the matching strategy.
 */
export type VersionRangeType = 'caret' | 'tilde' | 'exact';

/**
 * Parsed version range with its type and base version.
 */
export interface ParsedVersionRange {
  readonly type: VersionRangeType;
  readonly version: ParsedVersion;
  readonly raw: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Express request extended with optional version property.
 * This allows middleware to set the version before reaching the versioning middleware.
 */
export interface VersionedRequest extends Request {
  /**
   * The API version extracted from the request.
   * Can be set by upstream middleware or extracted automatically.
   */
  version?: string;

  /**
   * Metadata about the matched version (set by the middleware).
   */
  versionInfo?: {
    /** The original version string from the request */
    readonly requested: string;
    /** The handler key that matched */
    readonly matched: string;
    /** The source where the version was found */
    readonly source: VersionSource;
  };
}

/**
 * Type alias for Express request handler with versioned request.
 */
export type VersionedRequestHandler = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * An object that maps semantic version strings to specific request handlers.
 *
 * Each key must be a valid version string:
 * - Exact: `"1.0.0"`, `"2.1.3"`
 * - Caret (major): `"^1"`, `"^2.0"`, `"^3.1.0"`
 * - Tilde (minor): `"~1.2"`, `"~2.0.0"`
 *
 * @example
 * ```ts
 * const handlers: VersionHandlers = {
 *   "^1": (req, res) => res.send("v1.x handler"),
 *   "~2.1": (req, res) => res.send("v2.1.x handler"),
 *   "3.0.0": (req, res) => res.send("exact v3.0.0 handler"),
 * };
 * ```
 */
export type VersionHandlers = Record<string, RequestHandler | VersionedRequestHandler>;

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sources from which the version can be extracted.
 */
export type VersionSource = 'header' | 'query' | 'path' | 'custom';

/**
 * Configuration for header-based version extraction.
 */
export interface HeaderVersionConfig {
  /**
   * The header name to read the version from.
   * @default 'accept-version'
   */
  readonly name?: string;
}

/**
 * Configuration for query parameter-based version extraction.
 */
export interface QueryVersionConfig {
  /**
   * The query parameter name to read the version from.
   * @default 'v'
   */
  readonly name?: string;
}

/**
 * Configuration for URL path-based version extraction.
 */
export interface PathVersionConfig {
  /**
   * Regular expression to extract version from the URL path.
   * Must contain a capture group for the version.
   * @default /\/v(\d+(?:\.\d+)?(?:\.\d+)?)\//
   * @example /\/api\/v(\d+)\// matches /api/v1/users
   */
  readonly pattern?: RegExp;
}

/**
 * Custom version extractor function.
 * Return the version string or undefined if not found.
 */
export type CustomVersionExtractor = (req: VersionedRequest) => string | undefined;

/**
 * Configuration for version extraction.
 */
export interface VersionExtractionConfig {
  /**
   * Order of sources to try when extracting the version.
   * The first source that returns a valid version wins.
   * @default ['header', 'query']
   */
  readonly sources?: readonly VersionSource[];

  /**
   * Header configuration.
   */
  readonly header?: HeaderVersionConfig;

  /**
   * Query parameter configuration.
   */
  readonly query?: QueryVersionConfig;

  /**
   * URL path configuration.
   */
  readonly path?: PathVersionConfig;

  /**
   * Custom version extractor.
   * Only used if 'custom' is included in sources.
   */
  readonly custom?: CustomVersionExtractor;
}

/**
 * Configuration for error responses.
 */
export interface ErrorResponseConfig {
  /**
   * HTTP status code for missing version errors.
   * @default 422
   */
  readonly missingVersionStatus?: number;

  /**
   * HTTP status code for version not found errors.
   * @default 422
   */
  readonly versionNotFoundStatus?: number;

  /**
   * Custom message for missing version errors.
   * @default 'API version is required'
   */
  readonly missingVersionMessage?: string;

  /**
   * Custom message for version not found errors.
   * Can be a string or a function that receives the requested version.
   * @default 'No handler found for the requested API version'
   */
  readonly versionNotFoundMessage?: string | ((version: string) => string);

  /**
   * Whether to include the requested version in error responses.
   * @default true
   */
  readonly includeRequestedVersion?: boolean;

  /**
   * Custom error handler. If provided, overrides default error handling.
   * Return true to indicate the error was handled, false to use default handling.
   */
  readonly onError?: (
    error: VersioningError,
    req: VersionedRequest,
    res: Response,
    next: NextFunction
  ) => boolean | undefined;
}

/**
 * Fallback strategy when no version matches.
 */
export type FallbackStrategy = 'latest' | 'none' | 'default';

/**
 * Main configuration options for the versioning middleware.
 */
export interface VersioningOptions {
  /**
   * Version extraction configuration.
   */
  readonly extraction?: VersionExtractionConfig;

  /**
   * Error response configuration.
   */
  readonly errorResponse?: ErrorResponseConfig;

  /**
   * Fallback strategy when no handler matches the requested version.
   * - 'latest': Use the handler for the highest available version
   * - 'none': Return an error (no fallback)
   * - 'default': Use the default handler if provided, otherwise 'latest'
   * @default 'default'
   */
  readonly fallbackStrategy?: FallbackStrategy;

  /**
   * Default handler to use when no version matches and fallbackStrategy allows it.
   */
  readonly defaultHandler?: RequestHandler | VersionedRequestHandler;

  /**
   * Whether to validate handler keys on initialization.
   * If true, throws an error for invalid version strings.
   * @default true
   */
  readonly validateHandlers?: boolean;

  /**
   * Whether to attach version info to the request object.
   * @default true
   */
  readonly attachVersionInfo?: boolean;

  /**
   * Whether to require a version in every request.
   * If false, requests without a version will use the fallback strategy.
   * @default true
   */
  readonly requireVersion?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Error codes for versioning errors.
 */
export type VersioningErrorCode =
  | 'MISSING_VERSION'
  | 'VERSION_NOT_FOUND'
  | 'INVALID_VERSION_FORMAT'
  | 'INVALID_HANDLER'
  | 'INVALID_CONFIGURATION';

/**
 * Base interface for versioning errors.
 */
export interface VersioningErrorDetails {
  readonly code: VersioningErrorCode;
  readonly message: string;
  readonly requestedVersion?: string;
  readonly availableVersions?: readonly string[];
}

/**
 * Custom error class for versioning-related errors.
 */
export class VersioningError extends Error {
  public readonly code: VersioningErrorCode;
  public readonly requestedVersion: string | undefined;
  public readonly availableVersions: readonly string[] | undefined;
  public readonly statusCode: number;

  constructor(details: VersioningErrorDetails, statusCode = 422) {
    super(details.message);
    this.name = 'VersioningError';
    this.code = details.code;
    this.requestedVersion = details.requestedVersion;
    this.availableVersions = details.availableVersions;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    Error.captureStackTrace(this, VersioningError);
  }

  /**
   * Converts the error to a JSON-serializable object.
   */
  toJSON(): VersioningErrorDetails & { statusCode: number } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.requestedVersion !== undefined && { requestedVersion: this.requestedVersion }),
      ...(this.availableVersions !== undefined && { availableVersions: this.availableVersions }),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal Types (for compiled handlers)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pre-compiled handler with parsed version range for fast matching.
 * @internal
 */
export interface CompiledHandler {
  readonly key: string;
  readonly range: ParsedVersionRange;
  readonly handler: RequestHandler | VersionedRequestHandler;
  readonly priority: number;
}

/**
 * Result of version extraction.
 * @internal
 */
export interface ExtractionResult {
  readonly version: string;
  readonly source: VersionSource;
}

/**
 * Resolved configuration with all defaults applied.
 * @internal
 */
export interface ResolvedConfig {
  readonly extraction: Omit<Required<VersionExtractionConfig>, 'custom'> & {
    readonly header: Required<HeaderVersionConfig>;
    readonly query: Required<QueryVersionConfig>;
    readonly path: Required<PathVersionConfig>;
    readonly custom: CustomVersionExtractor | undefined;
  };
  readonly errorResponse: Required<Omit<ErrorResponseConfig, 'onError'>> & {
    readonly onError: ErrorResponseConfig['onError'] | undefined;
  };
  readonly fallbackStrategy: FallbackStrategy;
  readonly defaultHandler: RequestHandler | VersionedRequestHandler | undefined;
  readonly validateHandlers: boolean;
  readonly attachVersionInfo: boolean;
  readonly requireVersion: boolean;
}
