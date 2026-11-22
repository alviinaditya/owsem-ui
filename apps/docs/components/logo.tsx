import { useId } from "react";

const GLASSES = [
  "M26.4 17.6H38.2C40.6 17.6 42 19.2 42 21.6C42 26.4 38.8 29.9 34.6 29.9C30.4 29.9 26 26.2 25.6 20.4C25.5 18.8 25.6 17.6 26.4 17.6Z",
  "M21.6 17.6H9.8C7.4 17.6 6 19.2 6 21.6C6 26.4 9.2 29.9 13.4 29.9C17.6 29.9 22 26.2 22.4 20.4C22.5 18.8 22.4 17.6 21.6 17.6Z",
  "M40.6 18.5H44.3C45 18.5 45.5 19 45.5 19.6C45.5 20.2 45 20.7 44.3 20.7H40.6Z",
  "M7.4 18.5H3.7C3 18.5 2.5 19 2.5 19.6C2.5 20.2 3 20.7 3.7 20.7H7.4Z",
  "M21.4 17.6H26.6V19.2H21.4Z",
];

/** The OwsemUI mascot: a blob in aviators. Decorative, beside the name; animated via `.logo-*` CSS. */
export function Logo({ size = 28 }: { size?: number }) {
  const clipId = `logo-clip-${useId().replace(/[^A-Za-z0-9_-]/g, "")}`;
  return (
    <svg
      className="logo"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={clipId}>
        {GLASSES.map((d) => (
          <path key={d} d={d} />
        ))}
      </clipPath>
      <g className="logo-squash">
        <path
          className="logo-body"
          d="M24 6.5C34.5 6.5 42 14.5 42 25C42 35.5 35.5 42 24 42C12.5 42 6 35.5 6 25C6 14.5 13.5 6.5 24 6.5Z"
        />
        <g className="logo-face">
          {[17.4, 30.6].map((cx) => (
            <g key={cx} className="logo-eye">
              <circle className="logo-paper" cx={cx} cy="23.2" r="3.4" />
              <circle className="logo-pupil" cx={cx} cy="23.6" r="1.8" />
            </g>
          ))}
          <path
            className="logo-mouth"
            d="M21.14 32.14C23.05 33.71 24.95 33.71 26.86 32.14C27.22 31.85 27.76 31.9 28.06 32.26C28.35 32.62 28.3 33.16 27.94 33.46C25.31 35.62 22.69 35.62 20.06 33.46C19.7 33.16 19.65 32.62 19.94 32.26C20.24 31.9 20.78 31.85 21.14 32.14Z"
          />
        </g>
      </g>
      <g className="logo-drop">
        <g className="logo-shades">
          <g className="logo-glass">
            {GLASSES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <path className="logo-bridge" d="M22.1 23.1Q24 20.7 25.9 23.1" />
          <g clipPath={`url(#${clipId})`}>
            <g className="logo-glint">
              <path d="M-8 15h5l-7 16h-5zM-0.5 15h1.8l-7 16h-1.8z" fill="#fff" fillOpacity=".6" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
