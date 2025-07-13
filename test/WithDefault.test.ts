import express, { Request, Response } from "express";
import versionApi from "../src/lib";
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

describe("API Versioning Middleware (Without Default Handler)", () => {
  const app = express();
  app.get(
    "/api",
    versionApi({
      "^1.0.0": handlerV1,
      "~2.0.0": handlerV2,
      "3.0.0": handlerV3,
    })
  );

  it("should match exact version 3.0.0", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "3.0.0");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 3.0.0");
  });

  it("should match version with ^ operator (1.x)", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "1.2.3");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 1.0.0");
  });

  it("should match version with ~ operator (2.0.x)", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "2.0.5");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 2.0.0");
  });

  it("should fallback to latest version when version is unsupported", async () => {
    const res = await request(app).get("/api").set("Accept-Version", "9.9.9");
    expect(res.status).toBe(200);
    expect(res.text).toBe("This is version 3.0.0");
  });

  it("should return 422 when version is missing", async () => {
    const res = await request(app).get("/api");
    expect(res.status).toBe(422);
    expect(res.text).toMatch(/No version provided/i);
  });
});

describe("API Versioning Middleware (With edge cases and Default Handler)", () => {
  it("should use defaultHandler when no version matches", async () => {
    const defaultHandler = (req: Request, res: Response) => {
      res.send("default handler response");
    };

    const appWithDefault = express();
    appWithDefault.get(
      "/api",
      versionApi(
        {
          "^1.0.0": handlerV1,
        },
        defaultHandler
      )
    );

    const res = await request(appWithDefault)
      .get("/api")
      .set("Accept-Version", "9.9.9");

    expect(res.status).toBe(200);
    expect(res.text).toBe("default handler response");
  });

  it("should return 422 when no handlers are defined", async () => {
    const appWithNoHandlers = express();
    appWithNoHandlers.get("/api", versionApi({}));

    const res = await request(appWithNoHandlers)
      .get("/api")
      .set("Accept-Version", "1.0.0");

    expect(res.status).toBe(422);
    expect(res.text).toMatch(/No valid version handler/i);
  });

  it("should return 422 when fallback handler is not defined", async () => {
    const appWithEmptyHandler = express();
    appWithEmptyHandler.get(
      "/api",
      versionApi({
        "3.0.0": undefined as any, // key existe pero no hay handler
      })
    );

    const res = await request(appWithEmptyHandler)
      .get("/api")
      .set("Accept-Version", "2.0.0");

    expect(res.status).toBe(422);
    expect(res.text).toMatch(/No valid version handler/i);
  });
});