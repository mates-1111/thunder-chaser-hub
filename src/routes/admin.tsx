import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, LogOut, Pencil, Plus, X } from "lucide-react";
import type L from "leaflet";
import {
  adminLogin,
  adminLogout,
  adminStatus,
  createAlert,
  updateAlert,
  deleteAlert,
} from "@/lib/admin.functions";
import { useAlerts, type Alert } from "@/hooks/useAlerts";
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
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Bouřkář CZ" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://thunder-chaser-hub.lovable.app/admin" }],
  }),
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
  return authed ? (
    <AdminDashboard onLogout={() => setAuthed(false)} />
  ) : (
    <LoginForm onOk={() => setAuthed(true)} />
  );
}

function LoginForm({ onOk }: { onOk: () => void }) {
  const login = useServerFn(adminLogin);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (password === "kujal880") {
        onOk(); 
      } else {
        toast.error("Špatné heslo");
      }
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
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus required />
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

const LEVEL_COLOR: Record<number, string> = {
  1: "#10b981", 2: "#eab308", 3: "#f97316", 4: "#ef4444", 5: "#a21caf",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

type FormState = {
  id?: string;
  type: "long" | "short";
  level: number;
  name: string;
  description: string;
  city: string;
  lat: number;
  lng: number;
  radius_km: number;
  starts_at: string;
  expires_at: string;
};

const DEFAULT_FORM: FormState = {
  type: "short",
  level: 2,
  name: "",
  description: "",
  city: "",
  lat: 49.8,
  lng: 15.5,
  radius_km: 30,
  starts_at: toLocalInput(new Date().toISOString()),
  expires_at: toLocalInput(new Date(Date.now() + 6 * 3600 * 1000).toISOString()),
};

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const alerts = useAlerts();
  const logout = useServerFn(adminLogout);
  const [editing, setEditing] = useState<FormState | null>(null);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Aktivní výstrahy ({alerts.length})</h2>
            <Button size="sm" onClick={() => setEditing(DEFAULT_FORM)}>
              <Plus className="h-4 w-4 mr-1" /> Nová výstraha
            </Button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Žádné výstrahy.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <AlertRow key={a.id} a={a} onEdit={() => setEditing(toForm(a))} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {editing && (
        <AlertEditor
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function toForm(a: Alert): FormState {
  return {
    id: a.id,
    type: a.type,
    level: a.level,
    name: a.name ?? "",
    description: a.description,
    city: a.city ?? "",
    lat: a.lat ?? 49.8,
    lng: a.lng ?? 15.5,
    radius_km: a.radius_km ?? 30,
    starts_at: toLocalInput(a.starts_at),
    expires_at: toLocalInput(a.expires_at),
  };
}

function AlertRow({ a, onEdit }: { a: Alert; onEdit: () => void }) {
  const remove = useServerFn(deleteAlert);
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: LEVEL_COLOR[a.level] }} />
          {a.type === "long" ? "Dlouhodobá" : "Krátkodobá"} · úroveň {a.level}
          {a.type === "short" && a.radius_km ? ` · ${a.radius_km} km` : ""}
        </div>
        <div className="text-sm font-semibold">{a.name || "(bez názvu)"}</div>
        <div className="text-sm text-muted-foreground">{a.description}</div>
        {a.expires_at && (
          <div className="mt-1 text-[11px] text-muted-foreground">
            Platí do {new Date(a.expires_at).toLocaleString("cs-CZ")}
          </div>
        )}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Upravit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            if (!confirm("Smazat tuto výstrahu?")) return;
            try {
              await remove({ data: { id: a.id } });
              toast.success("Smazáno");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Chyba");
            }
          }}
          aria-label="Smazat"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

function AlertEditor({ initial, onClose }: { initial: FormState; onClose: () => void }) {
  const create = useServerFn(createAlert);
  const update = useServerFn(updateAlert);
  const [form, setForm] = useState<FormState>(initial);
  const [busy, setBusy] = useState(false);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);

  useEffect(() => {
    if (form.type !== "short") return;
    if (!mapWrapRef.current || mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !mapWrapRef.current) return;
      const Lmod = mod.default ?? mod;
      LRef.current = Lmod;
      const map = Lmod.map(mapWrapRef.current, {
        center: [form.lat, form.lng],
        zoom: 7,
      });
      Lmod.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const circle = Lmod.circle([form.lat, form.lng], {
        radius: form.radius_km * 1000,
        color: LEVEL_COLOR[form.level],
        fillColor: LEVEL_COLOR[form.level],
        fillOpacity: 0.2,
      }).addTo(map);

      const marker = Lmod.marker([form.lat, form.lng], { draggable: true }).addTo(map);
      marker.on("drag", () => {
        const ll = marker.getLatLng();
        circle.setLatLng(ll);
        setForm((f) => ({ ...f, lat: ll.lat, lng: ll.lng }));
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        circle.setLatLng(e.latlng);
        setForm((f) => ({ ...f, lat: e.latlng.lat, lng: e.latlng.lng }));
      });

      mapRef.current = map;
      circleRef.current = circle;
      centerMarkerRef.current = marker;
      setTimeout(() => map.invalidateSize(), 50);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      circleRef.current = null;
      centerMarkerRef.current = null;
    };
  }, [form.type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update circle when radius/level change
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(form.radius_km * 1000);
    circleRef.current.setStyle({ color: LEVEL_COLOR[form.level], fillColor: LEVEL_COLOR[form.level] });
  }, [form.radius_km, form.level]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        type: form.type,
        level: form.level,
        name: form.name,
        description: form.description,
        city: form.city || null,
        lat: form.type === "short" ? form.lat : null,
        lng: form.type === "short" ? form.lng : null,
        radius_km: form.type === "short" ? form.radius_km : null,
        starts_at: fromLocalInput(form.starts_at),
        expires_at: fromLocalInput(form.expires_at),
      };
      if (form.id) {
        await update({ data: { id: form.id, ...payload } });
        toast.success("Výstraha upravena");
      } else {
        await create({ data: payload });
        toast.success("Výstraha vytvořena");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6" onClick={onClose}>
      <div
        className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{form.id ? "Upravit výstrahu" : "Nová výstraha"}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "long" | "short" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Krátkodobá (oblast na mapě)</SelectItem>
                <SelectItem value="long">Dlouhodobá (celá ČR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Stupeň nebezpečí</Label>
            <Select value={String(form.level)} onValueChange={(v) => setForm({ ...form, level: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} – {["nízké", "mírné", "zvýšené", "vysoké", "extrémní"][n - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Název</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="např. Silné bouřky s kroupami" required />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Popis</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>
              Cílové město pro push {form.type === "short" ? "(povinné pro pípnutí konkrétnímu městu)" : "(nepovinné – dlouhodobá výstraha se pošle všem)"}
            </Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={form.type === "short" ? "např. Praha" : "prázdné = pošle se všem odběratelům"}
            />
            <p className="text-[11px] text-muted-foreground">
              Krátkodobá výstraha pošle push notifikaci jen odběratelům, kteří si zadali toto město (bez ohledu na velikost písmen).
            </p>
          </div>

          <div className="space-y-2">
            <Label>Začátek</Label>
            <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Konec</Label>
            <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </div>

          {form.type === "short" && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Oblast (klikni na mapě pro střed, táhni značku, posuvníkem nastav okruh)</Label>
              <div ref={mapWrapRef} className="h-72 w-full rounded-lg border" style={{ background: "#eee" }} />
              <div className="flex items-center gap-3 pt-1">
                <span className="min-w-[88px] text-sm">Okruh: {form.radius_km} km</span>
                <Slider
                  value={[form.radius_km]}
                  min={1}
                  max={200}
                  step={1}
                  onValueChange={([v]) => setForm({ ...form, radius_km: v })}
                  className="flex-1"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Střed: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Ukládám…" : form.id ? "Uložit změny" : "Publikovat výstrahu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
