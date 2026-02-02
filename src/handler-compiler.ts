import type {
  VersionHandlers,
  CompiledHandler,
  ParsedVersion,
  VersionedRequestHandler,
} from './types.js';
import type { RequestHandler } from 'express';
import { parseVersionRange, versionSatisfies, compareVersions } from './version-parser.js';
import { createInvalidHandlerError } from './errors.js';

// ─────────────────────────────────────────────────────────────────────────────
// Priority Calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the priority of a version range for matching.
 * Higher priority = more specific = matched first.
 *
 * Priority rules:
 * 1. Exact versions have highest priority (1000 + version value)
 * 2. Tilde ranges have medium priority (500 + version value)
 * 3. Caret ranges have lowest priority (version value only)
 *
 * Within each category, higher versions have higher priority.
 */
function calculatePriority(handler: CompiledHandler): number {
  const { range } = handler;
  const { major, minor, patch } = range.version;

  // Base version value (supports versions up to 999.999.999)
  const versionValue = major * 1_000_000 + minor * 1_000 + patch;

  switch (range.type) {
    case 'exact':
      return 1_000_000_000 + versionValue;
    case 'tilde':
      return 500_000_000 + versionValue;
    case 'caret':
      return versionValue;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Compilation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compiles version handlers into an optimized format for fast matching.
 *
 * This function:
 * 1. Parses all version ranges
 * 2. Validates handlers
 * 3. Calculates priorities
 * 4. Sorts by priority (most specific first)
 *
 * @param handlers - The version handlers object
 * @param validate - Whether to validate handlers
 * @returns Array of compiled handlers sorted by priority
 * @throws VersioningError if validation is enabled and a handler is invalid
 */
export function compileHandlers(handlers: VersionHandlers, validate = true): CompiledHandler[] {
  const compiled: CompiledHandler[] = [];

  for (const [key, handler] of Object.entries(handlers)) {
    // Validate handler is a function
    if (validate && typeof handler !== 'function') {
      throw createInvalidHandlerError(key, 'handler must be a function');
    }

    // Parse the version range
    const range = parseVersionRange(key);

    if (!range) {
      if (validate) {
        throw createInvalidHandlerError(
          key,
          'invalid version format. Expected: "1.0.0", "^1.0", "~1.2", etc.'
        );
      }
      continue;
    }

    const compiledHandler: CompiledHandler = {
      key,
      range,
      handler: handler as RequestHandler | VersionedRequestHandler,
      priority: 0, // Will be calculated after
    };

    // Calculate priority
    (compiledHandler as { priority: number }).priority = calculatePriority(compiledHandler);

    compiled.push(compiledHandler);
  }

  // Sort by priority (highest first)
  compiled.sort((a, b) => b.priority - a.priority);

  return compiled;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler Matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Finds the best matching handler for a given client version.
 *
 * The matching algorithm:
 * 1. Iterates through handlers in priority order (most specific first)
 * 2. Returns the first handler that matches the client version
 * 3. Returns undefined if no handler matches
 *
 * @param clientVersion - The parsed client version
 * @param compiledHandlers - Array of compiled handlers
 * @returns The matching compiled handler or undefined
 */
export function findMatchingHandler(
  clientVersion: ParsedVersion,
  compiledHandlers: readonly CompiledHandler[]
): CompiledHandler | undefined {
  for (const handler of compiledHandlers) {
    if (versionSatisfies(clientVersion, handler.range)) {
      return handler;
    }
  }

  return undefined;
}

/**
 * Finds the handler for the latest available version.
 *
 * @param compiledHandlers - Array of compiled handlers
 * @returns The handler for the latest version or undefined
 */
export function findLatestHandler(
  compiledHandlers: readonly CompiledHandler[]
): CompiledHandler | undefined {
  if (compiledHandlers.length === 0) {
    return undefined;
  }

  let latest: CompiledHandler | undefined;

  for (const handler of compiledHandlers) {
    if (!latest || compareVersions(handler.range.version, latest.range.version) > 0) {
      latest = handler;
    }
  }

  return latest;
}

/**
 * Gets all available version keys from compiled handlers.
 *
 * @param compiledHandlers - Array of compiled handlers
 * @returns Array of version keys
 */
export function getAvailableVersions(compiledHandlers: readonly CompiledHandler[]): string[] {
  return compiledHandlers.map((h) => h.key);
}
