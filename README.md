# express-version-api

[![npm version](https://img.shields.io/npm/v/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![npm downloads](https://img.shields.io/npm/dm/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Braian-Quintian/express-version-api/ci.yml?branch=develop)](https://github.com/Braian-Quintian/express-version-api/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Version-aware middleware for Express.js APIs with semantic version matching.

## Why use this

- Routes requests by semantic version (`exact`, `~`, `^`).
- Supports extraction from header, query, path, or custom function.
- Handles missing or unmatched versions with configurable fallback strategies.
- Exposes `req.versionInfo` metadata for observability and debugging.
- Fully typed for TypeScript projects.

## Installation

### npm

```bash
npm install express-version-api
```

### JSR

```bash
deno add jsr:@braian-quintian/express-version-api
```

Requirements:

- Node.js >= 18
- Express >= 4

## Quick Start

```ts
import express from 'express';
import { versioningMiddleware } from 'express-version-api';

const app = express();

app.get(
  '/api/users',
  versioningMiddleware({
    '^1': (_req, res) => res.json({ version: '1.x', users: [] }),
    '^2': (_req, res) => res.json({ version: '2.x', users: [], meta: { total: 0 } }),
    '3.0.0': (_req, res) => res.json({ version: '3.0.0', users: [], paging: null }),
  })
);

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: error.message });
});
```

Request examples:

```bash
curl -H "Accept-Version: 1.2.0" http://localhost:3000/api/users
curl -H "Accept-Version: 2.5.1" http://localhost:3000/api/users
curl -H "Accept-Version: 3.0.0" http://localhost:3000/api/users
```

## Import Modes

ESM (default + named):

```ts
import versioningMiddleware, { parseVersion } from 'express-version-api';
```

CommonJS (named only):

```js
const { versioningMiddleware, parseVersion } = require('express-version-api');
```

## Version Matching Rules

Supported handler keys:

- Exact: `1.2.3`
- Caret: `^1`, `^1.2`, `^1.2.3`
- Tilde: `~1.2`, `~1.2.3`

Matching priority when multiple handlers match:

1. Exact
2. Tilde
3. Caret

Semantics:

- Exact: must match the same `major.minor.patch`.
- Tilde (`~`): same major and minor, patch must be `>=` requested patch.
- Caret (`^`): semver-compatible range.
- Caret with `0.x` follows strict semver-compatible behavior.

Examples:

- `^1.2.3` matches `1.2.3`, `1.3.0`, `1.9.9`, but not `2.0.0`.
- `^0.2.3` matches `0.2.3` to `0.2.x`, but not `0.3.0`.
- `~2.1.4` matches `2.1.4` to `2.1.x`, but not `2.2.0`.

## How Version Extraction Works

The middleware resolves version in this order:

1. `req.version` if already set by upstream middleware (source = `custom`)
2. Configured extraction sources in order (`extraction.sources`)

Default source order:

1. Header: `accept-version`
2. Query: `v`

You can configure `header`, `query`, `path`, and `custom` extractors.

```ts
versioningMiddleware(
  {
    '^1': v1Handler,
    '^2': v2Handler,
  },
  {
    extraction: {
      sources: ['header', 'query', 'path', 'custom'],
      header: { name: 'x-api-version' },
      query: { name: 'version' },
      path: { pattern: /\/api\/v(\d+(?:\.\d+)?(?:\.\d+)?)\// },
      custom: (req) => (req.hostname.startsWith('v2.') ? '2.0.0' : undefined),
    },
  }
);
```

## Fallback Strategies

Fallback is used when no handler matches, and also when version is missing with `requireVersion: false`.

- `none`: respond with `VERSION_NOT_FOUND`.
- `latest`: execute the handler with the highest available version.
- `default`: execute `defaultHandler` if provided, otherwise fallback to `latest`.

```ts
versioningMiddleware(handlers, {
  fallbackStrategy: 'default',
  defaultHandler: (_req, res) => {
    res.status(200).json({ fallback: true });
  },
});
```

## Error Handling

Error codes emitted by the middleware:

- `MISSING_VERSION`
- `INVALID_VERSION_FORMAT`
- `VERSION_NOT_FOUND`
- `INVALID_CONFIGURATION`
- `INVALID_HANDLER`

Default status codes:

- Missing version: `422`
- Version not found: `422`
- Invalid version format: `400`

Default response shape:

```json
{
  "error": "VERSION_NOT_FOUND",
  "message": "No handler found for the requested API version",
  "requestedVersion": "99.0.0",
  "availableVersions": ["^1", "^2"]
}
```

Configure custom messages/statuses and override handling via `onError`:

```ts
versioningMiddleware(handlers, {
  errorResponse: {
    missingVersionStatus: 400,
    missingVersionMessage: 'Version header is required',
    versionNotFoundMessage: (version) => `Version ${version} is not supported`,
    onError: (error, _req, res) => {
      if (error.code === 'INVALID_VERSION_FORMAT') {
        res.status(400).json({ code: error.code, detail: error.message });
        return true;
      }
      return false;
    },
  },
});
```

## Request Metadata (`req.versionInfo`)

When `attachVersionInfo` is `true`, the middleware adds:

```ts
{
  requested: string;
  matched: string;
  source: 'header' | 'query' | 'path' | 'custom';
}
```

Notes:

- `source` preserves the real extraction source, including fallback scenarios.
- When no version was provided and fallback is used, `versionInfo` is not attached because `requested` is undefined.

## Runtime Defaults

```ts
{
  extraction: {
    sources: ['header', 'query'],
    header: { name: 'accept-version' },
    query: { name: 'v' },
    path: { pattern: /\/v(\d+(?:\.\d+)?(?:\.\d+)?)\// },
    custom: undefined
  },
  errorResponse: {
    missingVersionStatus: 422,
    versionNotFoundStatus: 422,
    missingVersionMessage: 'API version is required',
    versionNotFoundMessage: 'No handler found for the requested API version',
    includeRequestedVersion: true,
    onError: undefined
  },
  fallbackStrategy: 'default',
  defaultHandler: undefined,
  validateHandlers: true,
  attachVersionInfo: true,
  requireVersion: true
}
```

## Public API

Main middleware:

- `versioningMiddleware`

Error helpers:

- `VersioningError`
- `createMissingVersionError`
- `createVersionNotFoundError`
- `createInvalidVersionFormatError`
- `createInvalidHandlerError`
- `createInvalidConfigurationError`
- `isVersioningError`
- `hasErrorCode`

Version utilities:

- `parseVersion`
- `parseVersionRange`
- `versionSatisfies`
- `compareVersions`
- `findLatestVersion`
- `isValidVersion`
- `isValidVersionRange`
- `normalizeVersion`

Config export:

- `DEFAULT_CONFIG`

## Breaking Changes (v2)

- Removed legacy `createVersionMiddleware` API.
- CommonJS default export was removed; CJS must use named imports.

## Development

```bash
npm install
npm run validate
```

Main scripts:

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test`
- `npm run test:coverage`
- `npm run build`
- `npm run test:types`

## License

MIT
