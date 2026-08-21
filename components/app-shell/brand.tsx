import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = { size?: "sm" | "md" | "lg"; variant?: "icon" | "wordmark" | "full"; className?: string };
const sizes = { sm: "size-8", md: "size-9", lg: "size-11" };

export function SkilloraLogo({ size = "md", variant = "wordmark", className }: LogoProps) {
  return <span className={cn("inline-flex items-center gap-2.5", className)}><span className={cn("brand-mark relative grid shrink-0 place-items-center rounded-xl", sizes[size])}><svg viewBox="0 0 32 32" className="size-[72%]" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="10.5" stroke="currentColor" strokeWidth="1.6" opacity=".8"/><path d="M11 21 17.7 9.5l3.3 6.7L11 21Z" fill="currentColor"/><path d="M7.5 11.5 11 14m10-3 3.5-2m-1 12-4-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="7.5" cy="11.5" r="1.5" fill="currentColor"/><circle cx="24.5" cy="9" r="1.5" fill="currentColor"/><circle cx="23.5" cy="21" r="1.5" fill="currentColor"/><path d="m25.5 4 .55 1.45L27.5 6l-1.45.55L25.5 8l-.55-1.45L23.5 6l1.45-.55L25.5 4Z" fill="currentColor"/></svg></span>{variant !== "icon" && <span><span className="block text-sm font-bold tracking-[-.04em] text-current">Skillora</span>{variant === "full" && <span className="block text-[9px] font-semibold tracking-[.08em] text-muted-foreground">AI-POWERED CAREER INTELLIGENCE</span>}</span>}</span>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/dashboard" className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Skillora dashboard"><SkilloraLogo variant={compact ? "icon" : "full"} /></Link>;
}
