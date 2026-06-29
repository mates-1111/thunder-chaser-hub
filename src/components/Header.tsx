import { Link } from "@tanstack/react-router";
import { Shield, Zap, Facebook } from "lucide-react";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-[1100] flex items-center justify-between gap-3 bg-header/95 px-4 py-3 text-header-foreground backdrop-blur sm:px-6">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bolt text-bolt-foreground">
          <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
        </span>
        <span className="leading-tight">
          <span className="block text-base font-bold">Bouřkář CZ</span>
          <span className="hidden text-[11px] text-muted-foreground sm:block">
            Radar ČHMÚ · blesky · předpovědi pro Česko
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <a
          href="https://www.facebook.com/bourkyCZ"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#1877F2] px-3 py-1.5 text-xs font-semibold text-white shadow hover:brightness-110"
        >
          <Facebook className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Facebook Bouřkář CZ</span>
          <span className="sm:hidden">Facebook</span>
        </a>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
}
