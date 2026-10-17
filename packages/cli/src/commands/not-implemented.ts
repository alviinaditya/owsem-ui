/** Exits with 1 so scripts never treat a missing command as success. */
export function notImplemented(command: string): never {
  console.error(`owsem ${command} is not available in this version yet.`);
  process.exit(1);
}
