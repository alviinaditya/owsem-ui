type ClassName<State> = string | ((state: State) => string | undefined) | undefined;

const join = (base: string, extra: string | undefined): string =>
  extra ? `${base} ${extra}` : base;

/**
 * Prepends an OwsemUI class to a Base UI `className`. A string stays a string, so props passed
 * from Server Components remain serializable.
 */
export function withClassName<State>(
  base: string,
  className: ClassName<State>,
): string | ((state: State) => string) {
  if (typeof className === "function") return (state) => join(base, className(state));
  return join(base, className);
}
