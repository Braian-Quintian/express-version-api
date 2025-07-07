# 📦 express-version-api

[![npm version](https://img.shields.io/npm/v/express-version-api.svg)](https://www.npmjs.com/package/express-version-api)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Braian-Quintian/express-version-api/test.yml)](https://github.com/Braian-Quintian/express-version-api/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Coverage Status](https://img.shields.io/codecov/c/github/Braian-Quintian/express-version-api)](https://codecov.io/gh/Braian-Quintian/express-version-api)
[![Node.js](https://img.shields.io/badge/node-%3E=14.0.0-brightgreen)](https://nodejs.org)

> Versioned routing middleware for Express.js based on semantic versioning (`semver`).

---

**⚠️ NOTE:** This package is intended for personal use and experimentation. It is **not recommended** for production use.

---

## 🚧 Project Status

This library is under **active development**. Features and improvements are being added frequently. Use at your own discretion in unstable environments.

---

## ✨ Features

- ✅ Version-based routing (`^`, `~`, exact versions)
- ✅ Automatic fallback to default or latest version
- ✅ Fully compatible with Express middleware
- ✅ Well-tested with Jest and Supertest

---

## 📦 Installation

```bash
npm install express-version-api
```

---

## 🚀 Quick Usage

```js
const express = require("express");
const versionApi = require("express-version-api");
const app = express();

const handlerV1 = (req, res) => res.send("This is version 1.0.0");
const handlerV2 = (req, res) => res.send("This is version 2.0.0");

app.get(
  "/api",
  versionApi({
    "1.0.0": handlerV1,
    "2.0.0": handlerV2,
  })
);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

## 🎯 Semver Support (`^`, `~`)

| Symbol | Matches                    | Example Matches    |
| ------ | -------------------------- | ------------------ |
| `^`    | Major-compatible (`1.x.x`) | `^1.0.0` → `1.2.3` |
| `~`    | Minor-compatible (`2.1.x`) | `~2.1.0` → `2.1.4` |
| Exact  | Exact version only         | `3.0.0` → `3.0.0`  |

```js
app.get(
  "/api",
  versionApi({
    "^1.0.0": handlerV1,
    "~2.1.0": handlerV2,
    "3.0.0": handlerV3,
  })
);
```

---

## 📥 Version Header

Clients should include the `Accept-Version` HTTP header in requests:

```bash
curl -H "Accept-Version: 1.0.0" http://localhost:3000/api
```

---

## 🧪 Running Tests

```bash
npm run test
```

Tests are powered by [Jest](https://jestjs.io/) and [Supertest](https://github.com/visionmedia/supertest). Full coverage is included.

---

## 🧩 API

### `versionApi(handlers, defaultHandler?)`

- `handlers`: Object with semver-style version strings as keys and Express handlers as values.
- `defaultHandler`: Optional fallback if no version matches.

```js
app.get(
  "/api",
  versionApi({
    "^1.0.0": v1Handler,
    "~2.0.0": v2Handler,
    "3.0.0": v3Handler,
  }, fallbackHandler)
);
```

---

## 🔄 Fallback Strategy

If the version is not matched:

1. Use `defaultHandler` if defined
2. Otherwise, fallback to the latest available handler
3. If no handler matches, return `422 Unprocessable Entity`

---

## 📚 Examples

Check the `test/` directory for integration examples and how `^`, `~` and fallbacks work in practice.

---

## 🛣️ Roadmap

- [x] Basic versioning with `^`, `~`, exact
- [x] Default and latest fallback
- [ ] Advanced semver range support (planned)
- [ ] Improved validation and DX
- [ ] Full ESM and CJS dual package
- [ ] Typed handler inference with TypeScript

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Contact: [bquintian.developer@gmail.com](mailto:bquintian.developer@gmail.com)

---

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
