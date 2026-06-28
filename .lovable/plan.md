## Co postavím

Klon **Bouřkář CZ** – tmavá hlavička, celoobrazovková Leaflet mapa s radarem (RainViewer + časová osa), pravý panel „Aktivní předpovědi“ a „Poslední hlášení“, žluté CTA „Nahlásit počasí u mě“ dole uprostřed, tlačítko „Zapnout push“ vpravo nahoře, **Admin** stránka chráněná heslem.

## Tři role / tři toky

### 1) Admin (ty) – přihlášení heslem na `/admin`
Heslo se ověřuje server-side (timing-safe, uložené v env jako `ADMIN_PASSWORD`), session v šifrované cookie. V administraci přidáváš dva typy varování:

**A. Dlouhodobá předpověď** (zobrazí se v pravém panelu „Aktivní předpovědi“)
- Název / krátký nadpis
- Popis nebezpečí (volný text)
- **Úroveň nebezpečí 1–5** (zelená → tmavě červená)
- Platnost od–do
- Volitelně oblast (kraje ČR, multi-select) – obarví se v sidebaru štítky

**B. Krátkodobé varování (blížící se bouřka)** – tohle pípne lidem na mobil
- **Nakreslíš kruh na mapě** (klikneš střed → tažením poloměr, nebo zadáš km)
- Popis nebezpečí („Silná bouřka s kroupami, vítr 90 km/h…“)
- Úroveň 1–5
- Platnost (default 60 min)
- Po uložení: server **okamžitě** pošle Web Push všem uživatelům, jejichž uložená poloha leží uvnitř toho kruhu, s textem který jsi napsal

### 2) Běžný návštěvník (bez účtu)
- Vidí radar, dlouhodobé předpovědi, hlášení od lidí, aktivní krátkodobá varování (kruhy na mapě)
- Klikne **„Zapnout push“** → zadá svoji polohu (auto geolokace **nebo** ručně město přes Nominatim) + okruh (default 25 km) → povolí notifikace → uloží se subscription. Žádný účet, identifikace přes browser `endpoint`.

### 3) Hlášení od lidí (přihlášený uživatel — e-mail/heslo + Google)
- Tlačítko „Nahlásit počasí u mě“ → modal: typ jevu (déšť, kroupy, bouřka, vítr, sníh…), **teplota °C**, popis, **foto upload**, automaticky pozice
- Pin se objeví na mapě + v sidebaru „Poslední hlášení“

## Vizuál (co nejblíž originálu)

- Pozadí hlavičky `oklch(0.18 0.025 250)` (tmavě modro-šedá)
- Akcent (blesk, CTA, „nyní“ ukazatel) `oklch(0.82 0.17 80)` (sytě žlutá)
- Mapa: CARTO `dark_all` (případně `light_all` pro denní režim)
- Inter / system-ui font, drobné velikosti v sidebaru
- Časová osa dole: 13 sloupců minulých 5min snímků + 7 predikčních (žluté), pause/back tlačítka, label „Radar ČHMÚ · měření po 5 min, predikce vpravo“

## Datový model (Lovable Cloud)

```text
profiles                id, display_name
forecasts (dlouhodobá)  id, title, description, level 1-5, valid_from,
                        valid_to, regions text[], created_at, created_by
storm_alerts (krátkodobá) id, description, level 1-5, center_lat, center_lon,
                          radius_km, valid_from, valid_to, created_at, created_by
weather_reports         id, user_id, lat, lon, kind, temperature_c,
                        description, photo_url, created_at
push_subscriptions      id, endpoint UNIQUE, p256dh, auth, lat, lon,
                        radius_km, created_at, last_seen_at
alerts_sent             id, alert_id, subscription_id, sent_at  -- proti duplicitě
```

**Storage bucket** `reports` (veřejný read) pro fotky.

**RLS**: 
- `forecasts`, `storm_alerts`, `push_subscriptions` – `anon` může číst aktivní záznamy; psát jen service-role (z admin server fn po ověření hesla)
- `weather_reports` – `anon` čte, přihlášený zapisuje vlastní
- `profiles` – vlastník čte/píše svůj

## Architektura

```text
src/routes/
  __root.tsx              hlavička s tlačítky
  index.tsx               mapa + radar + dva panely (veřejné)
  admin.tsx               heslo form (server fn ověří)
  admin.dashboard.tsx     gated: seznam + formuláře pro forecasts / storm_alerts
  auth.tsx                login pro hlášení (email/heslo + Google)
  _authenticated/
    route.tsx             integration-managed
    report.tsx            modal-stránka formuláře hlášení
src/lib/
  admin.functions.ts      unlockAdmin, createForecast, createStormAlert, ...
  alerts.functions.ts     listActiveForecasts, listActiveStormAlerts (veřejné)
  reports.functions.ts    createReport (auth), listRecentReports (veřejné)
  push.functions.ts       subscribePush, unsubscribePush, sendTestPush
  radar.ts                RainViewer helper (frames + tile URL builder)
  geo.ts                  haversine, Nominatim geocode
src/routes/api/public/
  push-send.ts            interní endpoint volaný po vytvoření storm_alert
public/
  sw.js                   service worker (Web Push receive + click handler)
  manifest.webmanifest
```

## Tok krátkodobého varování (to hlavní)

1. V `/admin/dashboard` klikneš „Nové varování bouřky“ → na mapě tažením nakreslíš kruh, doplníš text + level → uložit.
2. `createStormAlert` server fn (admin gate) uloží do DB a hned spustí rozeslání:
   - Vybere všechny `push_subscriptions`, kde `haversine(lat,lon, center) ≤ radius_km + subscription.radius_km`.
   - Pro každou zavolá `web-push` s VAPID klíči.
   - Zapíše do `alerts_sent` (dedup).
3. Service worker u uživatele zobrazí notifikaci s tvým textem + úrovní; po kliknutí otevře mapu.

VAPID klíče vygeneruju a uložím přes `generate_secret` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Heslo administrace → tobě teď vygeneruju silné `ADMIN_PASSWORD` (nebo si ho zadáš sám).

## Fáze (postavím postupně)

1. **Skeleton + radar** – tmavá hlavička, mapa, RainViewer časová osa, prázdné sidebary, design system. *(hned hratelné v náhledu)*
2. **Cloud + admin gate + dlouhodobá předpověď** – tabulky, `/admin` heslo, formulář, výpis v pravém panelu.
3. **Krátkodobé varování + push** – kreslení kruhu na mapě, VAPID, service worker, „Zapnout push“ flow, odeslání notifikací při uložení varování.
4. **Hlášení od lidí** – auth (email + Google), modal s teplotou/fotkou, Storage, piny na mapě + sidebar.

## Co potřebuju od tebe

- Potvrdit plán a já jedu Fázi 1.
- **Heslo do administrace**: vygeneruji silné automaticky a ukážu ti ho (můžeš pak změnit), nebo si chceš zadat vlastní? Napiš → nastavím.
- Web Push **nefunguje v editor preview iframe** – budeš testovat na publikované `*.lovable.app` URL nebo PWA instalované na mobilu.

Dej palec a začínám Fází 1.