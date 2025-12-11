echoMedic

En webapp for compliance-analyse og dokumenthåndtering innen helsesektoren.

Kom i gang

1. Klon og installer:
   `powershell
git clone https://github.com/Guven311/echoMedic.git
cd echoMedic
npm install
`

2. Miljøvariabler (.env.development eller .env.local):
   `	ext
VITE_SUPABASE_URL=https://wybkixbkhgfqcmmrczbl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[din-offentlige-nokkel]
VITE_SUPABASE_PROJECT_ID=wybkixbkhgfqcmmrczbl
`

3. Start dev-server:
   `powershell
npm run dev
`

Appen kjører på http://localhost:5173

Funksjoner

- Dokumentanalyse med AI
- Compliance-sjekk
- Risiko-vurdering
- Bruker-dashboard
- Sikker autentisering

Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **AI:** OpenAI API

Deploy

Frontend:
`powershell
npm run build
`

Supabase-funksjon:
`powershell
supabase functions deploy analyze-document
`

(Sett AI_API_KEY secret i Supabase Dashboard for OpenAI-integrasjon)

Struktur

`src/             React-komponenter og sider
supabase/        Edge Functions og migrasjoner`


