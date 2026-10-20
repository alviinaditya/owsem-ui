/** The OwsemUI mark: the rail's origin ring on an accent tile. Decorative, beside the name. */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg className="logo" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="7" fill="var(--docs-accent)" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="var(--docs-on-accent)" strokeWidth="2.5" />
    </svg>
  );
}
