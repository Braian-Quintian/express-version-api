import express, { Request, Response, RequestHandler } from "express";
import versionApi from "../src/lib"; // Usa el middleware directamente desde el código fuente
import request from "supertest";

/**
 * Handlers for different versions
 */
const handlerV1: RequestHandler = (req, res) => {
  res.send("This is version 1.0.0");
};

const handlerV2: RequestHandler = (req, res) => {
  res.send("This is version 2.0.0");
};

/**
 * Create an express app with the versioning middleware
 */
const app = express();
app.get(
  "/api",
  versionApi({
    "^1.0.0": handlerV1,
    "~2.0.0": handlerV2,
  })
);

/**
 * Integration tests for express-version-api middleware (with limited versions)
 */
describe("API Versioning Middleware (With Versions Only)", () => {
  it("should match exact version 1.0.0", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "1.0.0");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 1.0.0");
  });

  it("should match version 1.x.x with ^ operator", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "1.2.3");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 1.0.0");
  });

  it("should match version 2.0.0 with ~ operator", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "2.0.0");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 2.0.0");
  });

  it("should match version 2.0.x with ~ operator", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "2.0.5");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 2.0.0");
  });

  it("should return 422 when version is unsupported", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "4.0.0");

    expect(res.status).toBe(422);
    expect(res.text).toBe(
      "Unprocessable Entity: No valid version handler available."
    );
  });

  it("should return 422 when Accept-Version is missing", async () => {
    const res = await request(app).get("/api");

    expect(res.status).toBe(422);
    expect(res.text).toBe("Unprocessable Entity: No version provided.");
  });
});
