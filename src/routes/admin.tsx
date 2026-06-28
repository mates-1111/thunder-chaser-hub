import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, LogOut } from "lucide-react";
import {
  adminLogin,
  adminLogout,
  adminStatus,
  createAlert,
  deleteAlert,
} from "@/lib/admin.functions";
import { useAlerts } from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const status = useServerFn(adminStatus);

  useEffect(() => {
    status().then((r) => setAuthed(r.isAdmin)).catch(() => setAuthed(false));
  }, [status]);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Načítám…
      </div>
    );
  }
  return authed ? <AdminDashboard onLogout={() => setAuthed(false)} /> : <LoginForm onOk={() => setAuthed(true)} />;
}

function LoginForm({ onOk }: { onOk: () => void }) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { ok } = await login({ data: { password } });
      if (ok) onOk();
      else toast.error("Špatné heslo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={handle} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Admin – Bouřkář CZ</h1>
          <p className="text-sm text-muted-foreground">Zadej heslo pro správu výstrah.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Heslo</Label>
          <Input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Přihlašuji…" : "Přihlásit"}
        </Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground hover:underline">
          ← zpět na radar
        </Link>
      </form>
    </div>
  );
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const alerts = useAlerts();
  const create = useServerFn(createAlert);
  const remove = useServerFn(deleteAlert);
  const logout = useServerFn(adminLogout);

  const [type, setType] = useState<"long" | "short">("long");
  const [level, setLevel] = useState(2);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(20);
  const [hours, setHours] = useState(6);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({
        data: {
          type,
          level,
          description,
          city: type === "short" ? city : null,
          radius_km: type === "short" ? radius : null,
          expires_hours: hours,
        },
      });
      toast.success("Výstraha vytvořena");
      setDescription("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Chyba";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="h-4 w-4" /> Zpět na radar
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await logout({});
              onLogout();
            }}
          >
            <LogOut className="h-4 w-4 mr-1" /> Odhlásit
          </Button>
        </header>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Nová výstraha</h2>
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={type} onValueChange={(v) => setType(v as "long" | "short")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Dlouhodobá (celá ČR)</SelectItem>
                  <SelectItem value="short">Krátkodobá (okruh)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Úroveň nebezpečí (1–5)</Label>
              <Select value={String(level)} onValueChange={(v) => setLevel(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Popis nebezpečí</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Silné bouřky s krupobitím a nárazy větru…"
                required
                rows={3}
              />
            </div>
            {type === "short" && (
              <>
                <div className="space-y-2">
                  <Label>Město / místo</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Brno"
                    required={type === "short"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Okruh (km)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Platnost (hodin)</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Ukládám…" : "Publikovat výstrahu"}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Aktivní výstrahy</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Žádné výstrahy.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {a.type === "long" ? "Dlouhodobá" : "Krátkodobá"} · úroveň {a.level}
                      {a.city ? ` · ${a.city}${a.radius_km ? ` (${a.radius_km} km)` : ""}` : ""}
                    </div>
                    <div className="text-sm">{a.description}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await remove({ data: { id: a.id } });
                      toast.success("Smazáno");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
