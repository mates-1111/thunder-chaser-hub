import { Link } from "@tanstack/react-router";
import { Shield, Zap, Facebook, Bell } from "lucide-react";

export function Header({ onEnablePush }: { onEnablePush?: () => void }) {
  return (
    <header className="absolute inset-x-0 top-0 z-[1100] flex items-center justify-between gap-2 bg-header/95 px-3 py-2.5 text-header-foreground backdrop-blur sm:px-6 sm:py-3">
      <Link to="/" className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bolt text-bolt-foreground">
          <Zap className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-sm font-bold sm:text-base">Bouřkář CZ</span>
          <span className="hidden text-[11px] text-muted-foreground sm:block">
            Radar ČHMÚ · blesky · předpovědi pro Česko
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {onEnablePush && (
          <button
            type="button"
            onClick={onEnablePush}
            className="inline-flex items-center gap-1.5 rounded-md bg-bolt px-2.5 py-1.5 text-xs font-semibold text-bolt-foreground shadow transition hover:brightness-95"
            aria-label="Zapnout push notifikace"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">Upozornění</span>
          </button>
        )}
        <a
          href="https://www.facebook.com/bourkyCZ"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-md bg-[#1877F2] px-2.5 py-1.5 text-xs font-semibold text-white shadow hover:brightness-110"
        >
          <Facebook className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Facebook Bouřkář CZ</span>
        </a>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
}
