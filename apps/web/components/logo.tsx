import { cn } from "@/lib/utils";

/** Brand mark: an apricot arch (a bending body) with a dot on pine green. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <rect width="512" height="512" rx="120" fill="#115d4d" />
      <path d="M140 356c0-150 232-150 232 0" fill="none" stroke="#f5ac69" strokeWidth="48" strokeLinecap="round" />
      <circle cx="256" cy="166" r="38" fill="#f5ac69" />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3 text-lg font-extrabold tracking-tight", className)}>
      <LogoMark />
      <span>{name}</span>
    </span>
  );
}
