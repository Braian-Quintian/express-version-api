import express, { Request, Response } from "express";
import versionApi from "../dist/index"; // Import the express-version-api library for API versioning
import request from "supertest"; // Import supertest for making HTTP requests in testing

// Define route handlers for different API versions
function functionV1(req: Request, res: Response) {
  res.send("This is version 1.0.0"); // Response for API version 1.0.0
}

function functionV2(req: Request, res: Response) {
  res.send("This is version 2.0.0"); // Response for API version 2.0.0
}

function functionV3(req: Request, res: Response) {
  res.send("This is version 3.0.0"); // Response for API version 3.0.0
}

// Configure Express application and apply versionApi middleware with version-specific route handlers
const app = express();
app.get(
  "/api",
  versionApi({
    "^1.0.0": functionV1, // Route handler for API version 1.X.X (Caret (^) Operator indicates compatible with version 1.0.0 up to, but not including, 2.0.0)
    "~2.0.0": functionV2, // Route handler for API version 2.0.X (Tilde (~) Operator indicates compatible with version 2.0.0 up to, but not including, 2.1.0)
    "3.0.0": functionV3, // Route handler for API version 3.0.0 (Exact Version)
  })
);

// Integration tests to verify the versionApi middleware's routing based on API version
describe("API Versioning Middleware", () => {
  it("should use the latest version if version not explicitly defined", async () => {
    // If a version is not explicitly defined, the latest version (3.0.0) should be used
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "4.0.0");
    expect(response.status).toBe(200);
    expect(response.text).toBe("This is version 3.0.0");
  });

  it("should handle an unsupported API version gracefully", async () => {
    // If an unsupported version is requested, the middleware should still respond with the latest supported version (3.0.0)
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "4.0.0");
    expect(response.status).toBe(200);
    expect(response.text).toBe("This is version 3.0.0");
  });
});