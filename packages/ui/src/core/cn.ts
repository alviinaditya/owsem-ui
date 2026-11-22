/** Joins class names, skipping empty ones. Same call shape as the `cn` package of the Tailwind flavor. */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(" ");
}
