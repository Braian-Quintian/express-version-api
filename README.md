# express-version-api

[![npm version](https://img.shields.io/npm/v/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![npm downloads](https://img.shields.io/npm/dm/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Braian-Quintian/express-version-api/ci.yml?branch=develop)](https://github.com/Braian-Quintian/express-version-api/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Version-aware middleware for Express.js with semantic version matching.

## Installation

```bash
npm install express-version-api
```

Requirements:

- Node.js >= 18
- Express >= 4

## Quick Start

```ts
import express from 'express';
import { versioningMiddleware } from 'express-version-api';

const app = express();

app.use(
  '/api',
  versioningMiddleware({
    '^1': (_req, res) => {
      res.json({ version: '1.x' });
    },
    '^2': (_req, res) => {
      res.json({ version: '2.x' });
    },
    '3.0.0': (_req, res) => {
      res.json({ version: '3.0.0' });
    },
  })
);
```

Request examples:

```bash
curl -H "Accept-Version: 1.2.0" http://localhost:3000/api
curl -H "Accept-Version: 2.5.1" http://localhost:3000/api
curl -H "Accept-Version: 3.0.0" http://localhost:3000/api
```

## Import Modes

ESM:

```ts
import versioningMiddleware, { parseVersion } from 'express-version-api';
```

CommonJS:

```js
const { versioningMiddleware, parseVersion } = require('express-version-api');
```

## Matching Rules

Supported handler keys:

- Exact: `1.2.3`
- Caret: `^1.2.3`
- Tilde: `~1.2.3`

Priority when multiple handlers match:

1. Exact
2. Tilde
3. Caret

Notes:

- Caret behavior for `0.x` follows semver-compatible constraints.
- Versions like `1`, `1.2`, and `1.2.3` are accepted.

## Version Extraction

Default extraction order:

1. Header: `accept-version`
2. Query: `v`

You can configure `header`, `query`, `path`, or `custom` sources.

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

## Configuration

Defaults:

- `requireVersion: true`
- `fallbackStrategy: 'default'`
- `attachVersionInfo: true`
- `validateHandlers: true`
- `errorResponse.missingVersionStatus: 422`
- `errorResponse.versionNotFoundStatus: 422`
- `errorResponse.missingVersionMessage: 'API version is required'`

```ts
interface VersioningOptions {
  extraction?: {
    sources?: Array<'header' | 'query' | 'path' | 'custom'>;
    header?: { name?: string };
    query?: { name?: string };
    path?: { pattern?: RegExp };
    custom?: (req: Request) => string | undefined;
  };
  requireVersion?: boolean;
  fallbackStrategy?: 'latest' | 'none' | 'default';
  defaultHandler?: RequestHandler;
  validateHandlers?: boolean;
  attachVersionInfo?: boolean;
  errorResponse?: {
    missingVersionStatus?: number;
    versionNotFoundStatus?: number;
    missingVersionMessage?: string;
    versionNotFoundMessage?: string | ((version: string) => string);
    includeRequestedVersion?: boolean;
    onError?: (
      error: VersioningError,
      req: Request,
      res: Response,
      next: NextFunction
    ) => boolean | undefined;
  };
}
```

## Fallback Strategies

- `none`: return `VERSION_NOT_FOUND` error.
- `latest`: execute the highest available version handler.
- `default`: execute `defaultHandler` when provided; otherwise falls back to `latest`.

## Error Handling

Error codes:

- `MISSING_VERSION`
- `INVALID_VERSION_FORMAT`
- `VERSION_NOT_FOUND`
- `INVALID_CONFIGURATION`
- `INVALID_HANDLER`

Default error response shape:

```json
{
  "error": "VERSION_NOT_FOUND",
  "message": "No handler found for the requested API version",
  "requestedVersion": "99.0.0",
  "availableVersions": ["^1", "^2"]
}
```

## Version Info Metadata

When `attachVersionInfo` is enabled, the middleware sets `req.versionInfo`:

```ts
{
  requested: string;
  matched: string;
  source: 'header' | 'query' | 'path' | 'custom';
}
```

## API

Main exports:

- `versioningMiddleware`
- `parseVersion`
- `parseVersionRange`
- `versionSatisfies`
- `compareVersions`
- `findLatestVersion`
- `isValidVersion`
- `isValidVersionRange`
- `normalizeVersion`
- `VersioningError`
- `DEFAULT_CONFIG`

## Breaking Changes (v2.0.0)

- Removed legacy `createVersionMiddleware` API.
- CommonJS consumers must use named exports (no default export in CJS).

## Development

```bash
npm install
npm run validate
```

## License

MIT
