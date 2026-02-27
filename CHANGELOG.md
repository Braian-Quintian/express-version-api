# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.7] - 2026-02-27

### Fixed

- Validated `fallbackStrategy` at config time and added defensive handling for unsupported values.
- Fixed async `defaultHandler` error propagation to Express (`next(error)`), avoiding hung requests and unhandled rejections.
- Corrected caret semantics for `0.x` ranges (for example, `^0.2.3` no longer matches `0.9.0`).
- Applied `errorResponse.missingVersionMessage` in runtime responses.
- Fixed path extraction with global/sticky regex by resetting `lastIndex`.
- Preserved the real extraction source in `req.versionInfo` during fallback flows.

### Changed

- `test:types` now runs against `test-types/**/*.test-d.ts` and is enforced in `validate` and CI.
- CI workflows now target `develop` and `main`; PR checks compare against the actual base branch.
- `npm test` no longer collects coverage by default.
- Pre-commit hook now runs `lint-staged` instead of the full test suite.
- Coverage files were removed from git tracking and are ignored by default.
- Moved TypeScript incremental build info out of distributable outputs.
- Removed unused dev dependencies (`@types/semver`, `ts-node`).
- Split ESM/CJS build entrypoints to remove the mixed default+named CJS warning while keeping default export support for ESM.

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
  - **Migration**: Use `import` statements or named exports when using CommonJS

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
