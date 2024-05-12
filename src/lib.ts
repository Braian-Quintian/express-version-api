/**
 * Interface for version handlers.
 * Each key is a version string and the value is a function to handle requests for that version.
 */
interface VersionHandlers {
  [key: string]: (req: any, res: any, next: any) => void;
}