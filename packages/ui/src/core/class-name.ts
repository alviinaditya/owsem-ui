type ClassName<State> = string | ((state: State) => string | undefined) | undefined;

/** Joins class names, skipping empty ones. */
export function joinClass(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Prepends an OwsemUI class to a Base UI `className`. A string stays a string, so props passed
 * from Server Components remain serializable.
 */
export function withClassName<State>(
  base: string,
  className: ClassName<State>,
): string | ((state: State) => string) {
  if (typeof className === "function") return (state) => joinClass(base, className(state));
  return joinClass(base, className);
}
