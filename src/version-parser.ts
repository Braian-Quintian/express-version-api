import type { ParsedVersion, ParsedVersionRange, VersionRangeType } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Regular expression to validate and parse semantic version strings.
 * Supports: 1, 1.0, 1.0.0, with optional ^ or ~ prefix
 */
const VERSION_REGEX = /^(\^|~)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/;

/**
 * Gets how many version components were explicitly provided (1, 2, or 3).
 */
function getSpecifiedComponentCount(rawRange: string): 1 | 2 | 3 {
  const withoutPrefix = rawRange.replace(/^[\^~]/, '');
  const count = withoutPrefix.split('.').length;

  if (count <= 1) {
    return 1;
  }

  if (count === 2) {
    return 2;
  }

  return 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a version string into its components.
 *
 * @param version - The version string to parse (e.g., "1.2.3", "1.2", "1")
 * @returns The parsed version or null if invalid
 *
 * @example
 * ```ts
 * parseVersion("1.2.3") // { major: 1, minor: 2, patch: 3, raw: "1.2.3" }
 * parseVersion("1.2")   // { major: 1, minor: 2, patch: 0, raw: "1.2" }
 * parseVersion("1")     // { major: 1, minor: 0, patch: 0, raw: "1" }
 * parseVersion("abc")   // null
 * ```
 */
export function parseVersion(version: string): ParsedVersion | null {
  const trimmed = version.trim();
  const match = VERSION_REGEX.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, , majorStr, minorStr, patchStr] = match;

  const major = parseInt(majorStr ?? '0', 10);
  const minor = parseInt(minorStr ?? '0', 10);
  const patch = parseInt(patchStr ?? '0', 10);

  // Validate parsed numbers
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null;
  }

  // Validate non-negative
  if (major < 0 || minor < 0 || patch < 0) {
    return null;
  }

  return {
    major,
    minor,
    patch,
    raw: trimmed,
  };
}

/**
 * Parses a version range string (with optional ^ or ~ prefix).
 *
 * @param range - The version range string to parse
 * @returns The parsed version range or null if invalid
 *
 * @example
 * ```ts
 * parseVersionRange("^1.2.3") // { type: 'caret', version: {...}, raw: "^1.2.3" }
 * parseVersionRange("~1.2")   // { type: 'tilde', version: {...}, raw: "~1.2" }
 * parseVersionRange("1.0.0")  // { type: 'exact', version: {...}, raw: "1.0.0" }
 * ```
 */
export function parseVersionRange(range: string): ParsedVersionRange | null {
  const trimmed = range.trim();
  const match = VERSION_REGEX.exec(trimmed);

  if (!match) {
    return null;
  }

  const [, prefix, majorStr, minorStr, patchStr] = match;

  const major = parseInt(majorStr ?? '0', 10);
  const minor = parseInt(minorStr ?? '0', 10);
  const patch = parseInt(patchStr ?? '0', 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null;
  }

  let type: VersionRangeType;
  if (prefix === '^') {
    type = 'caret';
  } else if (prefix === '~') {
    type = 'tilde';
  } else {
    type = 'exact';
  }

  return {
    type,
    version: { major, minor, patch, raw: trimmed.replace(/^[\^~]/, '') },
    raw: trimmed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks if a client version satisfies a version range.
 *
 * Matching rules:
 * - Caret (^): Matches if major version is equal and client version >= range version
 *   - ^1.2.3 matches 1.2.3, 1.2.4, 1.3.0, but not 2.0.0 or 1.2.2
 * - Tilde (~): Matches if major.minor is equal and client version >= range version
 *   - ~1.2.3 matches 1.2.3, 1.2.4, but not 1.3.0 or 1.2.2
 * - Exact: Matches only if versions are exactly equal
 *   - 1.2.3 matches only 1.2.3
 *
 * @param clientVersion - The parsed client version
 * @param range - The parsed version range to match against
 * @returns true if the client version satisfies the range
 *
 * @example
 * ```ts
 * const client = parseVersion("1.5.0");
 * const range = parseVersionRange("^1.2.0");
 * versionSatisfies(client, range); // true
 * ```
 */
export function versionSatisfies(clientVersion: ParsedVersion, range: ParsedVersionRange): boolean {
  const { major: cMajor, minor: cMinor, patch: cPatch } = clientVersion;
  const { major: rMajor, minor: rMinor, patch: rPatch } = range.version;

  switch (range.type) {
    case 'caret': {
      // ^1.2.3 matches >=1.2.3 <2.0.0
      if (cMajor !== rMajor) {
        return false;
      }

      // For major >= 1, caret allows all compatible minors/patches.
      if (rMajor > 0) {
        if (cMinor < rMinor) {
          return false;
        }

        if (cMinor === rMinor && cPatch < rPatch) {
          return false;
        }

        return true;
      }

      // For major 0, compatibility is stricter per semver.
      // ^0.2.3 := >=0.2.3 <0.3.0
      if (rMinor > 0) {
        return cMinor === rMinor && cPatch >= rPatch;
      }

      // ^0 := >=0.0.0 <1.0.0
      // ^0.0 := >=0.0.0 <0.1.0
      // ^0.0.3 := >=0.0.3 <0.0.4
      const componentCount = getSpecifiedComponentCount(range.raw);

      if (componentCount === 1) {
        return true;
      }

      if (componentCount === 2) {
        return cMinor === 0;
      }

      return cMinor === 0 && cPatch === rPatch;
    }

    case 'tilde': {
      // ~1.2.3 matches 1.2.x where x >= 3
      if (cMajor !== rMajor || cMinor !== rMinor) {
        return false;
      }
      // Client patch must be >= range patch
      return cPatch >= rPatch;
    }

    case 'exact': {
      // Must match exactly
      return cMajor === rMajor && cMinor === rMinor && cPatch === rPatch;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Version Comparison
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compares two parsed versions.
 *
 * @param a - First version
 * @param b - Second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: ParsedVersion, b: ParsedVersion): -1 | 0 | 1 {
  if (a.major !== b.major) {
    return a.major > b.major ? 1 : -1;
  }
  if (a.minor !== b.minor) {
    return a.minor > b.minor ? 1 : -1;
  }
  if (a.patch !== b.patch) {
    return a.patch > b.patch ? 1 : -1;
  }
  return 0;
}

/**
 * Finds the latest version from a list of version strings.
 *
 * @param versions - Array of version strings (may include ^ or ~ prefixes)
 * @returns The latest version string (without prefix) or null if array is empty
 *
 * @example
 * ```ts
 * findLatestVersion(["^1.0.0", "~2.1.0", "3.0.0"]) // "3.0.0"
 * findLatestVersion(["1.0.0", "1.2.0", "1.1.0"])   // "1.2.0"
 * findLatestVersion([])                             // null
 * ```
 */
export function findLatestVersion(versions: readonly string[]): string | null {
  if (versions.length === 0) {
    return null;
  }

  let latest: ParsedVersion | null = null;
  let latestRaw = '';

  for (const version of versions) {
    const range = parseVersionRange(version);
    if (!range) {
      continue;
    }

    if (!latest || compareVersions(range.version, latest) > 0) {
      latest = range.version;
      latestRaw = range.version.raw;
    }
  }

  return latestRaw || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates if a string is a valid version string.
 *
 * @param version - The version string to validate
 * @returns true if valid, false otherwise
 */
export function isValidVersion(version: string): boolean {
  return parseVersion(version) !== null;
}

/**
 * Validates if a string is a valid version range.
 *
 * @param range - The version range string to validate
 * @returns true if valid, false otherwise
 */
export function isValidVersionRange(range: string): boolean {
  return parseVersionRange(range) !== null;
}

/**
 * Normalizes a version string to full semver format.
 *
 * @param version - The version string to normalize
 * @returns The normalized version string or null if invalid
 *
 * @example
 * ```ts
 * normalizeVersion("1")     // "1.0.0"
 * normalizeVersion("1.2")   // "1.2.0"
 * normalizeVersion("1.2.3") // "1.2.3"
 * normalizeVersion("^1.2")  // "1.2.0" (prefix removed)
 * ```
 */
export function normalizeVersion(version: string): string | null {
  const range = parseVersionRange(version);
  if (!range) {
    return null;
  }

  const { major, minor, patch } = range.version;
  return `${major.toString()}.${minor.toString()}.${patch.toString()}`;
}
