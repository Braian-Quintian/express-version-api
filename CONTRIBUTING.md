# Contributing to express-version-api

First off, thank you for considering contributing to express-version-api! 🎉

This document provides guidelines and steps for contributing. Following these guidelines helps communicate that you respect the time of the developers managing and developing this open source project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [bquintian.developer@gmail.com](mailto:bquintian.developer@gmail.com).

## Getting Started

### Types of Contributions

There are many ways to contribute:

- 🐛 **Bug Reports**: Found a bug? Open an issue with a clear description
- ✨ **Feature Requests**: Have an idea? We'd love to hear it
- 📝 **Documentation**: Help improve our docs, fix typos, add examples
- 🧪 **Tests**: Add missing tests or improve existing ones
- 💻 **Code**: Fix bugs or implement new features

### First Time Contributors

Look for issues labeled [`good first issue`](https://github.com/Braian-Quintian/express-version-api/labels/good%20first%20issue) - these are specifically curated for new contributors.

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 10.0.0
- Git

### Setup Steps

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/express-version-api.git
   cd express-version-api
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/Braian-Quintian/express-version-api.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Verify setup**

   ```bash
   npm run validate
   ```

   This runs linting, type checking, formatting check, and tests.

## Project Structure

```
express-version-api/
├── src/                    # Source code
│   ├── index.ts           # Main entry point & exports
│   ├── types.ts           # TypeScript type definitions
│   ├── middleware.ts      # Main middleware logic
│   ├── version-parser.ts  # Semver parsing utilities
│   ├── version-extractor.ts # Version extraction from requests
│   ├── handler-compiler.ts # Handler compilation & matching
│   ├── config.ts          # Configuration management
│   └── errors.ts          # Custom error classes
├── test/                   # Test files
├── dist/                   # Compiled output (generated)
├── .github/               # GitHub templates & workflows
└── docs/                  # Documentation (if applicable)
```

## Making Changes

### Branch Naming

Create a branch with a descriptive name:

```bash
# Feature
git checkout -b feat/add-query-param-support

# Bug fix
git checkout -b fix/version-parsing-edge-case

# Documentation
git checkout -b docs/improve-readme-examples

# Refactoring
git checkout -b refactor/simplify-handler-matching
```

### Development Workflow

1. **Sync with upstream**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Make your changes**

   Write code, add tests, update documentation as needed.

3. **Run checks locally**

   ```bash
   # Lint your code
   npm run lint

   # Fix auto-fixable issues
   npm run lint:fix

   # Check types
   npm run typecheck

   # Format code
   npm run format

   # Run tests
   npm test

   # Run all checks
   npm run validate
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
type(scope?): description

[optional body]

[optional footer]
```

### Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Code style changes (formatting, semicolons, etc.)       |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests                                |
| `build`    | Changes to build system or dependencies                 |
| `ci`       | Changes to CI configuration                             |
| `chore`    | Other changes that don't modify src or test files       |
| `revert`   | Reverts a previous commit                               |

### Examples

```bash
# Feature
git commit -m "feat: add support for query parameter version extraction"

# Bug fix with scope
git commit -m "fix(parser): handle versions with leading zeros"

# Breaking change
git commit -m "feat!: change default fallback strategy to 'none'

BREAKING CHANGE: The default fallback strategy has changed from 'latest' to 'none'.
Users relying on the previous default behavior should explicitly set fallbackStrategy: 'latest'."

# With body
git commit -m "docs: add migration guide for v2

- Added step-by-step migration instructions
- Included code examples for common patterns
- Added troubleshooting section"
```

## Pull Request Process

1. **Update your branch**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**

   ```bash
   git push origin your-branch-name
   ```

3. **Open a Pull Request**
   - Use the PR template
   - Link related issues using "Closes #123"
   - Provide a clear description of changes
   - Add screenshots/examples if applicable

4. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Keep the PR focused and small when possible

5. **Merge**

   Once approved, a maintainer will merge your PR.

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Prefer `type` imports: `import type { X } from 'y'`
- Export types explicitly
- Document public APIs with JSDoc comments

### Style Guide

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multiline structures
- Maximum line length: 100 characters

### Best Practices

```typescript
// ✅ Good: Explicit types for public APIs
export function parseVersion(version: string): ParsedVersion | null {
  // ...
}

// ✅ Good: Use type imports
import type { Request, Response } from 'express';

// ✅ Good: Descriptive variable names
const clientVersion = extractVersionFromRequest(req);

// ❌ Bad: Abbreviated or unclear names
const cv = extractVer(req);

// ✅ Good: Early returns for cleaner code
if (!version) {
  return null;
}
// continue with main logic...

// ❌ Bad: Deep nesting
if (version) {
  if (isValid(version)) {
    if (matches(version)) {
      // ...
    }
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in `test/` directory
- Name test files as `*.test.ts`
- Use descriptive test names
- Test edge cases and error conditions

```typescript
describe('parseVersion', () => {
  it('should parse valid semver string', () => {
    const result = parseVersion('1.2.3');
    expect(result).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      raw: '1.2.3',
    });
  });

  it('should return null for invalid version', () => {
    expect(parseVersion('invalid')).toBeNull();
  });

  it('should handle versions with only major number', () => {
    const result = parseVersion('1');
    expect(result?.major).toBe(1);
    expect(result?.minor).toBe(0);
    expect(result?.patch).toBe(0);
  });
});
```

### Coverage Requirements

- Aim for >90% code coverage
- All new features must include tests
- Bug fixes should include regression tests

## Documentation

### Code Documentation

- Add JSDoc comments to all public functions and types
- Include `@example` blocks for complex APIs
- Document parameters and return values

````typescript
/**
 * Parses a semantic version string into its components.
 *
 * @param version - The version string to parse (e.g., "1.2.3")
 * @returns The parsed version object, or null if invalid
 *
 * @example
 * ```ts
 * const v = parseVersion('1.2.3');
 * console.log(v.major); // 1
 * ```
 */
export function parseVersion(version: string): ParsedVersion | null {
  // ...
}
````

### README Updates

When adding features, update the README with:

- New API documentation
- Usage examples
- Any breaking changes

## Getting Help

- 💬 [GitHub Discussions](https://github.com/Braian-Quintian/express-version-api/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/Braian-Quintian/express-version-api/issues) - Report bugs
- 📧 [Email](mailto:bquintian.developer@gmail.com) - Direct contact

---

Thank you for contributing! 🙏
