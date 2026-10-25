type MarkProps = { className?: string; decorative?: boolean };

export function BrandMark({ className, decorative = true }: MarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Journeloom mark"}
    >
      <path d="M32 50C23 43 15.5 43 8.5 45V16C17 14 24 14 32 21V50Z" fill="#E3B492" />
      <path d="M32 50C41 43 48.5 43 55.5 45V16C47 14 40 14 32 21V50Z" fill="#7F998B" />
      <path d="M32 50V21M18 23C24 23 28 26 32 30M46 23C40 23 36 26 32 30M18 31C24 31 28 34 32 38M46 31C40 31 36 34 32 38" stroke="#20313B" strokeWidth="2.1" strokeLinecap="round" />
      <path d="M7.5 50C18.5 46 25.5 47 32 53C38.5 47 45.5 46 56.5 50" stroke="#20313B" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}
