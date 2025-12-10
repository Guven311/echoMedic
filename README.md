# echoMedic

En moderne webasert plattform for compliance-analyse og dokumenthåndtering innen helsesektoren. echoMedic hjelper organisasjoner med å automatisere vurdering av dokumenter mot regulatoriske krav og compliance-standarder.

## 🎯 Funksjoner

- **Dokumentanalyse**: Last opp dokumenter og få automatisk compliance-analyse basert på AI
- **Compliance-sjekk**: Vurder dokumenter mot GDPR, helsestandarder og interne retningslinjer
- **Risiko-vurdering**: Identifiser og håndter compliance-risiko
- **Brukerautentisering**: Sikker innlogging med Supabase Auth
- **Profilhåndtering**: Personalisert brukeropplevelse med avatarer og innstillinger
- **Dashboard**: Oversikt over dokumenter, compliance-status og risikoer
- **Pedagogisk innhold**: Innebygde kurs og retningslinjer for compliance-opplæring

## 🛠 Teknologistakk

### Frontend

- **React 18** - UI-bibliotek
- **TypeScript** - Type-sikkerhet
- **Vite** - Build-verktøy
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI-komponenter
- **React Router** - Navigering

### Backend & Infrastruktur

- **Supabase** - PostgreSQL-database og autentisering
- **Supabase Edge Functions** - Serverless backend (Deno)
- **Supabase Storage** - Fillagring for dokumenter og avatarer
- **OpenAI API** - AI-drevet compliance-analyse (gpt-4-turbo)

### Verktøy

- **ESLint** - Kodevalidering
- **PostCSS** - CSS-prosessering
- **Bun** - Pakkebehandler

## 📋 Forutsetninger

- Node.js 16+ eller Bun
- Supabase-konto (gratis tier fungerer)
- OpenAI API-nøkkel (for AI-analyse)
- Git

## 🚀 Kom i gang

### 1. Klone repositorium

```bash
git clone https://github.com/Guven311/echoMedic.git
cd echoMedic
```

### 2. Installer avhengigheter

```bash
npm install
# eller med Bun:
bun install
```

### 3. Sett opp miljøvariabler

Opprett en `.env.local`-fil i rotmappen:

```
VITE_SUPABASE_URL=https://[ditt-prosjekt].supabase.co
VITE_SUPABASE_ANON_KEY=[din-offentlige-nøkkel]
```

Disse finner du i Supabase Dashboard → Settings → API.

### 4. Sett opp Supabase lokalt (valgfritt)

```bash
supabase start
```

### 5. Start utviklingsserveren

```bash
npm run dev
# eller med Bun:
bun run dev
```

Appen kjører på `http://localhost:5173`

## 🔑 Konfigurering av OpenAI API

For at dokumentanalyse skal fungere:

1. Gå til **Supabase Dashboard** → **Functions** → **analyze-document**
2. Gå til **Configuration**-tabbelen
3. Legg til environment variabel:
   - **Key:** `AI_API_KEY`
   - **Value:** Din OpenAI API-nøkkel
4. Lagre

⚠️ **VIKTIG:** Lagre aldri API-nøkler i git eller `.env`-filer som commites til versjonskontroll.

## 📁 Prosjektstruktur

```
echoMedic/
├── src/
│   ├── components/          # React-komponenter
│   │   ├── DocumentAnalyzer.tsx    # Dokumentlasting og analyse
│   │   ├── AppSidebar.tsx          # Hovednavigering
│   │   └── ui/                     # shadcn/ui-komponenter
│   ├── pages/              # Sidekomponenter (ruter)
│   │   ├── Dashboard.tsx
│   │   ├── Dokumenter.tsx
│   │   ├── Risiko.tsx
│   │   ├── Profil.tsx
│   │   └── ...
│   ├── hooks/              # Custom React-hooks
│   ├── lib/                # Utility-funksjoner
│   ├── integrations/       # Supabase-klient
│   └── main.tsx            # App-inngang
├── supabase/
│   ├── functions/          # Edge Functions
│   │   └── analyze-document/    # AI-analyse-funksjon
│   └── migrations/         # Database-migrasjoner
├── public/                 # Statiske filer
└── vite.config.ts         # Vite-konfigurasjon
```

## 🧪 Bygging for produksjon

```bash
npm run build
```

Produksjonsfiler genereres i `dist/`-mappen.

## 📦 Deployment

### Supabase Edge Functions

```bash
supabase functions deploy analyze-document
```

### Frontend (Vercel, Netlify, etc.)

1. Push koden til GitHub
2. Koble til Vercel/Netlify fra GitHub
3. Sett environment variabler i dashboard
4. Deploy

## 🤝 Bidrag

Bidrag er velkomne! Vennligst:

1. Fork repositorium
2. Opprett en feature-branch (`git checkout -b feature/AmazingFeature`)
3. Commit endringer (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åpne en Pull Request

## 📝 Lisens

Dette prosjektet er lisensiert under MIT-lisensen. Se `LICENSE`-filen for detaljer.

## ✉️ Kontakt

Gørkem Guven - [gorkem@example.com](mailto:gorkem@example.com)

Prosjekt-link: [https://github.com/Guven311/echoMedic](https://github.com/Guven311/echoMedic)

## 🙏 Takk

- [shadcn/ui](https://ui.shadcn.com) - UI-komponentbibliotek
- [Supabase](https://supabase.com) - Backend-infrastruktur
- [OpenAI](https://openai.com) - AI-tjenester
- [Vite](https://vitejs.dev) - Build-verktøy
