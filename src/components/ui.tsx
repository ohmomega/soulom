import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonTone = "primary" | "quiet" | "danger";

const BUTTON_TONES: Record<ButtonTone, string> = {
  primary: "bg-ember text-night hover:bg-ember-deep disabled:bg-line-strong disabled:text-muted",
  quiet: "border border-line text-cream-soft hover:border-line-strong hover:text-cream disabled:text-muted",
  danger: "border border-clay/50 text-clay hover:bg-clay/10 disabled:opacity-50",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
}

export function Button({ tone = "quiet", className = "", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${BUTTON_TONES[tone]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full items-center justify-center rounded-xl bg-ember px-4 py-3 text-sm font-medium text-night transition-colors hover:bg-ember-deep"
    >
      {children}
    </a>
  );
}

export function TextField({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-line bg-night px-4 py-2.5 text-sm text-cream placeholder:text-muted focus:border-line-strong focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function StatusLine({ tone, children }: { tone: "calm" | "warn"; children: ReactNode }) {
  return (
    <p role="status" className={`text-sm ${tone === "calm" ? "text-sage" : "text-clay"}`}>
      {children}
    </p>
  );
}
