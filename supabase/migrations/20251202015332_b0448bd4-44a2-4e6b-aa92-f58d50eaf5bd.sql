-- Update courses with enhanced content including multi-choice questions and images
UPDATE courses SET content = jsonb_build_object(
  'modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'intro-1',
      'title', 'Velkommen til EchoMedic Compliance',
      'content', '# Velkommen til EchoMedic Compliance-systemet

![Compliance Dashboard](/src/assets/course-compliance-intro.jpg)

EchoMedic sitt compliance-system er designet for å hjelpe deg med å navigere komplekse regulatoriske krav innen medisinsk utstyr, AI-systemer og informasjonssikkerhet.

## Systemets hovedfunksjoner

- **Dokumenthåndtering**: Sentralisert lagring og versjonskontroll
- **Risikovurdering**: Systematisk identifisering og håndtering av risikoer
- **Rammeverk**: Støtte for ISO 13485, ISO 42001, ISO 27001, Normen og GDPR
- **Rapportering**: Automatisert compliance-rapportering

## Navigasjon

Systemet er organisert med følgende hovedseksjoner:
- Dashboard for oversikt
- Dokumenter for all dokumentasjon
- Risiko for risikovurderinger
- Rammeverk for compliance-krav
- Rapporter for status og fremdrift',
      'quiz', jsonb_build_object(
        'question', 'Hvilke av følgende er hovedfunksjoner i EchoMedic Compliance-systemet?',
        'options', jsonb_build_array(
          'Dokumenthåndtering og versjonskontroll',
          'Sosiale medier integrasjon',
          'Risikovurdering og håndtering',
          'Videokonferanse'
        ),
        'correctAnswers', jsonb_build_array(0, 2),
        'explanation', 'Systemet fokuserer på dokumenthåndtering, risikovurdering, rammeverk og rapportering - ikke sosiale medier eller videokonferanse.'
      )
    ),
    jsonb_build_object(
      'id', 'intro-2',
      'title', 'Ditt ansvar',
      'content', '# Ditt ansvar som bruker

Som bruker av EchoMedic Compliance-systemet har du viktige plikter:

## Databehandling
- Håndter all pasientdata i henhold til GDPR
- Rapporter umiddelbart ved mistanke om databrudd
- Følg retningslinjene for tilgangskontroll

## Dokumentasjon
- Hold dokumentasjon oppdatert og nøyaktig
- Bruk riktig versjonskontroll
- Sørg for at alle endringer er godkjent

## Compliance
- Følg alle relevante standarder og reguleringer
- Delta i nødvendige opplæringer
- Rapporter avvik og hendelser',
      'quiz', jsonb_build_object(
        'question', 'Hva skal du gjøre ved mistanke om databrudd?',
        'options', jsonb_build_array(
          'Vente til neste møte med leder',
          'Rapportere umiddelbart',
          'Ignorere det hvis du er usikker',
          'Slette alle spor'
        ),
        'correctAnswers', jsonb_build_array(1),
        'explanation', 'Ved mistanke om databrudd må du rapportere umiddelbart i henhold til GDPR-kravene.'
      )
    ),
    jsonb_build_object(
      'id', 'intro-3',
      'title', 'Kom i gang',
      'content', '# Kom i gang med systemet

## Første steg

1. **Fullfør denne opplæringen** - Gjennomfør alle obligatoriske kurs
2. **Sett opp profilen din** - Legg til kontaktinformasjon
3. **Utforsk dashboardet** - Gjør deg kjent med grensesnittet
4. **Les relevante retningslinjer** - Finn dem under Retningslinjer-seksjonen

## Få hjelp

Hvis du trenger hjelp:
- Kontakt din avdelingsleder
- Send e-post til compliance@echomedic.no
- Bruk hjelpefunksjonen i systemet (kommer snart)

## Neste kurs

Etter dette kurset, fortsett med "Informasjonssikkerhet og GDPR" for å lære mer om datasikkerhet.',
      'quiz', jsonb_build_object(
        'question', 'Hva er første steg når du begynner å bruke systemet?',
        'options', jsonb_build_array(
          'Begynne å laste opp dokumenter',
          'Fullføre obligatorisk opplæring',
          'Invitere kolleger',
          'Endre systeminnstillinger'
        ),
        'correctAnswers', jsonb_build_array(1),
        'explanation', 'Det første steget er alltid å fullføre den obligatoriske opplæringen for å forstå systemet og dine plikter.'
      )
    )
  )
) WHERE title = 'Introduksjon til Compliance-systemet';

UPDATE courses SET content = jsonb_build_object(
  'modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'security-1',
      'title', 'Grunnleggende informasjonssikkerhet',
      'content', '# Grunnleggende informasjonssikkerhet

![Security and GDPR](/src/assets/course-security-gdpr.jpg)

Informasjonssikkerhet handler om å beskytte data mot uautorisert tilgang, endring eller ødeleggelse.

## De tre søylene (CIA-triaden)

**Konfidensialitet (Confidentiality)**
- Kun autoriserte personer har tilgang
- Kryptering av sensitiv data
- Tilgangskontroll og autentisering

**Integritet (Integrity)**
- Data er nøyaktig og pålitelig
- Beskyttelse mot uautoriserte endringer
- Logging av alle endringer

**Tilgjengelighet (Availability)**
- Data er tilgjengelig når det trengs
- Backup og disaster recovery
- Redundante systemer',
      'quiz', jsonb_build_object(
        'question', 'Hva står CIA-triaden for i informasjonssikkerhet?',
        'options', jsonb_build_array(
          'Computer, Internet, Access',
          'Confidentiality, Integrity, Availability',
          'Control, Implementation, Audit',
          'Cyber, Information, Analysis'
        ),
        'correctAnswers', jsonb_build_array(1),
        'explanation', 'CIA-triaden står for Confidentiality (konfidensialitet), Integrity (integritet) og Availability (tilgjengelighet) - de tre grunnpilarene i informasjonssikkerhet.'
      )
    ),
    jsonb_build_object(
      'id', 'security-2',
      'title', 'GDPR og personvern',
      'content', '# GDPR og personvern

General Data Protection Regulation (GDPR) er EUs personvernforordning som regulerer behandling av personopplysninger.

## Viktige prinsipper

1. **Lovlighet, rettferdighet og åpenhet**
   - Behandle data lovlig og transparent
   
2. **Formålsbegrensning**
   - Kun samle data for spesifikke formål
   
3. **Dataminimering**
   - Kun samle nødvendige data
   
4. **Riktighet**
   - Hold data oppdatert og korrekt
   
5. **Lagringsbegrensning**
   - Ikke lagre data lenger enn nødvendig
   
6. **Integritet og konfidensialitet**
   - Sikre data mot tap og uautorisert tilgang

## Registrertes rettigheter

- Rett til innsyn
- Rett til sletting
- Rett til korrigering
- Rett til dataportabilitet',
      'quiz', jsonb_build_object(
        'question', 'Hvilke av følgende er GDPR-prinsipper?',
        'options', jsonb_build_array(
          'Dataminimering',
          'Maksimal datasamling',
          'Lagringsbegrensning',
          'Ubegrenset lagring'
        ),
        'correctAnswers', jsonb_build_array(0, 2),
        'explanation', 'GDPR krever dataminimering (kun samle nødvendige data) og lagringsbegrensning (ikke lagre lenger enn nødvendig).'
      )
    ),
    jsonb_build_object(
      'id', 'security-3',
      'title', 'Praktisk sikkerhet i hverdagen',
      'content', '# Praktisk sikkerhet i hverdagen

## Passordsikkerhet

✅ **Gjør dette:**
- Bruk unike passord for hver tjeneste
- Minst 12 tegn med blanding av tegn
- Bruk passordbehandler
- Aktiver tofaktorautentisering

❌ **Ikke gjør dette:**
- Gjenbruk passord
- Bruk enkle ord eller mønstre
- Skriv ned passord på synlige steder
- Del passord med andre

## E-postsikkerhet

- Vær skeptisk til ukjente avsendere
- Ikke klikk på mistenkelige lenker
- Verifiser avsender før du åpner vedlegg
- Rapporter phishing-forsøk

## Arbeidsstasjon

- Lås skjermen når du forlater arbeidsplassen
- Ikke la uautoriserte se skjermen
- Rapporter tapte eller stjålne enheter umiddelbart
- Hold programvare oppdatert',
      'quiz', jsonb_build_object(
        'question', 'Hvilke er gode passordpraksiser?',
        'options', jsonb_build_array(
          'Bruke samme passord overalt for å huske det',
          'Minst 12 tegn med blanding av tegn',
          'Bruke tofaktorautentisering',
          'Skrive ned passord på en Post-it på skjermen'
        ),
        'correctAnswers', jsonb_build_array(1, 2),
        'explanation', 'Gode passordpraksiser inkluderer lange, komplekse passord (minst 12 tegn) og tofaktorautentisering. Aldri gjenbruk passord eller skriv dem ned på synlige steder.'
      )
    )
  )
) WHERE title = 'Informasjonssikkerhet og GDPR';

UPDATE courses SET content = jsonb_build_object(
  'modules', jsonb_build_array(
    jsonb_build_object(
      'id', 'risk-1',
      'title', 'Introduksjon til risikovurdering',
      'content', '# Introduksjon til risikovurdering

![Risk Assessment](/src/assets/course-risk-assessment.jpg)

Risikovurdering er en systematisk prosess for å identifisere, analysere og evaluere risikoer.

## Hvorfor risikovurdering?

- Identifisere potensielle problemer før de oppstår
- Prioritere ressurser effektivt
- Overholde regulatoriske krav
- Beskytte pasienter og brukere
- Forbedre organisasjonens prosesser

## Risikomatrisen

En risikomatrise viser:
- **Sannsynlighet**: Hvor sannsynlig er det at hendelsen skjer?
- **Konsekvens**: Hvor alvorlig er konsekvensen hvis det skjer?
- **Risikoscore**: Sannsynlighet × Konsekvens

### Risikokategorier

- **Lav risiko** (grønn): Akseptabel, normal overvåkning
- **Moderat risiko** (gul): Krev tiltak og oppfølging
- **Høy risiko** (rød): Umiddelbar handling nødvendig',
      'quiz', jsonb_build_object(
        'question', 'Hvordan beregnes risikoscore?',
        'options', jsonb_build_array(
          'Sannsynlighet + Konsekvens',
          'Sannsynlighet × Konsekvens',
          'Kun basert på konsekvens',
          'Kun basert på sannsynlighet'
        ),
        'correctAnswers', jsonb_build_array(1),
        'explanation', 'Risikoscore beregnes ved å multiplisere sannsynlighet med konsekvens. Dette gir en balansert vurdering av både hvor sannsynlig og hvor alvorlig en risiko er.'
      )
    ),
    jsonb_build_object(
      'id', 'risk-2',
      'title', 'Risikohåndtering',
      'content', '# Risikohåndtering

Etter å ha identifisert risikoer, må vi bestemme hvordan vi skal håndtere dem.

## Fire hovedstrategier

**1. Redusere (Mitigate)**
- Implementere tiltak for å redusere sannsynlighet eller konsekvens
- Mest vanlig tilnærming
- Eksempel: Innføre backup-systemer

**2. Akseptere (Accept)**
- Akseptere risikoen som den er
- Brukes for lave risikoer
- Fortsatt overvåkning

**3. Overføre (Transfer)**
- Overføre risiko til tredjepart
- Eksempel: Forsikring
- Outsourcing med kontraktsfestede krav

**4. Unngå (Avoid)**
- Eliminere aktiviteten som skaper risikoen
- Brukes sjeldent
- Kun når risiko er uakseptabel høy

## Tiltaksplan

En god tiltaksplan inneholder:
- Beskrivelse av tiltak
- Ansvarlig person
- Frist for gjennomføring
- Ressurser som trengs
- Oppfølging og evaluering',
      'quiz', jsonb_build_object(
        'question', 'Hvilke av følgende er risikohåndteringsstrategier?',
        'options', jsonb_build_array(
          'Redusere',
          'Ignorere',
          'Overføre',
          'Unngå'
        ),
        'correctAnswers', jsonb_build_array(0, 2, 3),
        'explanation', 'De fire risikohåndteringsstrategiene er: Redusere, Akseptere, Overføre og Unngå. "Ignorere" er ikke en akseptabel strategi.'
      )
    ),
    jsonb_build_object(
      'id', 'risk-3',
      'title', 'Praktisk bruk i systemet',
      'content', '# Praktisk bruk av risikovurdering i systemet

## Opprette ny risikovurdering

1. Gå til Risiko-seksjonen
2. Klikk "Legg til risiko"
3. Fyll ut:
   - Tittel og beskrivelse
   - Kategori
   - Sannsynlighet (1-5)
   - Konsekvens (1-5)
   - Behandlingsstrategi
   - Tiltaksplan

## Oppfølging

- Systemet beregner automatisk risikoscore
- Du får varslinger om frister
- Logg alle endringer og oppfølging
- Koble dokumenter til risikovurderingen

## Rapportering

- Generer risikooversikt
- Filtrer etter kategori, nivå eller ansvarlig
- Eksporter til rapporter
- Dashboard viser høyeste risikoer

## Tips

- Revider risikovurderinger jevnlig
- Involver relevante personer
- Dokumenter alle beslutninger
- Følg opp tiltak systematisk',
      'quiz', jsonb_build_object(
        'question', 'Hva bør inkluderes i en risikovurdering?',
        'options', jsonb_build_array(
          'Kun en tittel',
          'Sannsynlighet og konsekvens',
          'Behandlingsstrategi',
          'Tiltaksplan med ansvarlig og frist'
        ),
        'correctAnswers', jsonb_build_array(1, 2, 3),
        'explanation', 'En komplett risikovurdering skal inneholde sannsynlighet, konsekvens, behandlingsstrategi og en detaljert tiltaksplan med ansvarlig person og frister.'
      )
    )
  )
) WHERE title = 'Risikovurdering og tiltaksplaner';