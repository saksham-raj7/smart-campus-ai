import { Sparkles } from "lucide-react";
import Link from "next/link";

export function Brand() {
  return <Link href="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="AI Career OS dashboard"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-4" aria-hidden="true" /></span><span><span className="block text-sm font-semibold tracking-tight">AI Career OS</span><span className="block text-[11px] font-medium tracking-wide text-muted-foreground">CAREER INTELLIGENCE</span></span></Link>;
}
