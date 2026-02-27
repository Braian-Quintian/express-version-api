import { parseVersion, parseVersionRange, versionSatisfies } from '../src/version-parser.js';

function parseVersionOrThrow(version: string) {
  const parsed = parseVersion(version);
  if (!parsed) {
    throw new Error(`Expected version to be valid: ${version}`);
  }
  return parsed;
}

function parseRangeOrThrow(range: string) {
  const parsed = parseVersionRange(range);
  if (!parsed) {
    throw new Error(`Expected range to be valid: ${range}`);
  }
  return parsed;
}

describe('versionSatisfies - caret semantics for 0.x', () => {
  it('should not match ^0.2.3 with 0.9.0', () => {
    const client = parseVersionOrThrow('0.9.0');
    const range = parseRangeOrThrow('^0.2.3');

    expect(versionSatisfies(client, range)).toBe(false);
  });

  it('should match ^0.2.3 with 0.2.5', () => {
    const client = parseVersionOrThrow('0.2.5');
    const range = parseRangeOrThrow('^0.2.3');

    expect(versionSatisfies(client, range)).toBe(true);
  });

  it('should only match exact patch for ^0.0.3', () => {
    const range = parseRangeOrThrow('^0.0.3');

    expect(versionSatisfies(parseVersionOrThrow('0.0.3'), range)).toBe(true);
    expect(versionSatisfies(parseVersionOrThrow('0.0.4'), range)).toBe(false);
  });

  it('should keep broad behavior for ^0', () => {
    const range = parseRangeOrThrow('^0');

    expect(versionSatisfies(parseVersionOrThrow('0.0.1'), range)).toBe(true);
    expect(versionSatisfies(parseVersionOrThrow('0.9.0'), range)).toBe(true);
    expect(versionSatisfies(parseVersionOrThrow('1.0.0'), range)).toBe(false);
  });
});
