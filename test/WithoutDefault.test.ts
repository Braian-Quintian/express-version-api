import express, { Request, Response, RequestHandler } from "express";
import versionApi, { findLatestVersion } from "../src/lib"; // Asegúrate de exportar findLatestVersion desde lib
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
    const res = await request(app).get("/api").set("Accept-Version", "1.0.0");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 1.0.0");
  });

  it("should match version 1.x.x with ^ operator", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "1.2.3");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 1.0.0");
  });

  it("should match version 2.0.0 with ~ operator", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "2.0.0");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 2.0.0");
  });

  it("should match version 2.0.x with ~ operator", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "2.0.5");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 2.0.0");
  });

  it("should return 422 when version is unsupported", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "4.0.0");
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

/**
 * Validation tests for versionHandlers input
 */
describe("Middleware Input Validation", () => {
  it("should throw if versionHandlers is null, array or invalid type", () => {
    expect(() => versionApi(null as any)).toThrow(
      "Invalid argument: 'versionHandlers' must be a non-array object."
    );
    expect(() => versionApi([] as any)).toThrow();
    expect(() => versionApi("invalid" as any)).toThrow();
  });
});

/**
 * Unit tests for findLatestVersion
 */
describe("findLatestVersion", () => {
  it("should return null for non-array input", () => {
    expect(findLatestVersion(null as any)).toBeNull();
    expect(findLatestVersion(undefined as any)).toBeNull();
    expect(findLatestVersion([])).toBeNull();
  });

  it("should return latest version by major > minor > patch", () => {
    const versions = ["^1.0.0", "~2.3.1", "3.0.0", "2.4.0"];
    const result = findLatestVersion(versions);
    expect(result).toBe("3.0.0");
  });

  it("should handle missing patch numbers (pad with 0)", () => {
    const versions = ["1.2", "1.2.1", "1.1"];
    const result = findLatestVersion(versions);
    expect(result).toBe("1.2.1");
  });

  it("should correctly compare when major is equal but minor is different", () => {
    const versions = ["2.1.0", "2.3.0", "2.2.0"];
    const result = findLatestVersion(versions);
    expect(result).toBe("2.3.0");
  });

  it("should strip prefix symbols from returned version", () => {
    const versions = ["^2.1.0", "~2.0.0", "1.9.9"];
    const result = findLatestVersion(versions);
    expect(result).toBe("2.1.0");
  });
});