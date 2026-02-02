# express-version-api

[![npm version](https://img.shields.io/npm/v/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![npm downloads](https://img.shields.io/npm/dm/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Braian-Quintian/express-version-api/ci.yml?branch=main)](https://github.com/Braian-Quintian/express-version-api/actions)
[![codecov](https://codecov.io/gh/Braian-Quintian/express-version-api/branch/main/graph/badge.svg)](https://codecov.io/gh/Braian-Quintian/express-version-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/node-%3E=18.0.0-brightgreen)](https://nodejs.org)

> 🎯 **Professional API versioning middleware for Express.js with semantic versioning support**

A robust, TypeScript-first middleware that enables semantic versioning in your Express.js applications. Route requests to different handlers based on client-requested API versions using semver ranges.

---

## ✨ Features

- 🎯 **Semantic Versioning**: Full semver support with `^`, `~`, and exact version matching
- 🔍 **Multiple Version Sources**: Extract versions from headers, query params, URL paths, or custom functions
- ⚡ **High Performance**: Pre-compiled handler matching for zero runtime overhead
- 🛡️ **Type-Safe**: Written in TypeScript with comprehensive type definitions
- 🎨 **Flexible Configuration**: 15+ options to customize behavior
- 📊 **Smart Fallback Strategies**: Choose from `latest`, `none`, or custom `default` handlers
- 🔧 **Structured Errors**: Custom error classes with proper HTTP status codes
- 📦 **Zero Dependencies**: Lightweight with no external runtime dependencies
- ✅ **Well Tested**: >90% code coverage with comprehensive test suite
- 🔄 **Backward Compatible**: Supports legacy API while providing modern features

---

## 📦 Installation

```bash
# npm
npm install express-version-api

# yarn
yarn add express-version-api

# pnpm
pnpm add express-version-api
```

**Requirements:**

- Node.js >= 18.0.0
- Express >= 4.0.0

---

## 🚀 Quick Start

### Basic Usage

```typescript
import express from 'express';
import { versioningMiddleware } from 'express-version-api';

const app = express();

// Define handlers for different versions
const v1Handler = (req, res) => res.json({ version: '1.x', message: 'Hello from v1' });
const v2Handler = (req, res) => res.json({ version: '2.x', message: 'Hello from v2' });
const v3Handler = (req, res) => res.json({ version: '3.x', message: 'Hello from v3' });

// Apply versioning middleware
app.use(
  '/api',
  versioningMiddleware({
    '^1': v1Handler, // Matches 1.0.0, 1.2.3, 1.9.9 (but not 2.0.0)
    '^2': v2Handler, // Matches 2.0.0, 2.5.1 (but not 3.0.0)
    '3.0.0': v3Handler, // Exact match only
  })
);

app.listen(3000, () => {
  console.log('API server running on http://localhost:3000');
});
```

### Making Requests

```bash
# Request v1 API
curl -H "Accept-Version: 1.0.0" http://localhost:3000/api
# → { "version": "1.x", "message": "Hello from v1" }

# Request v2 API
curl -H "Accept-Version: 2.1.0" http://localhost:3000/api
# → { "version": "2.x", "message": "Hello from v2" }

# Request v3 API (exact match)
curl -H "Accept-Version: 3.0.0" http://localhost:3000/api
# → { "version": "3.x", "message": "Hello from v3" }
```

---

## 📖 Documentation

### Table of Contents

- [Semver Matching](#-semver-matching)
- [Version Extraction](#-version-extraction)
- [Configuration Options](#%EF%B8%8F-configuration-options)
- [Fallback Strategies](#-fallback-strategies)
- [Error Handling](#-error-handling)
- [TypeScript Support](#-typescript-support)
- [Advanced Usage](#-advanced-usage)
- [API Reference](#-api-reference)

---

## 🎯 Semver Matching

The middleware supports three types of version matching:

| Pattern   | Symbol | Matches                       | Example                                |
| --------- | ------ | ----------------------------- | -------------------------------------- |
| **Caret** | `^`    | Compatible with major version | `^1.2.3` → `1.2.3`, `1.9.9` ❌ `2.0.0` |
| **Tilde** | `~`    | Compatible with minor version | `~1.2.3` → `1.2.3`, `1.2.9` ❌ `1.3.0` |
| **Exact** | none   | Exact version only            | `1.2.3` → `1.2.3` only                 |

### Priority Order

When multiple handlers could match a version, the middleware uses this priority:

1. **Exact matches** (e.g., `3.0.0`)
2. **Tilde ranges** (e.g., `~2.1.0`)
3. **Caret ranges** (e.g., `^1.0.0`)

```typescript
app.use(
  '/api',
  versioningMiddleware({
    '^1': handlerCaret, // Priority: 3
    '~1.2': handlerTilde, // Priority: 2
    '1.2.3': handlerExact, // Priority: 1 (highest)
  })
);

// Request with version 1.2.3 → handlerExact (exact match wins)
```

---

## 🔍 Version Extraction

### Default: Header-based

By default, the version is extracted from the `Accept-Version` header:

```bash
curl -H "Accept-Version: 1.0.0" http://localhost:3000/api
```

### Multiple Sources

Configure multiple sources with priority ordering:

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      extraction: {
        sources: ['header', 'query', 'path'], // Try in order

        // Custom header name
        header: {
          name: 'X-API-Version',
        },

        // Query parameter
        query: {
          name: 'version', // ?version=1.0.0
        },

        // URL path pattern
        path: {
          pattern: /\/api\/v(\d+)/, // /api/v1/users
        },
      },
    }
  )
);
```

**Examples:**

```bash
# Header (default)
curl -H "Accept-Version: 1.0.0" http://localhost:3000/api

# Query parameter
curl http://localhost:3000/api?version=2.0.0

# URL path
curl http://localhost:3000/api/v1/users
```

### Custom Extraction

Provide your own extraction logic:

```typescript
app.use(
  '/api',
  versioningMiddleware(
    { '^1': v1Handler, '^2': v2Handler },
    {
      extraction: {
        sources: ['custom'],
        custom: (req) => {
          // Extract from subdomain: v1.api.example.com
          const subdomain = req.hostname.split('.')[0];
          if (subdomain.startsWith('v')) {
            return subdomain.slice(1) + '.0.0'; // v1 → 1.0.0
          }
          return null;
        },
      },
    }
  )
);
```

---

## ⚙️ Configuration Options

### Complete Options Interface

```typescript
interface VersioningOptions {
  // Version extraction
  extraction?: {
    sources?: Array<'header' | 'query' | 'path' | 'custom'>;
    header?: { name?: string };
    query?: { name?: string };
    path?: { pattern?: RegExp };
    custom?: (req: Request) => string | null;
  };

  // Version requirement
  requireVersion?: boolean; // Default: true

  // Fallback behavior
  fallbackStrategy?: 'latest' | 'none' | 'default'; // Default: 'none'
  defaultHandler?: RequestHandler;

  // Metadata
  attachVersionInfo?: boolean; // Default: false

  // Validation
  validateHandlers?: boolean; // Default: true

  // Error responses
  errorResponse?: {
    missingVersionStatus?: number; // Default: 400
    versionNotFoundStatus?: number; // Default: 404
    invalidVersionFormatStatus?: number; // Default: 422

    versionNotFoundMessage?: string | ((version: string) => string);
    includeRequestedVersion?: boolean; // Default: true

    onError?: (
      error: VersioningError,
      req: Request,
      res: Response,
      next: NextFunction
    ) => boolean | void;
  };
}
```

### Common Configurations

#### 1. Production API (Strict Versioning)

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      requireVersion: true,
      fallbackStrategy: 'none',
      errorResponse: {
        versionNotFoundMessage: (v) => `API version ${v} is not supported`,
      },
    }
  )
);
```

#### 2. Development API (Flexible)

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      requireVersion: false,
      fallbackStrategy: 'latest',
      attachVersionInfo: true, // Adds req.versionInfo
    }
  )
);
```

#### 3. Multi-source with Custom Handler

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      extraction: {
        sources: ['header', 'query', 'path'],
      },
      fallbackStrategy: 'default',
      defaultHandler: (req, res) => {
        res.json({
          message: 'Please specify an API version',
          availableVersions: ['1.x', '2.x'],
        });
      },
    }
  )
);
```

---

## 🔄 Fallback Strategies

### `none` (Default)

Returns 404 error when version doesn't match:

```typescript
app.use('/api', versioningMiddleware({ '^1': v1Handler }, { fallbackStrategy: 'none' }));

// Request with version 2.0.0 → 404 Not Found
```

### `latest`

Uses the highest available version:

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler, // 1.0.0
      '^2': v2Handler, // 2.0.0
      '^3': v3Handler, // 3.0.0 (latest)
    },
    { fallbackStrategy: 'latest' }
  )
);

// Request with version 99.0.0 → v3Handler (latest)
```

### `default`

Uses a custom default handler:

```typescript
const defaultHandler = (req, res) => {
  res.status(200).json({
    message: 'Using default API version',
    version: 'latest',
  });
};

app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      fallbackStrategy: 'default',
      defaultHandler,
    }
  )
);

// Request with version 99.0.0 → defaultHandler
```

---

## 🚨 Error Handling

### Built-in Error Types

```typescript
class VersioningError extends Error {
  code: string;
  statusCode: number;
  requestedVersion?: string;
  availableVersions?: readonly string[];
}

// Error codes:
// - MISSING_VERSION
// - VERSION_NOT_FOUND
// - INVALID_VERSION_FORMAT
// - INVALID_CONFIGURATION
```

### Custom Error Handler

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      errorResponse: {
        onError: (error, req, res, next) => {
          // Log to monitoring service
          console.error('Versioning error:', error.code, error.message);

          // Custom response
          if (error.code === 'VERSION_NOT_FOUND') {
            res.status(error.statusCode).json({
              error: 'UnsupportedVersion',
              message: `Version ${error.requestedVersion} is deprecated`,
              supportedVersions: error.availableVersions,
              upgradeGuide: 'https://docs.example.com/migration',
            });
            return true; // Handled
          }

          // Fall back to default error handler
          return false;
        },
      },
    }
  )
);
```

### Error Response Examples

```json
// Missing version (400)
{
  "error": "MISSING_VERSION",
  "message": "API version is required"
}

// Version not found (404)
{
  "error": "VERSION_NOT_FOUND",
  "message": "Version 5.0.0 is not supported",
  "requestedVersion": "5.0.0",
  "availableVersions": ["^1", "^2", "^3"]
}

// Invalid format (422)
{
  "error": "INVALID_VERSION_FORMAT",
  "message": "Version 'invalid' is not a valid semantic version",
  "requestedVersion": "invalid"
}
```

---

## 📘 TypeScript Support

### Full Type Safety

```typescript
import type {
  VersionHandlers,
  VersioningOptions,
  VersionedRequest,
  VersionInfo,
  ParsedVersion,
} from 'express-version-api';

// Type-safe handlers
const handlers: VersionHandlers = {
  '^1': v1Handler,
  '^2': v2Handler,
};

// Type-safe options
const options: VersioningOptions = {
  fallbackStrategy: 'latest',
  attachVersionInfo: true,
};

// Access version info in handlers
app.use('/api', versioningMiddleware({ '^1': v1Handler }, { attachVersionInfo: true }));

function v1Handler(req: VersionedRequest, res: Response) {
  // req.versionInfo is typed
  console.log(req.versionInfo?.requested); // "1.2.3"
  console.log(req.versionInfo?.matched); // "^1"
  console.log(req.versionInfo?.source); // "header"
}
```

### Type Guards

```typescript
import { isVersioningError } from 'express-version-api';

app.use((error, req, res, next) => {
  if (isVersioningError(error)) {
    // error is typed as VersioningError
    console.log(error.code);
    console.log(error.requestedVersion);
  }
  next(error);
});
```

---

## 🔧 Advanced Usage

### Version Info Attachment

```typescript
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      attachVersionInfo: true, // Adds req.versionInfo
    }
  )
);

function v1Handler(req: VersionedRequest, res: Response) {
  res.json({
    data: { message: 'Hello' },
    meta: {
      apiVersion: req.versionInfo?.matched,
      requestedVersion: req.versionInfo?.requested,
      versionSource: req.versionInfo?.source,
    },
  });
}

// Response:
// {
//   "data": { "message": "Hello" },
//   "meta": {
//     "apiVersion": "^1",
//     "requestedVersion": "1.2.3",
//     "versionSource": "header"
//   }
// }
```

### Combining with Express Router

```typescript
import { Router } from 'express';
import { versioningMiddleware } from 'express-version-api';

// Version-specific routers
const v1Router = Router();
v1Router.get('/users', (req, res) => res.json({ version: 1, users: [] }));
v1Router.post('/users', (req, res) => res.json({ version: 1, created: true }));

const v2Router = Router();
v2Router.get('/users', (req, res) => res.json({ version: 2, users: [] }));
v2Router.post('/users', (req, res) => res.json({ version: 2, created: true }));

// Apply versioning to route
app.use(
  '/api',
  versioningMiddleware({
    '^1': v1Router,
    '^2': v2Router,
  })
);
```

### Middleware Chaining

```typescript
// Authentication middleware
const authenticate = (req, res, next) => {
  // Auth logic
  next();
};

// Apply versioning after auth
app.use(
  '/api',
  authenticate,
  versioningMiddleware({
    '^1': v1Handler,
    '^2': v2Handler,
  })
);
```

### Version Deprecation

```typescript
const deprecatedHandler = (req, res, next) => {
  res.setHeader('Warning', '299 - "API version 1.x is deprecated. Please upgrade to 2.x"');
  res.setHeader('Sunset', 'Sat, 31 Dec 2024 23:59:59 GMT');
  v1Handler(req, res, next);
};

app.use(
  '/api',
  versioningMiddleware({
    '^1': deprecatedHandler,
    '^2': v2Handler,
  })
);
```

---

## 📚 API Reference

### Exported Functions

#### `versioningMiddleware(handlers, options?)`

Creates the versioning middleware.

**Parameters:**

- `handlers: VersionHandlers` - Object mapping version strings to handlers
- `options?: VersioningOptions` - Configuration options

**Returns:** `RequestHandler`

**Example:**

```typescript
const middleware = versioningMiddleware(
  { '^1': v1Handler, '^2': v2Handler },
  { fallbackStrategy: 'latest' }
);
```

---

#### `createVersionMiddleware(handlers, defaultHandler?)` (Deprecated)

Legacy API for backward compatibility.

**Parameters:**

- `handlers: VersionHandlers` - Version handlers
- `defaultHandler?: RequestHandler` - Optional fallback handler

**Returns:** `RequestHandler`

**Example:**

```typescript
// Legacy usage (deprecated)
const middleware = createVersionMiddleware({ '^1': v1Handler }, fallbackHandler);

// Recommended migration
const middleware = versioningMiddleware(
  { '^1': v1Handler },
  { defaultHandler: fallbackHandler, fallbackStrategy: 'default' }
);
```

---

### Utility Functions

#### `parseVersion(version: string): ParsedVersion | null`

Parses a semantic version string.

```typescript
import { parseVersion } from 'express-version-api';

const parsed = parseVersion('1.2.3');
// → { major: 1, minor: 2, patch: 3, raw: '1.2.3' }

parseVersion('invalid'); // → null
```

---

#### `versionSatisfies(version: ParsedVersion, range: string): boolean`

Checks if a version satisfies a semver range.

```typescript
import { parseVersion, versionSatisfies } from 'express-version-api';

const version = parseVersion('1.2.3');

versionSatisfies(version, '^1.0.0'); // → true
versionSatisfies(version, '~1.2.0'); // → true
versionSatisfies(version, '1.2.3'); // → true
versionSatisfies(version, '^2.0.0'); // → false
```

---

#### `isVersioningError(error: unknown): error is VersioningError`

Type guard for versioning errors.

```typescript
import { isVersioningError } from 'express-version-api';

app.use((error, req, res, next) => {
  if (isVersioningError(error)) {
    // Handle versioning errors
    console.log(error.code, error.statusCode);
  }
  next(error);
});
```

---

## 🧪 Testing

### Test Your Versioned API

```typescript
import request from 'supertest';
import express from 'express';
import { versioningMiddleware } from 'express-version-api';

describe('API Versioning', () => {
  const app = express();

  app.use(
    '/api',
    versioningMiddleware({
      '^1': (req, res) => res.json({ version: 1 }),
      '^2': (req, res) => res.json({ version: 2 }),
    })
  );

  it('should route to v1 handler', async () => {
    const response = await request(app).get('/api').set('Accept-Version', '1.0.0').expect(200);

    expect(response.body.version).toBe(1);
  });

  it('should route to v2 handler', async () => {
    const response = await request(app).get('/api').set('Accept-Version', '2.0.0').expect(200);

    expect(response.body.version).toBe(2);
  });

  it('should return 404 for unsupported version', async () => {
    await request(app).get('/api').set('Accept-Version', '99.0.0').expect(404);
  });
});
```

---

## 🎯 Migration Guide

### From v1 to v2

**Breaking Changes:**

1. **Default fallback strategy changed** from `latest` to `none`
2. **`requireVersion` now defaults to `true`**
3. **Handler compilation** is now pre-computed (performance improvement)

**Migration Steps:**

```typescript
// v1 (old)
app.use(
  '/api',
  versioningMiddleware({
    '^1': v1Handler,
    '^2': v2Handler,
  })
);
// → Implicitly used 'latest' fallback

// v2 (new - explicit fallback)
app.use(
  '/api',
  versioningMiddleware(
    {
      '^1': v1Handler,
      '^2': v2Handler,
    },
    {
      fallbackStrategy: 'latest', // Explicit
    }
  )
);
```

---

## 📊 Performance

### Benchmarks

The middleware uses **pre-compilation** to achieve zero runtime overhead:

- ✅ Handlers are compiled and sorted once at startup
- ✅ Version parsing is memoized
- ✅ Matching uses optimized algorithms (exact → tilde → caret)

**Benchmark results** (100,000 requests):

```
Exact match:     ~0.02ms per request
Range match:     ~0.05ms per request
Fallback:        ~0.03ms per request
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md).

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Braian-Quintian/express-version-api.git
cd express-version-api

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build
npm run build

# Validate everything
npm run validate
```

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by API versioning best practices
- Built with [Express.js](https://expressjs.com/)
- Follows [Semantic Versioning](https://semver.org/)

---

## 📧 Contact

**Braian Quintián**

- GitHub: [@Braian-Quintian](https://github.com/Braian-Quintian)
- Email: [bquintian.developer@gmail.com](mailto:bquintian.developer@gmail.com)

---

## 🌟 Show Your Support

If you find this project helpful, please consider giving it a ⭐️ on [GitHub](https://github.com/Braian-Quintian/express-version-api)!

---

**Made with ❤️ by Braian Quintián**
