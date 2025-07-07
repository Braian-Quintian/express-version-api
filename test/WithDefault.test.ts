import express, { Request, Response } from "express";
import versionApi from "../src/lib"; // Usa directamente el código fuente en tests locales
import request from "supertest";

/**
 * Handlers for different versions
 */
const handlerV1: express.RequestHandler = (req, res) => {
  res.send("This is version 1.0.0");
};

const handlerV2: express.RequestHandler = (req, res) => {
  res.send("This is version 2.0.0");
};

const handlerV3: express.RequestHandler = (req, res) => {
  res.send("This is version 3.0.0");
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
    "3.0.0": handlerV3,
  })
);

describe("API Versioning Middleware (Without Default Handler)", () => {
  it("should match exact version 3.0.0", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "3.0.0");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 3.0.0");
  });

  it("should match version with ^ operator (1.x)", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "1.2.3");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 1.0.0");
  });

  it("should match version with ~ operator (2.0.x)", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "2.0.5");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 2.0.0");
  });

  it("should fallback to latest version when version is unsupported", async () => {
    const res = await request(app)
      .get("/api")
      .set("Accept-Version", "9.9.9");

    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 3.0.0");
  });

  it("should return 422 when version is missing", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(422);
    expect(res.text).toMatch(/No version provided/i);
  });
});
