import { expectType, expectError } from 'tsd';
import type { Request, Response, NextFunction } from 'express';
import {
  versioningMiddleware,
  parseVersion,
  versionSatisfies,
  isVersioningError,
} from '../src/index.js';
import type {
  VersionHandlers,
  VersioningOptions,
  ParsedVersion,
  VersionedRequest,
} from '../src/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Middleware function types
// ─────────────────────────────────────────────────────────────────────────────

const handlers: VersionHandlers = {
  '^1': (_req: any, res: any) => res.send('v1'),
  '2.0.0': (_req: any, res: any) => res.send('v2'),
};

// Should accept handlers only
expectType<any>(versioningMiddleware(handlers));

// Should accept handlers with options
expectType<any>(versioningMiddleware(handlers, { fallbackStrategy: 'latest' }));

// Should error on invalid handlers type
expectError(versioningMiddleware('invalid' as any));
expectError(versioningMiddleware([] as any));

// ─────────────────────────────────────────────────────────────────────────────
// Options type checking
// ─────────────────────────────────────────────────────────────────────────────

const validOptions: VersioningOptions = {
  requireVersion: true,
  fallbackStrategy: 'latest',
  validateHandlers: true,
  attachVersionInfo: false,
  extraction: {
    sources: ['header', 'query'],
    header: { name: 'X-Version' },
  },
};

expectType<VersioningOptions>(validOptions);

// Should error on invalid fallback strategy
expectError<VersioningOptions>({
  fallbackStrategy: 'invalid' as any,
});

// Should error on invalid source
expectError<VersioningOptions>({
  extraction: {
    sources: ['invalid' as any],
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ParseVersion utility
// ─────────────────────────────────────────────────────────────────────────────

const parsed = parseVersion('1.2.3');
expectType<ParsedVersion | null>(parsed);

if (parsed) {
  expectType<number>(parsed.major);
  expectType<number>(parsed.minor);
  expectType<number>(parsed.patch);
  expectType<string>(parsed.raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// VersionSatisfies utility
// ─────────────────────────────────────────────────────────────────────────────

const version: ParsedVersion = { major: 1, minor: 2, patch: 3, raw: '1.2.3' };
const range = { type: 'caret' as const, version: { major: 1, minor: 0, patch: 0, raw: '1.0.0' }, raw: '^1.0.0' };
expectType<boolean>(versionSatisfies(version, range));

// Should error on invalid arguments
expectError(versionSatisfies('1.2.3' as any, range));
expectError(versionSatisfies(version, 123 as any));

// ─────────────────────────────────────────────────────────────────────────────
// Error type guard
// ─────────────────────────────────────────────────────────────────────────────

const error: unknown = new Error('test');

if (isVersioningError(error)) {
  expectType<string>(error.code);
  expectType<number>(error.statusCode);
  expectType<string | undefined>(error.requestedVersion);
}

// ─────────────────────────────────────────────────────────────────────────────
// VersionedRequest
// ─────────────────────────────────────────────────────────────────────────────

function handler(req: VersionedRequest, res: Response, next: NextFunction) {
  expectType<string | undefined>(req.version);

  if (req.versionInfo) {
    expectType<string>(req.versionInfo.requested);
    expectType<string>(req.versionInfo.matched);
    expectType<'header' | 'query' | 'path' | 'custom'>(req.versionInfo.source);
  }
}
