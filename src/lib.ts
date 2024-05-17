interface VersionFunctions {
  [version: string]: (req: any, res: any) => void;
}

// Función para obtener la versión aceptada del encabezado
const getAcceptedVersion = (req: any): string | undefined => {
  return req.headers["accept-version"];
};

interface ObjectVersions {
  [key: string]: any;
}

const handleTildeVersion = (acceptVersion: any, versionKey: string) => {
  console.log("Contains ~");
  versionKey.split("~").forEach((version) => {
    if (version == acceptVersion) {
      return version;
    }
  });
};

const handleCaretVersion = (versionKey: string) => {
  console.log("Contains ^");
  // Aquí puedes agregar la lógica específica para manejar versiones ^
};

const handleMatchSemver = (
  acceptVersion: string | undefined,
  objectVersions: ObjectVersions
) => {
  console.log("acceptVersion", acceptVersion);
  console.log("objectVersions", objectVersions);

  for (const versionKey in objectVersions) {
    if (Object.prototype.hasOwnProperty.call(objectVersions, versionKey)) {
      if (versionKey.includes("~")) {
        const versionObtain = handleTildeVersion(acceptVersion, versionKey);
        return versionObtain;
      } else if (versionKey.includes("^")) {
        handleCaretVersion(versionKey);
      } else {
        // Si la versión no contiene ~ ni ^, puede ser una coincidencia directa
        if (acceptVersion === versionKey) {
          return versionKey; // Retorna la versión coincidente
        }
      }
    }
  }

  return undefined; // Si no se encuentra ninguna coincidencia
};

// Función para manejar la llamada a la función correspondiente según la versión aceptada
const handleVersionRequest = (
  req: any,
  res: any,
  versions: VersionFunctions
) => {
  const versionsKeys = Object.keys(versions);
  // Verifica si hay versiones disponibles
  if (versionsKeys.length === 0) {
    res.send({ status: 422, message: "No hay versiones disponibles." });
    return;
  }

  const acceptVersion = getAcceptedVersion(req);
  // Verifica si se definió el accept-version
  if (acceptVersion) {
    const matchSemver = handleMatchSemver(acceptVersion, versions);
    if (matchSemver !== undefined && versions[matchSemver]) {
      versions[matchSemver](req, res); // Ejecuta la versión coincidente
    } else {
      // Si no hay coincidencia, utiliza la versión más reciente
      const latestVersion = versionsKeys[versionsKeys.length - 1];
      versions[latestVersion](req, res);
    }
  } else {
    // Si no se definió el accept-version, utiliza la versión más reciente
    const latestVersion = versionsKeys[versionsKeys.length - 1];
    versions[latestVersion](req, res);
  }
};

// Middleware de versionApi
const versionApi = (versions: VersionFunctions) => {
  return (req: any, res: any) => {
    try {
      handleVersionRequest(req, res, versions);
    } catch (error) {
      res.send({
        status: 500,
        message: "There was an error processing the request.",
      });
    }
  };
};

// Exporta la función para CommonJS
module.exports = versionApi;

// Exporta la función como default para ES6 modules
export default versionApi;