import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

/**
 * An object that maps semantic version strings to specific request handlers.
 *
 * This is the core input to the `versioningMiddleware` function. Each key must be a valid
 * version string, such as `"1.0.0"`, `"^1"`, or `"~2.1"`. These prefixes (`^` and `~`) allow
 * matching of major/minor version ranges, similar to how they work in `package.json`.
 *
 * The value for each key is an Express-compatible handler that should respond to requests
 * targeting that version.
 *
 * @example
 * ```ts
 * const handlers: VersionHandlers = {
 *   "^1": (req, res) => res.send("v1.x handler"),
 *   "~2.1": (req, res) => res.send("v2.1.x handler"),
 *   "3.0.0": (req, res) => res.send("exact v3.0.0 handler"),
 * };
 * ```
 */
export interface VersionHandlers {
  [version: string]: RequestHandler;
}

/**
 * An extended Express `Request` object that optionally includes a `version` property.
 * This allows support for custom middleware.
 */
interface VersionedRequest extends Request {
  version?: string;
}

/**
 * Attempts to extract a semantic version string from an Express request.
 *
 * This function checks the `Request` object for a version identifier in the following order:
 * 1. `req.version` — typically set by middleware.
 * 2. `req.headers['accept-version']` — often provided by clients via HTTP headers.
 *
 * If no version is found, it returns `false`.
 *
 * @param req - The Express request object.
 * @returns The version string (e.g., "1.0.0"), or `false` if none is provided.
 *
 * @example
 * ```ts
 * const version = extractVersionFromRequest(req);
 * if (!version) {
 *   res.status(422).send("No version provided");
 * }
 * ```
 */
export const extractVersionFromRequest = (req: VersionedRequest): string | false => {
  if (!req) return false;

  if (typeof req.version === "string") {
    return req.version;
  }

  const headerVersion = req.headers["accept-version"];
  if (typeof headerVersion === "string") {
    return headerVersion;
  }

  return false;
};

/**
 * Executes a version handler if the client version matches the handler's semantic key.
 *
 * Determines compatibility between the given `handlerKey` (e.g., "^1", "~2.1", "3.0.0")
 * and the `clientVersion` (e.g., "2.1.3") using simplified semantic version matching:
 *
 * - `^1` matches any version starting with "1" (e.g., "1.0.0", "1.9.5")
 * - `~2.1` matches versions like "2.1.x" (e.g., "2.1.0", "2.1.9")
 * - `"3.0.0"` matches exactly "3.0.0"
 *
 * If a match is found, the associated handler from `versionHandlers` is invoked.
 *
 * @param handlerKey - The version key used for comparison (e.g., "^1", "~2.1", "3.0.0").
 * @param clientVersion - The version string from the client request (e.g., "2.1.3").
 * @param versionHandlers - A mapping of version keys to Express request handlers.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The Express next middleware function.
 * @returns `true` if a compatible handler was executed, `false` otherwise.
 */
export const executeVersionHandler = (
  handlerKey: string,
  clientVersion: string,
  versionHandlers: VersionHandlers,
  req: Request,
  res: Response,
  next: NextFunction
): boolean => {
  const [clientMajor = "0", clientMinor = "0", clientPatch = "0"] = clientVersion.split(".");
  let targetVersion: string;
  let requestedVersion: string;

  if (handlerKey.startsWith("~")) {
    // "~2.1" → match major.minor
    targetVersion = handlerKey.slice(1).split(".").slice(0, 2).join(".");
    requestedVersion = `${clientMajor}.${clientMinor}`;
  } else if (handlerKey.startsWith("^")) {
    // "^1" → match major only
    targetVersion = handlerKey.slice(1).split(".")[0];
    requestedVersion = clientMajor;
  } else {
    // Exact match: "2.1.3"
    targetVersion = handlerKey;
    requestedVersion = `${clientMajor}.${clientMinor}.${clientPatch}`;
  }

  const handler = versionHandlers[handlerKey];

  if (requestedVersion === targetVersion && typeof handler === "function") {
    void handler(req, res, next);
    return true;
  }

  return false;
};

/**
 * Executes the default handler when no version match is found.
 *
 * Priority order:
 * 1. If a `defaultHandler` is provided, it is invoked immediately.
 * 2. Otherwise, it tries to find and execute the handler for the latest version available.
 * 3. If none is found, it responds with HTTP 422 and an optional custom error message.
 *
 * This ensures that version-based routing gracefully degrades to a default behavior
 * or returns an informative error if no handler can be determined.
 *
 * @param defaultHandler - Optional fallback Express handler.
 * @param versionHandlers - A map of version keys to handlers.
 * @param keys - An array of version keys from the versionHandlers object.
 * @param req - Express request object.
 * @param res - Express response object.
 * @param next - Express next middleware function.
 * @param notFoundMessage - Optional custom error message for 422 responses.
 */
export const executeDefaultHandler = (
  defaultHandler: RequestHandler | undefined,
  versionHandlers: VersionHandlers,
  keys: string[],
  req: Request,
  res: Response,
  next: NextFunction,
  notFoundMessage = "Unprocessable Entity: No valid version handler available."
): void => {
  // Step 1: Use explicitly provided default handler if available
  if (defaultHandler) {
    void defaultHandler(req, res, next);
    return;
  }

  // Step 2: Ensure there are handlers and version keys to fallback to
  if (!versionHandlers || keys.length === 0) {
    res.status(422).send(notFoundMessage);
    return;
  }

  // Step 3: Attempt to find the most recent version key
  const latestVersionKey = findLatestVersion(keys);
  const fallbackHandler = versionHandlers[latestVersionKey ?? ""];

  // Step 4: Invoke the fallback handler or return an error if none exists
  if (fallbackHandler) {
    void fallbackHandler(req, res, next);
  } else {
    res.status(422).send(notFoundMessage);
  }
};

/**
 * Middleware for handling version-based routing in Express.
 *
 * This middleware inspects the incoming request for a semantic version (e.g., "1.0.0", "~2.1", "^3")
 * and delegates the request to the appropriate handler defined in `versionHandlers`.
 *
 * Matching priority:
 * 1. If a version is found in the request, attempt to match a handler.
 * 2. If no match is found, invoke the `defaultHandler` (if provided).
 * 3. If no default handler exists, fall back to the latest version handler.
 * 4. If none is available, respond with HTTP 422.
 *
 * @param versionHandlers - A map of semantic version keys to Express handlers.
 * @param defaultHandler - Optional fallback handler if no version matches.
 * @returns An Express middleware function.
 *
 * @example
 * ```ts
 * app.use(
 *   versioningMiddleware({
 *     "^1": handlerForV1,
 *     "~2.1": handlerForV2_1,
 *     "3.0.0": handlerForV3
 *   })
 * );
 * ```
 */
export const versioningMiddleware = (
  versionHandlers: VersionHandlers,
  defaultHandler?: RequestHandler
): RequestHandler => {
  if (
    !versionHandlers ||
    typeof versionHandlers !== "object" ||
    Array.isArray(versionHandlers)
  ) {
    throw new Error("Invalid argument: 'versionHandlers' must be a non-array object.");
  }

  return (req, res, next) => {
    const clientVersion = extractVersionFromRequest(req);
    const handlerKeys = Object.keys(versionHandlers);

    // No version provided by the client
    if (!clientVersion) {
      res.status(422).send("Unprocessable Entity: No version provided.");
      return;
    }

    // Try to match a handler by version
    for (const handlerKey of handlerKeys) {
      const matched = executeVersionHandler(
        handlerKey,
        clientVersion,
        versionHandlers,
        req,
        res,
        next
      );
      if (matched) return;
    }

    // Fallback to default or latest handler
    executeDefaultHandler(
      defaultHandler,
      versionHandlers,
      handlerKeys,
      req,
      res,
      next
    );
  };
};

/**
 * Determines the latest semantic version from a list of version strings.
 *
 * This function removes any leading semantic operators (`^`, `~`) and
 * compares versions based on major, minor, and patch numbers.
 *
 * @param versions - An array of version keys, possibly including "^" or "~" prefixes.
 * @returns The latest normalized version string (e.g. "3.2.0"), or `null` if the array is empty.
 *
 * @example
 * ```ts
 * const latest = findLatestVersion(["^1", "~2.3", "3.0.0"]);
 * latest === "3.0.0"
 * ```
 */
export const findLatestVersion = (versions: string[]): string | null => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }

  const normalize = (version: string): number[] => {
    const cleaned = version.replace(/^[\^~]/, "");
    const parts = cleaned.split(".").map((n) => parseInt(n, 10));
    while (parts.length < 3) parts.push(0); // pad missing parts with 0
    return parts.slice(0, 3);
  };

  const sorted = [...versions].sort((a, b) => {
    const [aMajor, aMinor, aPatch] = normalize(a);
    const [bMajor, bMinor, bPatch] = normalize(b);

    if (aMajor !== bMajor) return bMajor - aMajor;
    if (aMinor !== bMinor) return bMinor - aMinor;
    return bPatch - aPatch;
  });

  return sorted.length > 0 ? sorted[0].replace(/^[\^~]/, "") : null;
};

export default versioningMiddleware;
