import express, { Request, Response } from "express";
import versionApi from "express-version-api"; // Importing the express-version-api library
import request from "supertest"; // Importing supertest for making HTTP requests to the Express app

// Defining handlers for API versions 1.0.0 and 2.0.0
function functionV1(req: Request, res: Response) {
  res.send("This is version 1.0.0");
}

function functionV2(req: Request, res: Response) {
  res.send("This is version 2.0.0");
}

// Setting up the Express application and applying the versionApi middleware with specified versions
const app = express();
app.get(
  "/api",
  versionApi({
    "^1.0.0": functionV1, // Route handler for API version 1.X.X (Caret (^) Operator used)
    "~2.0.0": functionV2, // Route handler for API version 2.0.X (Tilde (~) Operator used)
  })
);

// Integration tests to verify routing based on API version
describe("API Versioning Middleware", () => {
  it("should handle API version 1.0.0 with caret operator", async () => {
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "1.0.0");
    expect(response.status).toBe(200);
    expect(response.text).toBe("This is version 1.0.0");
  });

  it("should handle API version 1.x.x with caret operator", async () => {
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "1.1.0");
    expect(response.status).toBe(200);
    expect(response.text).toBe("This is version 1.0.0"); // functionV1 is used for any 1.x.x version
  });

  it("should handle API version 2.0.0 with tilde operator", async () => {
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "2.0.0");
    expect(response.status).toBe(200);
    expect(response.text).toBe("This is version 2.0.0");
  });

  it("should handle API version 2.0.x with tilde operator", async () => {
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "2.0.1");
    expect(response.status).toBe(200);
    expect(response.text).toBe("This is version 2.0.0"); // functionV2 is used for any 2.0.x version
  });

  it("should use the latest version if version not explicitly defined", async () => {
    // If a version is not explicitly defined, the latest version (2.0.0) should be used
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "4.0.0");
    expect(response.status).toBe(422);
    expect(response.text).toBe(
      "Unprocessable Entity: No valid handler found for this request."
    );
  });

  it("should handle an unsupported API version gracefully", async () => {
    const response = await request(app)
      .get("/api")
      .set("Accept-Version", "4.0.0");
    expect(response.status).toBe(422);
    expect(response.text).toBe(
      "Unprocessable Entity: No valid handler found for this request."
    );
  });

  it("should use the latest version as default if Accept-Version header is missing", async () => {
    // Sending a GET request to /api without the Accept-Version header
    const response = await request(app).get("/api");

    // The response status should be 422 (Unprocessable Entity)
    expect(response.status).toBe(422);

    // The response body should be "Unprocessable Entity: No version provided."
    expect(response.text).toBe("Unprocessable Entity: No version provided.");
  });
});
