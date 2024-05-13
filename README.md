# Express version api

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Braian-Quintian/express-version-routes?tab=MIT-1-ov-file#readme)

Express version api is a simple library that allows you to create versioned routes in your Express.js application. It provides a middleware function that allows you to define different route handlers based on the requested API version. This can be useful when you need to maintain multiple versions of an API and serve different responses based on the version number specified by the client.

**🛑Note:** This library is intended for personal use and experimentation, and is **_not recommended_** for production environments or widespread adoption.

# 🚧 Under Development 🚧

**This library is actively being developed. Improvements and new features are added regularly. As such, there's no stable version and changes are frequent. Please consider this when using the library.**

## Installation

```bash
npm install express-version-api
```

## Disclaimer

**⚠️ Disclaimer: This library is intended for personal use and experimentation. While it is released under the MIT license, allowing anyone to use and modify it, please note the following considerations:**

- **Not Recommended for Production:** This library is designed for educational and personal use. It is not optimized for production environments or widespread adoption. Use in production settings is discouraged.

- **Limited Support and Maintenance:** As this is a personal project, there may be limited ongoing support or maintenance. Contributors are welcome, but please manage expectations accordingly.

- **Not a Replacement for Established Libraries:** This library is not intended to replace established or widely used libraries for API versioning in production applications. Consider using dedicated solutions with robust community support for production environments.

---

## Usage

> You can use the `versionApi` middleware to create versioned routes in your Express.js application. The `versionApi` middleware accepts an object with the following properties:

- `version` (string): The version of the API.
- `function` (function): The function that will be called when the route is accessed.

> Follows semver versioning format. Supports '^, ~' symbols for matching version numbers.

### Example basic:

```javascript
const express = require("express");
const versionApi = require("express-version-api");
const app = express();

// Define your route with versioned handlers
app.get(
  "/api",
  versionApi({
    "1.0.0": functionV1, // Route handler for API version 1.0.0
    "2.0.0": functionV2, // Route handler for API version 2.0.0
  })
);

// Handler for version 1.0.0
function functionV1(req, res) {
  res.send("This is version 1.0.0"); // Sends a response for API version 1.0.0
}

// Handler for version 2.0.0
function functionV2(req, res) {
  res.send("This is version 2.0.0"); // Sends a response for API version 2.0.0
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

### Example using '^, ~' semver symbols:

> The `^` symbol is used to match the specified version and any minor or patch updates. The `~` symbol is used to match the specified version and any patch updates.

**Caret Operator** **_(^)_**: Matches the specified version and any minor or patch updates. For example, `^1.0.0` will match `1.0.0`, `1.1.0`, `1.1.1`, etc., but not `2.0.0`.

**Tilde Operator** **_(~)_**: Matches the specified version and any patch updates. For example, ~1.0.0 will match `1.0.0`, `1.0.1`, `1.0.2`, etc., but not `1.1.0`.

```javascript
const express = require("express");
const versionApi = require("express-version-api");
const app = express();

// Define your route with versioned handlers
app.get(
  "/api",
  versionApi({
    "^1.0.0": functionV1, // Route handler for API version 1.X.X Caret Operator
    "~2.0.0": functionV2, // Route handler for API version 2.0.X Tilde Operator
  })
);

// Handler for version 1.0.0
function functionV1(req, res) {
  res.send("This is version 1.0.0"); // Sends a response for API version 1.X.X
}

// Handler for version 2.0.0
function functionV2(req, res) {
  res.send("This is version 2.0.0"); // Sends a response for API version 2.0.X
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

### Versioning via Headers

To specify the desired API version, clients should include the `Accept-Version` header in their requests with the version number they want to access. Here's an example of how to set the Accept-Version header using curl:

```bash
curl -H "Accept-Version: 1.0.0" http://localhost:3000/api
```

In this example, the server will invoke functionV1 when the request specifies Accept-Version: 1.0.0 and functionV2 when Accept-Version: 2.0.0 is specified.

Make sure to handle the Accept-Version header appropriately in your middleware or route handlers to serve the correct API version based on client preferences.

## Running Tests

This library uses Jest for testing. To run the tests, you can use the following command:

```bash
  npm run test
```

---

## Roadmap

- Added support for semver features🌟
- Enhanced support for APIs starting with v1🌟
- Add more integrations and examples🌟

### Development Status

This library is currently under active development. We are continuously working on improving and adding new features to enhance its functionality.

## Contributing

We welcome contributions! If you're interested in improving this library or adding new features, we'd love to receive your contributions.

## Feedback

If you have any feedback, please reach out to us at bquintian.developer@gmail.com
