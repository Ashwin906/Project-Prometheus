export function Mark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2 19h7v-5.5h6.5V8H22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      <circle cx="9" cy="13.5" r="1.3" fill="currentColor" />
      <circle cx="15.5" cy="8" r="1.3" fill="currentColor" />
    </svg>
  );
}
