import { Route } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="AI Career OS dashboard"><span className="relative flex size-9 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-sm"><Route className="size-4" aria-hidden="true" /><span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-white/90" /></span><span><span className="block text-sm font-semibold tracking-tight">AI Career OS</span><span className="block text-[10px] font-bold tracking-[0.13em] text-muted-foreground">CAREER INTELLIGENCE</span></span></Link>;
}
