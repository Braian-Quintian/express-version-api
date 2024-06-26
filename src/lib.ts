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

/**
 * Executes the default handler if no matching version is found.
 * @param {((req: any, res: any, next: any) => void) | undefined} defaultHandler - The default handler function.
 * @param {VersionHandlers} versionHandlers - The object containing all version handlers.
 * @param {string[]} keys - The keys of all version handlers.
 * @param {any} req - The request object.
 * @param {any} res - The response object.
 * @param {any} next - The next middleware function.
 */
const executeDefaultHandler = (
  defaultHandler: ((req: any, res: any, next: any) => void) | undefined,
  versionHandlers: VersionHandlers,
  keys: string[],
  req: any,
  res: any,
  next: any
): void => {
  // Check if there is a defaultHandler defined and execute it if it exists
  if (defaultHandler) {
    defaultHandler(req, res, next);
  } else {
    // If there is no defaultHandler, determine the most recent version
    const latestVersionKey = findLatestVersion(keys);

    // If the latest version is found and there is a handler for that version, execute it
    if (latestVersionKey && versionHandlers[latestVersionKey]) {
      versionHandlers[latestVersionKey](req, res, next);
    } else {
      // If no valid version is found to handle the request, respond with a 422 error
      res.status(422).send("Unprocessable Entity: No valid handler found for this request.");
    }
  }
};

/**
 * Main middleware that handles version-based routing logic.
 * @param {VersionHandlers} versionHandlers - The object containing all version handlers.
 * @param {((req: any, res: any, next: any) => void) | undefined} defaultHandler - The default handler function.
 * @returns {((req: any, res: any, next: any) => void)} - The middleware function.
 */
const versioningMiddleware = (
  versionHandlers: VersionHandlers,
  defaultHandler?: (req: any, res: any, next: any) => void
): ((req: any, res: any, next: any) => void) => {
  if (
    !versionHandlers ||
    typeof versionHandlers !== "object" ||
    Array.isArray(versionHandlers)
  ) {
    throw new Error(
      "Invalid argument: 'versionHandlers' must be a non-array object."
    );
  } else {
    return (req, res, next) => {
      const clientVersion: string | boolean = extractVersionFromRequest(req);
      const keys: string[] = Object.keys(versionHandlers);

      if (!clientVersion) {
        // Execute the default handler if no version is provided
        return res.status(422).send("Unprocessable Entity: No version provided.");
      }

      for (let i = 0; i < keys.length; i++) {
        const handlerKey: string = keys[i];
        if (
          executeVersionHandler(
            handlerKey,
            clientVersion as string,
            versionHandlers,
            req,
            res,
            next
          )
        ) {
          return;
        }
      }

      // If no matching version is found, execute the default handler
      executeDefaultHandler(
        defaultHandler,
        versionHandlers,
        keys,
        req,
        res,
        next
      );
    };
  }
};

/**
 * Finds the latest version among an array of versions.
 * @param {string[]} versions - The array of version strings.
 * @returns {string | null} - The latest version string, or null if the array is empty.
 */
const findLatestVersion = (versions: string[]): string | null => {
  // Find the latest version among an array of versions
  if (!versions || versions.length === 0) {
    return null;
  }

  const processedVersions: string[][] = versions.map((version) => {
    // Process versions by removing special characters and padding with zeros
    const versionArr: string[] = version.replace(/[\^~]/g, "").split(".");
    for (let i = 0; i < 2; i++) {
      versionArr[i] = versionArr[i] || "0";
    }
    return versionArr;
  });

  // Sort processed versions to find the latest one
  processedVersions.sort((v1Arr, v2Arr) => {
    for (let i = 0; i < 2; i++) {
      if (Number(v1Arr[i]) > Number(v2Arr[i])) {
        return 1;
      } else if (Number(v1Arr[i]) < Number(v2Arr[i])) {
        return -1;
      }
    }
    return 0;
  });

  return processedVersions[processedVersions.length - 1].join(".");
};

// Exporta la función para CommonJS
module.exports = versioningMiddleware;

// Exporta la función como default para ES6 modules
export default versioningMiddleware;
