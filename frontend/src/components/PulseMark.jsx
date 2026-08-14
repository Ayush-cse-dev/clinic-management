/**
 * PulseMark — the app's signature visual: a single heartbeat trace.
 * Used sparingly: the sidebar logo, the auth screen, and page-header dividers.
 */
export default function PulseMark({ width = 140, height = 28, stroke = "#E96A4C", animated = false }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 14H30L36 4L46 24L54 10L60 14H140"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? "pulse-path" : undefined}
      />
    </svg>
  );
}
