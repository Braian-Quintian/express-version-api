import type { VersioningOptions, ResolvedConfig } from './types.js';
import { createInvalidConfigurationError } from './errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// Default Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: ResolvedConfig = {
  extraction: {
    sources: ['header', 'query'],
    header: {
      name: 'accept-version',
    },
    query: {
      name: 'v',
    },
    path: {
      pattern: /\/v(\d+(?:\.\d+)?(?:\.\d+)?)\//,
    },
    custom: undefined,
  },
  errorResponse: {
    missingVersionStatus: 422,
    versionNotFoundStatus: 422,
    missingVersionMessage: 'API version is required',
    versionNotFoundMessage: 'No handler found for the requested API version',
    includeRequestedVersion: true,
    onError: undefined,
  },
  fallbackStrategy: 'default',
  defaultHandler: undefined,
  validateHandlers: true,
  attachVersionInfo: true,
  requireVersion: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Configuration Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves user options with default values.
 *
 * @param options - User-provided options
 * @returns Fully resolved configuration
 * @throws VersioningError if configuration is invalid
 */
export function resolveConfig(options?: VersioningOptions): ResolvedConfig {
  if (!options) {
    return DEFAULT_CONFIG;
  }

  // Validate sources if provided
  if (options.extraction?.sources) {
    const validSources = new Set(['header', 'query', 'path', 'custom']);
    for (const source of options.extraction.sources) {
      if (!validSources.has(source)) {
        throw createInvalidConfigurationError(
          `Invalid version source: '${source}'. Valid sources: header, query, path, custom`
        );
      }
    }

    // Validate custom extractor is provided when 'custom' source is used
    if (options.extraction.sources.includes('custom') && !options.extraction.custom) {
      throw createInvalidConfigurationError(
        "Custom extractor function is required when 'custom' source is used"
      );
    }
  }

  // Validate path pattern if provided
  if (options.extraction?.path?.pattern && !(options.extraction.path.pattern instanceof RegExp)) {
    throw createInvalidConfigurationError('Path pattern must be a RegExp instance');
  }

  // Validate status codes if provided
  if (options.errorResponse?.missingVersionStatus !== undefined) {
    const status = options.errorResponse.missingVersionStatus;
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      throw createInvalidConfigurationError(
        'missingVersionStatus must be a valid HTTP status code (100-599)'
      );
    }
  }

  if (options.errorResponse?.versionNotFoundStatus !== undefined) {
    const status = options.errorResponse.versionNotFoundStatus;
    if (!Number.isInteger(status) || status < 100 || status > 599) {
      throw createInvalidConfigurationError(
        'versionNotFoundStatus must be a valid HTTP status code (100-599)'
      );
    }
  }

  // Merge configurations
  return {
    extraction: {
      sources: options.extraction?.sources ?? DEFAULT_CONFIG.extraction.sources,
      header: {
        name: options.extraction?.header?.name ?? DEFAULT_CONFIG.extraction.header.name,
      },
      query: {
        name: options.extraction?.query?.name ?? DEFAULT_CONFIG.extraction.query.name,
      },
      path: {
        pattern: options.extraction?.path?.pattern ?? DEFAULT_CONFIG.extraction.path.pattern,
      },
      custom: options.extraction?.custom,
    },
    errorResponse: {
      missingVersionStatus:
        options.errorResponse?.missingVersionStatus ??
        DEFAULT_CONFIG.errorResponse.missingVersionStatus,
      versionNotFoundStatus:
        options.errorResponse?.versionNotFoundStatus ??
        DEFAULT_CONFIG.errorResponse.versionNotFoundStatus,
      missingVersionMessage:
        options.errorResponse?.missingVersionMessage ??
        DEFAULT_CONFIG.errorResponse.missingVersionMessage,
      versionNotFoundMessage:
        options.errorResponse?.versionNotFoundMessage ??
        DEFAULT_CONFIG.errorResponse.versionNotFoundMessage,
      includeRequestedVersion:
        options.errorResponse?.includeRequestedVersion ??
        DEFAULT_CONFIG.errorResponse.includeRequestedVersion,
      onError: options.errorResponse?.onError,
    },
    fallbackStrategy: options.fallbackStrategy ?? DEFAULT_CONFIG.fallbackStrategy,
    defaultHandler: options.defaultHandler ?? DEFAULT_CONFIG.defaultHandler,
    validateHandlers: options.validateHandlers ?? DEFAULT_CONFIG.validateHandlers,
    attachVersionInfo: options.attachVersionInfo ?? DEFAULT_CONFIG.attachVersionInfo,
    requireVersion: options.requireVersion ?? DEFAULT_CONFIG.requireVersion,
  };
}

/**
 * Creates a frozen copy of the configuration to prevent mutations.
 *
 * @param config - The resolved configuration
 * @returns A frozen configuration object
 */
export function freezeConfig(config: ResolvedConfig): Readonly<ResolvedConfig> {
  return Object.freeze({
    ...config,
    extraction: Object.freeze({
      ...config.extraction,
      sources: Object.freeze([...config.extraction.sources]),
      header: Object.freeze({ ...config.extraction.header }),
      query: Object.freeze({ ...config.extraction.query }),
      path: Object.freeze({ ...config.extraction.path }),
    }),
    errorResponse: Object.freeze({ ...config.errorResponse }),
  });
}
