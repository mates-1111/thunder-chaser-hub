import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { enablePushForCity, getStoredCity, markPushDismissed, pushSupported } from "@/lib/push";
import { Bell } from "lucide-react";

export function PushDialog({
  open,
  onOpenChange,
  onSubscribed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubscribed?: (city: string) => void;
}) {
  const [city, setCity] = useState(getStoredCity() ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) {
      toast.error("Zadej město.");
      return;
    }
    if (!pushSupported()) {
      toast.error("Tvůj prohlížeč nepodporuje push notifikace. Na iPhone: přidej aplikaci na plochu (Sdílet → Na plochu) a otevři odtud.");
      return;
    }
    setBusy(true);
    try {
      await enablePushForCity(trimmed);
      toast.success(`Notifikace zapnuty pro ${trimmed}. Pošleme ti pípnutí, když vydáme výstrahu.`);
      onSubscribed?.(trimmed);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Nepodařilo se zapnout notifikace.");
    } finally {
      setBusy(false);
    }
  }

  function handleDismiss(v: boolean) {
    if (!v) markPushDismissed();
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-bolt text-bolt-foreground">
            <Bell className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Zapnout upozornění na bouřky</DialogTitle>
          <DialogDescription className="text-center">
            Zadej svoje město. Jakmile vydáme výstrahu pro tvůj region, pošleme ti push notifikaci přímo na mobil nebo počítač.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="push-city">Tvoje město</Label>
            <Input
              id="push-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="např. Praha, Brno, Ostrava…"
              autoFocus
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Zapínám…" : "🔔 Zapnout notifikace"}
          </Button>
          <button
            type="button"
            onClick={() => handleDismiss(false)}
            className="mx-auto block text-xs text-muted-foreground hover:underline"
          >
            Teď ne
          </button>
        </form>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Poznámka pro iPhone/iPad: push funguje jen když si přidáš stránku na plochu (Sdílet → „Přidat na plochu") a otevřeš ji z ikony.
        </p>
      </DialogContent>
    </Dialog>
  );
}
