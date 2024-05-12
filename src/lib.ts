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