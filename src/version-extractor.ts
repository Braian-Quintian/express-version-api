import type { VersionedRequest, ResolvedConfig, ExtractionResult } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Version Extractors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts version from the request header.
 *
 * @param req - The Express request object
 * @param headerName - The header name to read from
 * @returns The version string or undefined
 */
function extractFromHeader(req: VersionedRequest, headerName: string): string | undefined {
  const value = req.headers[headerName.toLowerCase()];

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  // Handle array of headers (take first)
  if (Array.isArray(value) && value.length > 0 && value[0]) {
    return value[0].trim();
  }

  return undefined;
}

/**
 * Extracts version from query parameters.
 *
 * @param req - The Express request object
 * @param paramName - The query parameter name to read from
 * @returns The version string or undefined
 */
function extractFromQuery(req: VersionedRequest, paramName: string): string | undefined {
  const value = req.query[paramName];

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

/**
 * Extracts version from the URL path.
 *
 * @param req - The Express request object
 * @param pattern - The regex pattern to match
 * @returns The version string or undefined
 */
function extractFromPath(req: VersionedRequest, pattern: RegExp): string | undefined {
  const path = req.path || req.url;
  const isStatefulPattern = pattern.global || pattern.sticky;

  if (isStatefulPattern) {
    pattern.lastIndex = 0;
  }

  const match = pattern.exec(path);

  if (isStatefulPattern) {
    pattern.lastIndex = 0;
  }

  if (match?.[1]) {
    return match[1].trim();
  }

  return undefined;
}

/**
 * Extracts version from the request object (set by upstream middleware).
 *
 * @param req - The Express request object
 * @returns The version string or undefined
 */
function extractFromRequest(req: VersionedRequest): string | undefined {
  if (typeof req.version === 'string' && req.version.trim().length > 0) {
    return req.version.trim();
  }

  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Extractor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a version extractor function based on configuration.
 *
 * @param config - The resolved configuration
 * @returns A function that extracts version from a request
 */
export function createVersionExtractor(
  config: ResolvedConfig
): (req: VersionedRequest) => ExtractionResult | undefined {
  const { sources, header, query, path, custom } = config.extraction;

  return (req: VersionedRequest): ExtractionResult | undefined => {
    // First, always check if version is already set on the request
    const requestVersion = extractFromRequest(req);
    if (requestVersion) {
      return { version: requestVersion, source: 'custom' };
    }

    // Then try each configured source in order
    for (const source of sources) {
      let version: string | undefined;

      switch (source) {
        case 'header':
          version = extractFromHeader(req, header.name);
          break;

        case 'query':
          version = extractFromQuery(req, query.name);
          break;

        case 'path':
          version = extractFromPath(req, path.pattern);
          break;

        case 'custom':
          version = custom?.(req);
          break;
      }

      if (version) {
        return { version, source };
      }
    }

    return undefined;
  };
}

/**
 * Default version extractor that checks header and query.
 * Used when no custom configuration is provided.
 *
 * @param req - The Express request object
 * @returns Extraction result or undefined
 */
export function defaultVersionExtractor(req: VersionedRequest): ExtractionResult | undefined {
  // Check req.version first (set by upstream middleware)
  const requestVersion = extractFromRequest(req);
  if (requestVersion) {
    return { version: requestVersion, source: 'custom' };
  }

  // Check Accept-Version header
  const headerVersion = extractFromHeader(req, 'accept-version');
  if (headerVersion) {
    return { version: headerVersion, source: 'header' };
  }

  // Check query parameter
  const queryVersion = extractFromQuery(req, 'v');
  if (queryVersion) {
    return { version: queryVersion, source: 'query' };
  }

  return undefined;
}
