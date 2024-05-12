/**
 * Interface for version handlers.
 * Each key is a version string and the value is a function to handle requests for that version.
 */
interface VersionHandlers {
  [key: string]: (req: any, res: any, next: any) => void;
}

/**
 * Extracts the version from the request object.
 * @param {any} req - The request object.
 * @returns {string | boolean} - The version string if it exists, otherwise false.
 */
const extractVersionFromRequest = (req: any): string | boolean => {
  return req
    ? req.version
      ? String(req.version)
      : req.headers["accept-version"]
    : false;
};

/**
 * Executes the corresponding version handler if there is a version match.
 * @param {string} handlerKey - The key of the handler to execute.
 * @param {string} clientVersion - The version from the client's request.
 * @param {VersionHandlers} versionHandlers - The object containing all version handlers.
 * @param {any} req - The request object.
 * @param {any} res - The response object.
 * @param {any} next - The next middleware function.
 * @returns {boolean} - True if a matching version handler was executed, otherwise false.
 */
const executeVersionHandler = (
  handlerKey: string,
  clientVersion: string,
  versionHandlers: VersionHandlers,
  req: any,
  res: any,
  next: any
): boolean => {
  let tempKey: string;
  let versionArray: string[] = clientVersion.split(".");
  let tempVersion: string;

  if (handlerKey[0] === "~") {
    // Handling versions using '~'
    tempKey = handlerKey.substring(1).split(".").slice(0, 2).join(".");
    versionArray[1] = versionArray[1] || "0";
    tempVersion = versionArray.slice(0, 2).join(".");
  } else if (handlerKey[0] === "^") {
    // Handling versions using '^'
    tempKey = handlerKey.substring(1).split(".").slice(0, 1).join(".");
    tempVersion = versionArray.slice(0, 1).join(".");
  } else {
    // Standard version handling
    tempKey = handlerKey;
    versionArray[1] = versionArray[1] || "0";
    versionArray[2] = versionArray[2] || "0";
    tempVersion = versionArray.join(".");
  }

  if (tempKey === tempVersion && versionHandlers[handlerKey]) {
    // Call the corresponding version handler if there is a match
    versionHandlers[handlerKey].call(this, req, res, next);
    return true;
  }
  return false;
};