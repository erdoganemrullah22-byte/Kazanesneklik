# Kazan Esneklik

Türkçe, mobil öncelikli bir esneklik (germe ve mobilite) eğitim uygulaması. Kullanıcının seviyesine,
zamanına ve imkanlarına göre kişisel program üretir, seans boyunca eşlik eder ve ilerlemeyi ölçer.
Yapay zekâ katmanı (Claude API) yalnızca sunucuda çalışır; güvenlik kuralları deterministik koddadır.

Ürün ve teknik planın tek kaynağı: [`docs/PLAN.md`](docs/PLAN.md).

> **Durum: Faz K / K0 — iskelet.** Site şimdilik yalnızca ürün sahibinin kişisel kullanımı içindir
> (plan 11.0). Kayıt ve giriş, sunucu tarafında zorlanan tek adreslik bir izin listesiyle sınırlıdır;
> kayıt ayrıca varsayılan olarak kapalıdır ve yalnızca ilk kayıt için kısa süre açılır (`AUTH_SIGNUP_OPEN`).
> Klinik kurul onayı, KVKK rıza ekranları, kotalar, ödeme ve admin paneli başka bir kişi siteyi
> kullanmadan önceki **herkese açma kapısına** (plan 11.0.4) bırakılmıştır.

## İçindekiler

- [Yapı](#yapı)
- [Gereksinimler](#gereksinimler)
- [Yerel geliştirme](#yerel-geliştirme)
- [Testler ve kalite betikleri](#testler-ve-kalite-betikleri)
- [Dağıtım rehberi (ürün sahibi için)](#dağıtım-rehberi-ürün-sahibi-için)
- [Mimari kurallar](#mimari-kurallar)

## Yapı

```
apps/web/                 Next.js 16 (App Router, React 19, Tailwind CSS v4)
  app/                    (marketing)/  (auth)/giris,kayit  (app)/bugun,program,ilerleme,koc,profil
                          cevrimdisi/  api/{auth,health,admin/ai/smoke}  manifest.ts
  components/             ui/ (shadcn/ui tarzı: Button, Card, Input, Label), app-shell/, auth/
  lib/                    env (t3-env), izin listesi + kayıt penceresi, CSP, yönlendirme, auth istemcisi
  server/                 auth.ts (Better Auth), session.ts, db.ts, queries/ (tek Prisma erişim yeri)
  messages/tr.json        tüm arayüz metinleri (next-intl, tek dil, URL öneki yok)
  proxy.ts                oturum çerezi kontrolü + istek başına CSP nonce'u
  sw/sw.ts                service worker kaynağı (Serwist) → build'de public/sw.js
  scripts/                ikon üretimi, vercel-build.sh, E2E veritabanı koruması
  tests/e2e/              Playwright
packages/
  config/                 ortak tsconfig, ESLint (paket sınırları), Tailwind tasarım değişkenleri
  contracts/              istemci + sunucu Zod şemaları
  safety/                 güvenlik çekirdeği (K0: iskelet + safetySpecVersion)
  engine/                 deterministik program motoru (K0: tohumlu üreteç, ISO hafta)
  content/                içerik şemaları + YAML egzersiz kartları + content:validate
  ai/                     yalnızca sunucu: Anthropic istemcisi, model/effort ayarı, smoke çağrısı
  db/                     Prisma 7 şeması, migration'lar, istemci fabrikası
scripts/                  db-local.sh, e2e.sh, check-client-bundle.mjs
test/                     kök testler (ESLint paket sınırı fikstürleri)
docs/                     PLAN.md, runbooks/
```

## Gereksinimler

- **Node.js 22** (`.nvmrc`) ve **pnpm 10** (`corepack enable` ile `package.json` içindeki sürüm kullanılır)
- Yerel veritabanı için **PostgreSQL 16** ikilileri (`initdb`, `pg_ctl`; Debian/Ubuntu: `postgresql-16`)

## Yerel geliştirme

```bash
pnpm install                                  # bağımlılıklar + Prisma istemcisi (postinstall)
cp .env.example apps/web/.env.local           # sonra değerleri doldur (aşağıda)
pnpm db:local                                 # geçici PostgreSQL'i başlatır, bağlantı adreslerini yazar
pnpm db:migrate                               # migration'ları uygular
pnpm dev                                      # http://localhost:3000
```

`apps/web/.env.local` için örnek (bu dosya git'e girmez):

```bash
DATABASE_URL=postgresql://kazan@localhost:54329/kazan     # pnpm db:local çıktısı
BETTER_AUTH_SECRET=...                                    # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
AUTH_ALLOWED_EMAILS=senin-adresin@example.com             # Faz K'da tek adres
AUTH_SIGNUP_OPEN=true                                     # yerelde kayıt olabilmek için
AI_LIVE=false
```

> **`.env.local` yalnızca yerel değerler içindir.** Neon (üretim) adreslerini, üretimin
> `BETTER_AUTH_SECRET`'ini ya da Anthropic anahtarını buraya koyma. `DATABASE_URL_UNPOOLED` bu dosyada
> bilerek yok: Prisma (`packages/db/prisma.config.ts`) `.env.local`'den yalnızca `DATABASE_URL`'i okur
> ve komut satırında verilen bir adres her zaman ondan önce gelir.

`ANTHROPIC_API_KEY` yerelde gerekmez; AI kodu birim testlerde sahte (mock) istemciyle sınanır.
Anahtarı `.env.local`'e yazmaktan kaçın (plan 10.14 C).

**Yerel veritabanı (`pnpm db:local`):** `scripts/db-local.sh` veri dizinini `.local/pg` altında
(git'e girmez) oluşturur, `localhost:54329`'da yalnızca yerel bağlantıya açık (`trust`) bir sunucu
başlatır ve `kazan` ile `kazan_e2e` veritabanlarını açar. Root olarak çalıştırılırsa (ör. bulut
konteyneri) PostgreSQL root'u reddettiği için komutları `postgres` sistem kullanıcısıyla çalıştırır.
`KAZAN_PG_DIR`, `KAZAN_PG_PORT`, `PG_BIN` ile değiştirilebilir. Durdurmak: `pnpm db:local:stop`.

Yeni bir şema değişikliği için: `prisma/schema.prisma`'yı düzenle → `pnpm db:migrate:dev` (migration
üretir ve uygular) → oluşan `packages/db/prisma/migrations/*` klasörünü commit et. `migrate dev`,
`migrate reset` ve `db push` yalnızca yerel (localhost) veritabanında çalışır; uzak bir adres görürlerse
dururlar.

## Testler ve kalite betikleri

| Komut                   | Ne yapar                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `pnpm lint`             | ESLint (flat config, tip duyarlı; paket sınırları kuralları dahil)                                 |
| `pnpm typecheck`        | Her pakette `tsc --noEmit` (strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`)    |
| `pnpm test`             | Vitest birim testleri (paketler + web)                                                             |
| `pnpm format:check`     | Prettier                                                                                           |
| `pnpm content:validate` | Egzersiz kartlarını Zod şemasıyla ve kütüphane kurallarıyla doğrular                               |
| `pnpm db:validate`      | `prisma validate`                                                                                  |
| `pnpm build`            | `next build` (Turbopack) + `serwist build` (service worker)                                        |
| `pnpm secret-scan`      | Build sonrası istemci paketi + önceden render edilmiş çıktılarda (`.html/.rsc/.body`) sır taraması |
| `pnpm e2e`              | Yerel Postgres → migration → şema sapması kontrolü → build → Playwright (Pixel 7 + masaüstü)       |

**E2E:** `pnpm e2e` sahte değerleri `apps/web/tests/e2e/e2e.env` dosyasından alır (izinli adres
`izinli@example.com`); bu değerler kabuktaki değişkenlerin önüne geçer. Her koşuda test veritabanının
kimlik tablolarını boşaltır, bu yüzden hedef yalnızca `E2E_DATABASE_URL`'dir (kabuktaki `DATABASE_URL`
asla kullanılmaz) ve adı `_e2e` ile biten, CI dışında `localhost`'taki bir veritabanı olmak zorundadır
(`apps/web/scripts/e2e-db-guard.mjs`; değilse koşu hiçbir şeye dokunmadan durur). Migration'dan sonra
`prisma migrate diff --exit-code` ile veritabanı `schema.prisma` ile karşılaştırılır; migration'sız bir
şema değişikliği koşuyu durdurur. Playwright aynı build'den iki sunucu başlatır: kayıt penceresi açık
(`:3100`, akışların çoğu) ve üretimdeki gibi kapalı (`:3101`, `AUTH_SIGNUP_OPEN=false`; izinli adres
dahil her kaydın sunucuda reddedildiğini sınar). Kendi bilgisayarında ilk sefer için Chromium indir:
`pnpm --filter @kazan/web exec playwright install chromium`. Hazır bir build ile yeniden koşmak için
`E2E_SKIP_BUILD=1 pnpm e2e`.

**CI** (`.github/workflows/ci.yml`): lockfile değişmeden kurulum, lint, typecheck, biçim, birim
testleri, içerik doğrulama, `prisma validate`, build, istemci paketinde ve önceden render edilmiş
çıktılarda sır taraması; ayrı bir işte `postgres:16` servis konteyneriyle migration + şema sapması
kontrolü + E2E. Aksiyonlar tam commit SHA'sıyla sabitlenmiştir; güncellemeleri Dependabot önerir
(`.github/dependabot.yml`).

## Dağıtım rehberi (ürün sahibi için)

Barındırma: **Vercel Hobby** (kişisel, ticari olmayan kullanım) + **Neon Postgres** (AB/Frankfurt).
Bu adımları sen yaparsın; geliştirme oturumu Vercel ve Neon'a erişemez ve hiçbir anahtarı görmez.

> **Altın kural:** API anahtarlarını, parolaları ve bağlantı dizelerini **asla** sohbete, koda,
> issue'ya, PR'a ya da ekran görüntüsüne yapıştırma. Yalnızca ilgili panelin gizli alanına gir.

### 1. GitHub

1. Repo → **Settings → General → Default branch**: `main` seç (gerekirse önce bu dalı oluştur).
2. İsteğe bağlı ama önerilir: **Settings → Branches → Add rule** → `main` için "Require status
   checks to pass" → `Lint, tip, test, build` ve `E2E (Playwright + Postgres)` işlerini seç.
3. **Settings → Code security**: Secret scanning ve Push protection açık olsun.

### 2. Neon (veritabanı)

1. [console.neon.tech](https://console.neon.tech) → **New Project** → bölge: **AWS Europe Central 1
   (Frankfurt)**, Postgres 16 ya da üstü.
2. **Connect** penceresinde iki adres al:
   - **Pooled connection** açık → `DATABASE_URL` (uygulama bunu kullanır),
   - **Pooled connection** kapalı (doğrudan) → `DATABASE_URL_UNPOOLED` (migration bunu kullanır).
     Adreslerin sonunda `?sslmode=require` bulunmalı.
3. Kolay yol: Vercel'de proje açıldıktan sonra **Storage → Neon** entegrasyonu da bu iki değişkeni
   otomatik ekler; o zaman 2. adımı atlayabilirsin (bölgeyi yine Frankfurt seç). **Dikkat:** projeyi
   bağlarken ortam olarak **yalnızca Production**'ı işaretle; Preview ve Development işaretli gelirse
   kaldır. (Neon'un Preview dağıtımları için ayrı veritabanı dalı açan seçeneğini kullanırsan Preview
   kendi dalına bağlanır; bkz. aşağıdaki "Preview dağıtımları".) Entegrasyondan sonra **Settings →
   Environment Variables**'ta `DATABASE_URL` ve `DATABASE_URL_UNPOOLED`'ın yanında yalnızca
   _Production_ yazdığını kontrol et. Ek güvence: `pnpm build:vercel` migration'ı yalnızca Production
   dağıtımında çalıştırır; Preview build'leri üretim veritabanına asla migration uygulamaz.

### 3. Vercel (uygulama)

1. [vercel.com/new](https://vercel.com/new) → GitHub reposunu **Import** et.
2. **Root Directory: `apps/web`** (monorepo; Vercel pnpm çalışma alanını kökten kurar, "Include files
   outside the root directory" açık kalmalı). Framework: Next.js (otomatik).
3. **Build Command** → _Override_: `pnpm build:vercel` (`apps/web/scripts/vercel-build.sh`:
   yalnızca Production dağıtımında `prisma migrate deploy`, sonra `next build` → `serwist build`).
   Install Command varsayılan (`pnpm install`) kalsın.
4. **Settings → General → Node.js Version**: `22.x`.
5. **Settings → Functions → Function Region**: `Frankfurt, Germany (fra1)` (Neon ile aynı bölge).
6. **Settings → Git → Production Branch**: `main`.

### 4. Ortam değişkenleri

**Settings → Environment Variables**. Aksi yazılmadıkça yalnızca **Production** ortamını işaretle ve
gizli olanları **Sensitive** yap (kaydettikten sonra değer bir daha gösterilmez).

| Değişken                       | Değer                                                                | Sensitive |
| ------------------------------ | -------------------------------------------------------------------- | --------- |
| `DATABASE_URL`                 | Neon pooled adresi                                                   | Evet      |
| `DATABASE_URL_UNPOOLED`        | Neon doğrudan adresi                                                 | Evet      |
| `BETTER_AUTH_SECRET`           | Kendi bilgisayarında üret: `openssl rand -base64 32`                 | Evet      |
| `BETTER_AUTH_URL`              | `https://<proje-adın>.vercel.app` (ya da kendi alan adın)            | Hayır     |
| `AUTH_ALLOWED_EMAILS`          | Kendi e-posta adresin (Faz K'da tek adres)                           | Hayır     |
| `AUTH_SIGNUP_OPEN`             | `false` (yalnızca ilk kayıt için birkaç dakika `true`, 7. adım)      | Hayır     |
| `ANTHROPIC_API_KEY`            | Anthropic Console'dan, aşağıya bak                                   | **Evet**  |
| `AI_MODEL_MAIN`                | `claude-opus-5-5`                                                    | Hayır     |
| `AI_LIVE`                      | `false` (yalnızca ilk canlı testte geçici olarak `true`)             | Hayır     |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` (Vercel'in `package.json`'daki pnpm 10 sürümünü kullanması için) | Hayır     |

**Anthropic anahtarı (plan 10.14 A):**

1. [console.anthropic.com](https://console.anthropic.com) → **Workspaces** → bu projeye özel bir
   workspace aç (ör. `kazan-esneklik-prod`).
2. Workspace'e **aylık harcama limiti** koy (Faz K önerisi: $50) ve uyarıları aç.
3. Bu workspace'te **projeye özel** bir anahtar oluştur (ad örneği: `kazan-esneklik-prod-2026-11`).
4. Anahtar yalnızca bir kez gösterilir: doğrudan Vercel'deki `ANTHROPIC_API_KEY` alanına yapıştır
   (Sensitive, yalnızca Production). Not defterine, e-postaya, sohbete yazma; Development ortamına ekleme.

Değişken ekledikten ya da değiştirdikten sonra **Deployments → son dağıtım → Redeploy** (değişkenler
yalnızca yeni dağıtımda etkinleşir).

**Preview dağıtımları:** Faz K'da Preview ortamına veritabanı değişkeni koymazsan Preview build'leri
ortam doğrulamasında durur (bu bilinçli: sahibinin verisi yalnızca production'da durur). Preview
istersen Neon'da üretimden değil, boş bir dal (ör. `seed`) aç ve onun adreslerini yalnızca
**Preview** ortamına gir; o dala migration uygulansın istiyorsan Preview ortamına
`MIGRATE_ON_PREVIEW=1` de ekle (üretim adresleri Preview'dayken **asla** ekleme).
`ANTHROPIC_API_KEY`'i Preview'a ekleme (plan 10.14 B).

### 5. Migration nasıl uygulanır?

`pnpm build:vercel` her **Production** dağıtımında önce `prisma migrate deploy` çalıştırır: yalnızca
henüz uygulanmamış migration'ları, `DATABASE_URL_UNPOOLED` (yoksa `DATABASE_URL`) üzerinden uygular.
Preview dağıtımlarında migration atlanır (`MIGRATE_ON_PREVIEW=1` yoksa). Migration başarısız olursa
build durur ve eski sürüm yayında kalır. Elle uygulamak gerekirse kendi
bilgisayarında: `DATABASE_URL_UNPOOLED='<neon-doğrudan-adres>' pnpm db:migrate` (adresi komut
geçmişine bırakmamak için parola yöneticisinden çalışma anında vermek daha iyidir).

### 6. Deployment Protection

**Settings → Deployment Protection → Vercel Authentication**: **Standard Protection** açık olsun.
Böylece Preview ve dağıtıma özel adresler yalnızca Vercel hesabınla açılır. Production alan adı
herkese açık kalır (telefonundaki uygulama için gerekli); orayı izin listesi ve parola korur.

### 7. Kontrol ve telefona kurulum

1. `https://<proje-adın>.vercel.app/api/health` → `{"status":"ok","db":"ok"}` görmelisin.
2. **Kayıt penceresi (yalnızca bir kez).** İzin listesi yalnızca adresin metnine bakar ve e-posta
   doğrulaması yoktur; bu yüzden kayıt varsayılan olarak kapalıdır ve yalnızca senin kaydın için birkaç
   dakika açılır:
   1. Vercel'de `AUTH_SIGNUP_OPEN` = `true` (yalnızca Production) → **Redeploy**.
   2. Dağıtım biter bitmez siteyi aç → **Hesap oluştur** → izin listesindeki e-postan ve en az 12
      karakterlik parolanla kayıt ol.
   3. Hemen `AUTH_SIGNUP_OPEN` = `false` yap → **Redeploy**. `/kayit` sayfası "Kayıt şu anda kapalı"
      demeli.
   4. Kayıtta "Bu e-posta ile zaten bir hesap var" görürsen o adresle senden önce biri kayıt olmuş
      demektir: kaydı kapat, Neon **SQL Editor**'da o kullanıcıyı sil
      (`DELETE FROM users WHERE email = '<adresin>';`; oturumları ve profili de birlikte silinir) ve
      bu adımı tekrarla.
3. **iPhone:** Safari'de siteyi aç → **Paylaş** → **Ana Ekrana Ekle** → **Ekle**.
4. **Android:** Chrome'da siteyi aç → sağ üstteki **⋮** menüsü → **Uygulamayı yükle** (bazı
   sürümlerde "Ana ekrana ekle").
5. Ana ekrandaki "Kazan" simgesiyle açtığında adres çubuğu olmadan tam ekran açılmalı.

### 8. İlk canlı AI testi (`POST /api/admin/ai/smoke`)

Uç nokta yalnızca `POST` ile, `AI_LIVE=true` iken ve izin listesindeki hesapla oturum açmışken çalışır;
aksi halde 404 (oturum var ama izinli değilse 403) döner. Diğer yöntemler (`GET` vb.) her zaman 404
döner. Yanıtta yalnızca `{ ok, model, stop_reason, latencyMs }` (hata varsa bir hata kodu) bulunur;
anahtar, başlık ya da model metni dönmez.

1. Vercel'de `AI_LIVE` değerini `true` yap, `ANTHROPIC_API_KEY`'in tanımlı olduğundan emin ol → Redeploy.
2. Bilgisayarında siteye giriş yap → tarayıcının geliştirici konsolunu aç (F12 → Console) → çalıştır:
   ```js
   await (await fetch("/api/admin/ai/smoke", { method: "POST" })).json();
   ```
3. Beklenen: `{ ok: true, model: "claude-opus-5-5", stop_reason: "end_turn", latencyMs: … }`.
   Olası hata kodları: `NOT_CONFIGURED` (anahtar yok), `AUTH` (anahtar geçersiz), `PERMISSION`,
   `RATE_LIMITED`, `TIMEOUT`, `CONNECTION`, `UPSTREAM` (Anthropic tarafı), `REFUSAL`,
   `UNEXPECTED_OUTPUT`.
4. Test bitince `AI_LIVE`'ı yeniden `false` yap → Redeploy. Sonucu ve Console'daki maliyeti
   [`docs/runbooks/ilk-canli-ai-testi.md`](docs/runbooks/ilk-canli-ai-testi.md) şablonuna not et
   (plan 10.14 E; anahtarı ya da başlıkları asla yazma).

**Anahtar sızarsa:** önce Console'da anahtarı **hemen iptal et**, sonra yenisini oluşturup Vercel'e
gir ve yeniden dağıt (plan 10.14 F). Git geçmişini yeniden yazmak iptalin yerine geçmez.

## Mimari kurallar

- **Paket sınırları (plan 10.3)** ESLint ile zorlanır: `safety` ve `engine` saf TypeScript'tir (I/O,
  `process`, dinamik `import()`, `Date.now()`, `Math.random()`, `@kazan/ai`, `@kazan/db` yok); başka bir
  pakete göreli yolla import yasaktır (`import/no-relative-packages`); `ai` yalnızca sunucuda
  (`server-only`); web uygulamasında Prisma'ya yalnızca `apps/web/server/queries` (ve Better Auth
  adaptörü) erişir, göreli yol ve dinamik import dahil; ortam değişkenleri yalnızca
  `apps/web/lib/env.ts` üzerinden okunur (`process.env`'i parçalamak da yasak). Bu kurallar
  `test/eslint-boundaries.test.ts` fikstürleriyle sınanır.
- **Sırlar:** sunucu değişkenini istemci bileşeninde kullanmak build'i kırar (`server-only` +
  `@t3-oss/env-nextjs`); ortam doğrulaması atlanamaz; CI, istemci paketinde ve önceden render edilmiş
  çıktılarda `sk-ant` / `ANTHROPIC_API_KEY` arar.
- **Kimlik doğrulama:** Better Auth, e-posta + parola (en az 12 karakter), yerleşik rate limit açık
  (sayaçlar Postgres'te). Kayıt `AUTH_SIGNUP_OPEN=true` olmadıkça kapalıdır (kapalıyken her adrese aynı
  yanıt, liste sızmaz). İzin listesi sunucu tarafında uygulanır: istek kancası, kullanıcı oluşturma
  kancası, oturum oluşturma kancası; korumalı sayfalar ayrıca her istekte oturumu doğrular.
- **Güvenlik başlıkları:** istek başına nonce'lu CSP (`proxy.ts`), HSTS, `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, `Permissions-Policy` (`next.config.ts`).
- **AI çağrıları (plan 8.10):** varsayılan model `claude-opus-5-5`; effort her çağrıda açıkça yazılır;
  `temperature`/`top_p`/`top_k`, `thinking` ayarı, assistant prefill ve zorunlu `tool_choice`
  gönderilmez; sunucu tarafı yedek model (`fallbacks: "default"`) açıktır; `stop_reason: "refusal"`
  içerik okunmadan önce ele alınır.
