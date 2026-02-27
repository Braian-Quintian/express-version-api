# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.4] - 2026-02-27

### Added

- Added `jsr.json` configuration and JSR package metadata.
- Added JSR publication support for `@braian-quintian/express-version-api`.

### Changed

- Updated repository documentation to match the current runtime behavior and exports.
- Hardened release automation to validate npm authentication before publish.

### Fixed

- Fixed `.npmrc` token interpolation to use `NODE_AUTH_TOKEN` in CI.
- Fixed GitHub Packages publication flow by using scoped package publish in workflow.

## [2.0.3] - 2026-02-27

### Changed

- Updated release workflow with explicit npm authentication verification.

## [2.0.0] - 2026-02-27

### Removed

- Removed deprecated `createVersionMiddleware` API.
- Removed CommonJS default export path; CJS now uses named exports only.

### Changed

- `test:types` now validates `test-types/**/*.test-d.ts` and runs in `validate`/CI.
- CI now targets `develop` and `main`, and PR checks use the actual base branch.
- `npm test` no longer writes coverage artifacts by default.
- Pre-commit hook now runs `lint-staged`.
- TypeScript incremental metadata moved outside publish output.
- Removed unused dev dependencies: `@types/semver`, `ts-node`.
- Updated README and package docs to match runtime behavior.

### Fixed

- `fallbackStrategy` is now validated at config resolution.
- Async `defaultHandler` errors are forwarded to Express `next(error)`.
- Caret matching for `0.x` follows semver-compatible constraints.
- `missingVersionMessage` from config is now applied in responses.
- Path extraction is stable with global/sticky regex (`lastIndex` handling).
- `req.versionInfo.source` now preserves the original extraction source in fallback paths.

## [1.0.6] - 2025-02-01

### Added

- Stable baseline release published to npm.
