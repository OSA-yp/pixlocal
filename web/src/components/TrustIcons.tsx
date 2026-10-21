type IconProps = { className?: string };

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9.5 12l1.8 1.8L15 10" />
    </svg>
  );
}

export function DeviceTrustIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M10 18h4" />
    </svg>
  );
}

export function CloudOffIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.5 18a4.5 4.5 0 0 1-.4-9 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 18 18H7.5z" />
      <path d="M5 5l14 14" />
    </svg>
  );
}

export function SignalOffIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 20h.01" />
      <path d="M5.5 16.5a6 6 0 0 1 2-1.5" />
      <path d="M9 12a10 10 0 0 1 3.5-2" />
      <path d="M12.5 7.5a14 14 0 0 1 5.5-1.5" />
      <path d="M5 5l14 14" />
    </svg>
  );
}

export function NoAdsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h4M7 14h2" />
      <path d="M15 9l4 6M19 9l-4 6" />
    </svg>
  );
}

export function VaultIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v6" />
    </svg>
  );
}

const TRUST_ICONS = [
  DeviceTrustIcon,
  SignalOffIcon,
  NoAdsIcon,
  VaultIcon,
] as const;

export function TrustItemIcon({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  const Icon = TRUST_ICONS[index] ?? ShieldIcon;
  return <Icon className={className} />;
}
