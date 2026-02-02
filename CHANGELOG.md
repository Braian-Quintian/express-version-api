# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of express-version-api
- Semantic versioning support with `^`, `~`, and exact matching
- Multiple version extraction sources (header, query, path, custom)
- Configurable fallback strategies (`latest`, `none`, `default`)
- TypeScript-first implementation with comprehensive type definitions
- Pre-compiled handler matching for optimal performance
- Structured error handling with custom error classes
- Version info attachment to requests
- Request handler validation
- Comprehensive test suite with >90% coverage
- Full API documentation

### Features

- **Version Matching**
  - Caret ranges (`^1.0.0`) for major version compatibility
  - Tilde ranges (`~1.2.0`) for minor version compatibility
  - Exact version matching (`1.2.3`)
  - Priority-based matching (exact > tilde > caret)

- **Version Extraction**
  - HTTP headers (default: `Accept-Version`)
  - Query parameters (configurable)
  - URL path patterns (RegExp-based)
  - Custom extraction functions
  - Multi-source fallthrough with priority

- **Configuration Options**
  - `requireVersion`: Toggle version requirement (default: `true`)
  - `fallbackStrategy`: Choose fallback behavior
  - `defaultHandler`: Custom default handler
  - `attachVersionInfo`: Add version metadata to requests
  - `validateHandlers`: Enable handler validation
  - `errorResponse`: Customize error responses

- **Error Handling**
  - `MISSING_VERSION`: Version header not provided
  - `VERSION_NOT_FOUND`: Requested version not supported
  - `INVALID_VERSION_FORMAT`: Malformed version string
  - `INVALID_CONFIGURATION`: Invalid middleware configuration
  - Custom error handler hook
  - Configurable HTTP status codes
  - Detailed error messages with available versions

- **Developer Experience**
  - Zero runtime dependencies
  - Full TypeScript support
  - Utility functions exported (`parseVersion`, `versionSatisfies`, `isVersioningError`)
  - Backward compatible legacy API
  - Comprehensive JSDoc documentation

### Technical

- Written in TypeScript 5.7 with strict mode
- ESM and CommonJS dual package support
- Modular architecture with separation of concerns
- Pre-compilation of handlers at middleware creation
- Frozen configuration for immutability
- Performance-optimized version matching

---

## [2.0.0] - 2025-02-01

### 🎉 Major Release - Complete Rewrite

This release represents a complete rewrite of the library with significant improvements in architecture, features, and developer experience.

### ⚠️ Breaking Changes

- **Default fallback strategy changed** from `latest` to `none`
  - **Migration**: Explicitly set `fallbackStrategy: 'latest'` if you relied on the old behavior
- **`requireVersion` now defaults to `true`**
  - **Migration**: Set `requireVersion: false` if you want to allow requests without versions
- **Minimum Node.js version** is now 18.0.0 (was 14.0.0)
  - **Migration**: Update your Node.js version to >= 18.0.0

- **Package is now ESM-first** with CommonJS support
  - **Migration**: Use `import` statements or require with `.default` in CommonJS

### Added

- 🎯 Complete semantic versioning implementation
- 🔍 Multiple version extraction sources
- ⚡ Pre-compiled handler matching (significant performance improvement)
- 🛡️ Full TypeScript rewrite with comprehensive types
- 📊 Smart priority-based matching system
- 🔧 15+ configuration options
- 🚨 Structured error handling with custom classes
- 📦 Zero runtime dependencies
- ✅ >90% test coverage
- 📚 Comprehensive documentation

### Changed

- Rewrote entire middleware logic for better performance
- Improved semver matching accuracy (fixed bugs in `^` and `~` operators)
- Enhanced error messages with more context
- Better TypeScript types and inference

### Fixed

- `^` operator now correctly matches only compatible major versions
- `~` operator now correctly matches only compatible minor versions
- Exact version matching now has highest priority
- Version parsing edge cases (leading zeros, missing parts)

### Deprecated

- `createVersionMiddleware` function (use `versioningMiddleware` instead)
  - Still available for backward compatibility

---

## [1.0.0] - 2024-XX-XX

### Added

- Initial basic implementation
- Basic semver support with `^`, `~`, and exact versions
- Header-based version extraction (`Accept-Version`)
- Simple fallback to latest version
- Basic error handling
- Express middleware compatibility
- Jest + Supertest testing

### Notes

This was the initial experimental release. See v2.0.0 for the production-ready version.

---

## Version History

- **v2.0.0** - Production-ready release with complete rewrite
- **v1.0.0** - Initial experimental release

---

## Upgrade Guides

### Upgrading from v1 to v2

#### 1. Update Fallback Strategy

```typescript

```
