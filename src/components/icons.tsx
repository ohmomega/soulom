import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconFrame({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MoonMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" {...props}>
      <path
        d="M20.8 6.4a10 10 0 1 0 4.8 15.9A8.4 8.4 0 0 1 20.8 6.4Z"
        fill="currentColor"
      />
      <circle cx="23.4" cy="9.6" r="1.4" fill="var(--color-ember)" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </IconFrame>
  );
}

export function KeepsakeIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 4v5h8V4" />
      <path d="M9 15h6" />
    </IconFrame>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M5 12h12" />
      <path d="m12 6 6 6-6 6" />
    </IconFrame>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </IconFrame>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M6.5 4h3l1.5 4-2 1.2a10 10 0 0 0 5.8 5.8L16 13l4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4Z" />
    </IconFrame>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </IconFrame>
  );
}
