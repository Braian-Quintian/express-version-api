import { expectError, expectType } from 'tsd';
import type { NextFunction, RequestHandler, Response } from 'express';
import {
  isVersioningError,
  parseVersion,
  parseVersionRange,
  versioningMiddleware,
  versionSatisfies,
} from '..';
import type {
  ParsedVersion,
  VersionHandlers,
  VersionedRequestHandler,
  VersionedRequest,
  VersioningErrorCode,
  VersioningOptions,
} from '..';

// ─────────────────────────────────────────────────────────────────────────────
// Middleware function types
// ─────────────────────────────────────────────────────────────────────────────

const handlers: VersionHandlers = {
  '^1': ((_req: VersionedRequest, res: Response) => {
    res.send('v1');
  }) as VersionedRequestHandler,
  '2.0.0': ((_req: VersionedRequest, res: Response) => {
    res.send('v2');
  }) as VersionedRequestHandler,
};

expectType<RequestHandler>(versioningMiddleware(handlers));
expectType<RequestHandler>(versioningMiddleware(handlers, { fallbackStrategy: 'latest' }));

expectError(versioningMiddleware('invalid'));
expectError(versioningMiddleware([]));

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

expectError<VersioningOptions>({
  fallbackStrategy: 'invalid',
});

expectError<VersioningOptions>({
  extraction: {
    sources: ['invalid'],
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
const range = parseVersionRange('^1.0.0');

if (!range) {
  throw new Error('Expected valid range');
}

expectType<boolean>(versionSatisfies(version, range));
expectError(versionSatisfies('1.2.3', range));
expectError(versionSatisfies(version, 123));

// ─────────────────────────────────────────────────────────────────────────────
// Error type guard
// ─────────────────────────────────────────────────────────────────────────────

const error: unknown = new Error('test');

if (isVersioningError(error)) {
  expectType<VersioningErrorCode>(error.code);
  expectType<number>(error.statusCode);
  expectType<string | undefined>(error.requestedVersion);
}

// ─────────────────────────────────────────────────────────────────────────────
// VersionedRequest
// ─────────────────────────────────────────────────────────────────────────────

function handler(req: VersionedRequest, _res: Response, _next: NextFunction): void {
  expectType<string | undefined>(req.version);

  if (req.versionInfo) {
    expectType<string>(req.versionInfo.requested);
    expectType<string>(req.versionInfo.matched);
    expectType<'header' | 'query' | 'path' | 'custom'>(req.versionInfo.source);
  }
}

void handler;
