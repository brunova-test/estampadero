"use client";

export function ModernSpinner({
  className = "",
  label = "Cargando...",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`modern-spinner ${className}`}
      role="status"
      aria-label={label}
    >
      <span className="modern-spinner__rotor" aria-hidden="true">
        <svg className="modern-spinner__svg" viewBox="0 0 48 48" fill="none">
          <circle
            className="modern-spinner__track"
            cx="24"
            cy="24"
            r="19"
            strokeWidth="4"
          />
          <circle
            className="modern-spinner__arc modern-spinner__arc--primary"
            cx="24"
            cy="24"
            r="19"
            pathLength="1"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="0.66 0.34"
          />
        </svg>
      </span>
      <span
        className="modern-spinner__rotor modern-spinner__rotor--inner"
        aria-hidden="true"
      >
        <svg className="modern-spinner__svg" viewBox="0 0 48 48" fill="none">
          <circle
            className="modern-spinner__arc modern-spinner__arc--secondary"
            cx="24"
            cy="24"
            r="12"
            pathLength="1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="0.42 0.58"
          />
        </svg>
      </span>
      <span className="modern-spinner__core" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
