# EasyJob Next.js - Contexte Technique pour Claude Code

**Design System "Connexions"** • Next.js 14 • TypeScript • Prisma • Supabase

Plateforme de job service complète pour TBS Education avec backend fonctionnel et design minimaliste épuré.

---

## 🎯 Objectif du Projet

EasyJob est le **job service officiel de TBS Education** qui met en relation :
- **Étudiants TBS** : Recherche de stages, CDD, CDI et petits boulots
- **Entreprises** : Accès à un vivier de talents qualifiés

**Philosophie Design** : Minimalisme radical. 90% monochrome (noir/blanc/gris), 10% rose TBS (#EA5256) utilisé avec parcimonie pour un impact maximal.

---

## 📂 Architecture du Projet

### Structure

```
easyjob-next/
├── app/                       # Next.js App Router
│   ├── api/                   # API Routes (backend)
│   │   └── jobs/
│   │       ├── route.ts       # GET /api/jobs, POST /api/jobs
│   │       └── [id]/
│   │           ├── route.ts   # GET/PATCH/DELETE /api/jobs/[id]
│   │           └── apply/
│   │               └── route.ts # POST /api/jobs/[id]/apply
│   ├── layout.tsx             # Root layout avec fonts
│   ├── page.tsx               # Homepage (Server Component)
│   └── globals.css            # Tailwind + design system tokens
├── components/
│   ├── Nav.tsx                # Navigation sticky avec scroll detection
│   ├── Footer.tsx             # Footer minimaliste
│   └── JobCard.tsx            # Card d'offre avec badge dynamique
├── lib/
│   ├── prisma.ts              # Client Prisma singleton
│   └── supabase.ts            # Client Supabase + auth helpers
├── prisma/
│   └── schema.prisma          # Schéma DB complet (5 models)
├── .env.example               # Template variables d'environnement
├── package.json               # Dependencies
├── tailwind.config.ts         # Config Tailwind + design tokens
├── tsconfig.json              # Config TypeScript
└── README.md                  # Documentation complète
```

---

## 🗄️ Base de Données (Prisma + Supabase PostgreSQL)

### Schéma Principal

**5 modèles** interconnectés avec relations :

#### 1. User
```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  role          UserRole @default(STUDENT)
  firstName     String   @map("first_name")
  lastName      String   @map("last_name")
  phone         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  studentProfile StudentProfile?
  applications   Application[]
  Company        Company[]
}

enum UserRole {
  STUDENT
  RECRUITER
  ADMIN
}
```

**Relations** :
- 1 User → 1 StudentProfile (optional)
- 1 User → N Applications (si étudiant)
- 1 User → N Companies (si recruteur)

#### 2. StudentProfile
```prisma
model StudentProfile {
  userId         String   @id @map("user_id")
  program        String
  graduationYear Int      @map("graduation_year")
  cvUrl          String?  @map("cv_url")
  linkedinUrl    String?  @map("linkedin_url")
  skills         String[] @default([])
  bio            String?  @db.Text

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Cas d'usage** :
- Stocker les infos académiques des étudiants
- CV upload dans Supabase Storage
- Skills array pour matching futur (phase 3)

#### 3. Company
```prisma
model Company {
  id          String   @id @default(uuid())
  name        String
  logoUrl     String?  @map("logo_url")
  description String?  @db.Text
  website     String?
  createdById String   @map("created_by_id")
  createdAt   DateTime @default(now())

  createdBy User  @relation(fields: [createdById], references: [id])
  jobs      Job[]
}
```

**Relations** :
- 1 Company → N Jobs
- 1 Company appartient à 1 User (recruteur)

#### 4. Job (Modèle central)
```prisma
model Job {
  id                String    @id @default(uuid())
  companyId         String    @map("company_id")
  title             String
  type              JobType
  location          String
  description       String    @db.Text
  requirements      String?   @db.Text
  salaryRange       String?   @map("salary_range")
  status            JobStatus @default(DRAFT)
  publishedAt       DateTime? @map("published_at")
  expiresAt         DateTime? @map("expires_at")
  viewsCount        Int       @default(0) @map("views_count")
  applicationsCount Int       @default(0) @map("applications_count")
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  company      Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  applications Application[]

  @@index([status])
  @@index([type])
  @@index([companyId])
}

enum JobType {
  STAGE          # Internship
  CDD            # Fixed-term contract
  CDI            # Permanent contract
  PETIT_BOULOT   # Part-time/student job
}

enum JobStatus {
  DRAFT
  PUBLISHED
  CLOSED
}
```

**Index critiques** :
- `status` : Pour filtrer les offres publiées (requête fréquente)
- `type` : Pour filtrage par type d'offre
- `companyId` : Pour queries de l'entreprise

**Compteurs dénormalisés** :
- `viewsCount` : Incrémenté à chaque GET /api/jobs/[id]
- `applicationsCount` : Incrémenté à chaque candidature

#### 5. Application
```prisma
model Application {
  id            String            @id @default(uuid())
  jobId         String            @map("job_id")
  userId        String            @map("user_id")
  coverLetter   String            @map("cover_letter") @db.Text
  cvUrl         String?           @map("cv_url")
  status        ApplicationStatus @default(PENDING)
  createdAt     DateTime          @default(now())

  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([jobId, userId]) // Un user ne peut postuler qu'une fois par offre
  @@index([userId])
  @@index([jobId])
}

enum ApplicationStatus {
  PENDING
  REVIEWED
  ACCEPTED
  REJECTED
}
```

**Contraintes** :
- `@@unique([jobId, userId])` : Empêche les candidatures multiples

---

## 🔌 API Routes (Backend)

### 1. GET /api/jobs
**Description** : Liste des offres avec filtres et pagination

**Query Params** :
- `type` : `STAGE | CDD | CDI | PETIT_BOULOT`
- `location` : Recherche insensible à la casse (ex: `Toulouse`)
- `search` : Recherche dans `title` et `description`
- `limit` : Nombre d'offres (défaut: 20)
- `offset` : Pagination (défaut: 0)

**Exemple** :
```bash
GET /api/jobs?type=STAGE&location=Toulouse&limit=10
```

**Response** :
```json
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Stage Data Analyst",
      "type": "STAGE",
      "location": "Toulouse",
      "description": "...",
      "company": {
        "name": "Airbus",
        "logoUrl": "https://..."
      },
      "publishedAt": "2026-01-01T10:00:00Z",
      "viewsCount": 42,
      "applicationsCount": 5
    }
  ],
  "total": 347,
  "limit": 10,
  "offset": 0
}
```

**Implémentation** : `easyjob-next/app/api/jobs/route.ts:6-68`

---

### 2. POST /api/jobs
**Description** : Créer une offre (recruteur uniquement)

**⚠️ TODO** : Authentification (ligne 84-87)

**Body** (Zod validation) :
```json
{
  "companyId": "uuid",
  "title": "Stage Data Analyst",
  "type": "STAGE",
  "location": "Toulouse",
  "description": "Description longue minimum 50 caractères...",
  "requirements": "Master 1/2, Python, SQL...",
  "salaryRange": "1200€/mois"
}
```

**Response** : `201 Created` avec l'offre créée (status: DRAFT par défaut)

**Validation** :
- `title` : min 5, max 255 caractères
- `description` : min 50 caractères
- `type` : enum strict
- `companyId` : format UUID

**Implémentation** : `easyjob-next/app/api/jobs/route.ts:70-122`

---

### 3. GET /api/jobs/[id]
**Description** : Détail d'une offre + incrément compteur de vues

**Comportement** :
- Incrémente automatiquement `viewsCount` à chaque requête
- Retourne la company avec nom + logo

**Response** :
```json
{
  "id": "uuid",
  "title": "Stage Data Analyst",
  "type": "STAGE",
  "location": "Toulouse",
  "description": "...",
  "requirements": "...",
  "salaryRange": "1200€/mois",
  "status": "PUBLISHED",
  "publishedAt": "2026-01-01T10:00:00Z",
  "viewsCount": 43,
  "applicationsCount": 5,
  "company": {
    "name": "Airbus",
    "logoUrl": "https://...",
    "website": "https://airbus.com"
  }
}
```

**Implémentation** : `easyjob-next/app/api/jobs/[id]/route.ts:6-42`

---

### 4. PATCH /api/jobs/[id]
**Description** : Modifier une offre (recruteur propriétaire uniquement)

**⚠️ TODO** : Vérification ownership (ligne 47)

**Body** (partiel autorisé) :
```json
{
  "title": "Nouveau titre",
  "status": "PUBLISHED"
}
```

**Response** : `200 OK` avec l'offre modifiée

**Implémentation** : `easyjob-next/app/api/jobs/[id]/route.ts:44-83`

---

### 5. DELETE /api/jobs/[id]
**Description** : Supprimer une offre (recruteur propriétaire uniquement)

**⚠️ TODO** : Vérification ownership (ligne 88)

**Cascade** : Les applications liées sont supprimées automatiquement (`onDelete: Cascade` dans Prisma)

**Response** : `200 OK` avec message de succès

**Implémentation** : `easyjob-next/app/api/jobs/[id]/route.ts:85-110`

---

### 6. POST /api/jobs/[id]/apply
**Description** : Postuler à une offre (étudiant uniquement)

**⚠️ TODO** : Authentification (ligne 14-19)

**Body** :
```json
{
  "coverLetter": "Lettre de motivation...",
  "cvUrl": "https://storage.supabase.co/..."
}
```

**Comportements** :
1. Crée l'application (status: PENDING)
2. Incrémente `job.applicationsCount`
3. **TODO** : Envoyer email au recruteur (ligne 41)

**Contrainte** : `@@unique([jobId, userId])` empêche les candidatures multiples (retourne 400 si doublon)

**Response** : `201 Created` avec l'application

**Implémentation** : `easyjob-next/app/api/jobs/[id]/apply/route.ts:12-66`

---

## 🎨 Design System "Connexions"

### Philosophie

**Minimalisme radical** :
- 90% de l'interface en noir/blanc/gris
- 10% rose TBS (#EA5256) pour les accents stratégiques
- Bordures ultra-fines (0.5px partout)
- Espaces négatifs extrêmes (padding 96px, marges 10%)
- Typographie contrastée (weights 300 vs 600)
- Grille stricte baseline 8px

**Inspiration** : Design suisse, Bauhaus moderne, esthétique épurée premium

---

### Palette de Couleurs

```css
/* Monochromes (90% de l'interface) */
--noir: #0A0A0A
--gris-fonce: #3A3A3A
--gris-moyen: #7A7A7A
--gris-clair: #D4D4D4
--blanc-casse: #FAFAFA
--blanc: #FFFFFF

/* Accents (10% de l'interface) */
--rose-tbs: #EA5256      /* CTAs, compteurs, badges stage */
--violet-rare: #8b5cf6   /* Badges stage uniquement */
--rose-hover: #d43f43    /* Hover boutons */
```

**Règle d'or** : Le rose TBS doit toujours attirer l'œil vers les actions clés (CTAs, compteurs). Ne jamais l'utiliser pour du contenu passif.

---

### Typographie

**Fonts** :
- **Inter** (300, 400, 500, 600) : Police principale
- **JetBrains Mono** (400) : Compteurs et métriques

**Hiérarchie** :
```css
.text-6xl   64px / 300 light   /* Hero title */
.text-5xl   48px / 300 light   /* Section title */
.text-3xl   30px / 300 light   /* Card title */
.text-lg    18px / 400 regular /* Corps de texte */
.text-sm    14px / 600 semibold uppercase tracking-wider /* CTAs */
```

**Tracking** :
- Titres : `-0.02em` (serré)
- CTAs : `+0.05em` (large)

---

### Composants Tailwind

Tous définis dans `easyjob-next/app/globals.css`

#### Boutons

```css
/* Bouton primaire (rose TBS) */
.btn-primary {
  px-12 py-4 bg-rose-tbs text-white
  text-sm font-semibold uppercase tracking-wider
  rounded-xl shadow-md
  hover:bg-rose-hover hover:-translate-y-0.5
  transition-all duration-200
}

/* Bouton secondaire (outline noir) */
.btn-secondary {
  px-12 py-4 bg-white text-noir
  border border-noir rounded-xl
  hover:-translate-y-0.5
}
```

#### Job Card

```css
.job-card {
  bg-white border border-gris-clair rounded-xl
  p-8 transition-all duration-200
  hover:border-noir hover:-translate-y-1 hover:shadow-lg
}
```

#### Badges

```css
.badge {
  px-3 py-1.5 text-xs uppercase tracking-wider rounded-full
}

.badge-stage {
  bg-violet-rare/10 text-violet-rare
}

.badge-cdi {
  bg-rose-tbs/10 text-rose-tbs
}

.badge-cdd {
  bg-noir/10 text-noir
}

.badge-petit-boulot {
  bg-gris-moyen/10 text-gris-moyen
}
```

#### Connection Point

```css
.connection-point {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--rose-tbs);
  outline: 12px solid transparent;
  border: 1px solid var(--rose-tbs);
}
```

**Utilisation** : Marqueur visuel pour symboliser les connexions (concept du design system)

---

### Espacements (Grille 8px)

```css
--space-1: 8px
--space-2: 16px
--space-4: 32px
--space-6: 48px
--space-8: 64px
--space-10: 80px
--space-12: 96px
```

**Règle** : Tous les espacements doivent être des multiples de 8px.

---

### Layout Sections

```css
.section {
  padding: 96px 0;  /* Vertical padding extrême */
}

.section-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 10%;  /* Marges latérales 10% */
}

.section-title {
  font-size: 48px;
  font-weight: 300;
  text-align: center;
  margin-bottom: 64px;
}
```

---

## 🧩 Composants React

### Nav.tsx
**Type** : Client Component (`'use client'`)

**Fonctionnalités** :
- Sticky navigation avec backdrop blur
- Détection scroll (classe `scrolled` ajoutée après 50px)
- Menu mobile hamburger (toggle state)
- Links : Offres, Recruteurs, À propos, Mon espace

**Hooks** :
- `useState` : `scrolled`, `mobileMenuOpen`
- `useEffect` : Listener scroll avec cleanup

**Implémentation** : `easyjob-next/components/Nav.tsx:6-122`

---

### JobCard.tsx
**Type** : Client Component

**Props** :
```typescript
interface JobCardProps {
  job: {
    id: string
    title: string
    type: 'STAGE' | 'CDD' | 'CDI' | 'PETIT_BOULOT'
    location: string
    description: string
    publishedAt: Date | null
    company: {
      name: string
      logoUrl: string | null
    }
  }
}
```

**Fonctionnalités** :
- Badge dynamique avec couleur selon le type
- Calcul "time ago" (Il y a 2h, Il y a 3j)
- Truncate description (150 caractères)
- Link vers `/jobs/[id]`

**Helper** :
```typescript
function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}
```

**Implémentation** : `easyjob-next/components/JobCard.tsx:3-76`

---

### Footer.tsx
**Type** : Server Component

**Design** : Minimaliste
- 3 colonnes : À propos, Liens rapides, Contact
- Copyright © 2026 EasyJob — TBS Education
- Border top gris clair

**Implémentation** : `easyjob-next/components/Footer.tsx:1-68`

---

## 🏠 Homepage (app/page.tsx)

**Type** : Server Component (`async function`)

**Fonctionnalités** :
1. Fetch des 6 dernières offres publiées depuis Prisma
2. Affichage Hero avec titre, compteurs, CTA
3. Section offres (grid 3 colonnes)
4. Section processus (3 étapes)
5. Section recruteurs (CTA card)

**Fetch optimisé** :
```typescript
async function getJobs() {
  const jobs = await prisma.job.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      company: {
        select: { name: true, logoUrl: true }
      }
    },
    orderBy: { publishedAt: 'desc' },
    take: 6
  })
  return jobs
}
```

**Gestion erreur** : Return `[]` si échec (fallback gracieux)

**Dynamic rendering** : `export const dynamic = 'force-dynamic'` pour éviter le cache

**Implémentation** : `easyjob-next/app/page.tsx:9-208`

---

## 🔐 Authentification (TODO)

### État Actuel

**Placeholders présents** dans :
- `POST /api/jobs` (ligne 84)
- `PATCH /api/jobs/[id]` (ligne 47)
- `DELETE /api/jobs/[id]` (ligne 88)
- `POST /api/jobs/[id]/apply` (ligne 14)

**Exemple de TODO** :
```typescript
// TODO: Vérifier authentification et rôle recruteur
// const session = await getSession(request)
// if (!session || session.user.role !== 'RECRUITER') {
//   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
// }
```

### Implémentation Recommandée (Supabase Auth)

**1. Configuration Supabase Auth**

Dans `lib/supabase.ts` :
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}
```

**2. Middleware d'authentification**

Créer `middleware.ts` à la racine :
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Protéger les routes API
  if (req.nextUrl.pathname.startsWith('/api/jobs') && req.method !== 'GET') {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return res
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*']
}
```

**3. Vérification rôle dans API routes**

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Récupérer le user depuis Prisma pour vérifier le rôle
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  })

  if (user?.role !== 'RECRUITER' && user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Créer l'offre...
}
```

**4. Pages à créer**

- `app/login/page.tsx` : Formulaire login avec Supabase Auth
- `app/register/page.tsx` : Formulaire inscription
- `app/dashboard/page.tsx` : Dashboard étudiant/recruteur

---

## 📧 Emails (Resend)

### Configuration

**1. Installation**
```bash
npm install resend
```

**2. Variable d'environnement**
```env
RESEND_API_KEY=re_your_key
```

**3. Créer `lib/email.ts`**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendApplicationNotification(
  recruiterEmail: string,
  job: { title: string },
  student: { firstName: string; lastName: string; email: string }
) {
  await resend.emails.send({
    from: 'EasyJob <noreply@easyjob-tbs.fr>',
    to: recruiterEmail,
    subject: `Nouvelle candidature : ${job.title}`,
    html: `
      <h2>Nouvelle candidature</h2>
      <p><strong>${student.firstName} ${student.lastName}</strong> (${student.email}) a postulé pour <strong>${job.title}</strong>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/applications">Voir la candidature</a></p>
    `
  })
}
```

**4. Appeler dans `POST /api/jobs/[id]/apply`**

```typescript
// Après avoir créé l'application
const recruiter = await prisma.user.findFirst({
  where: { Company: { some: { id: job.companyId } } },
  select: { email: true }
})

if (recruiter) {
  await sendApplicationNotification(
    recruiter.email,
    { title: job.title },
    { firstName: user.firstName, lastName: user.lastName, email: user.email }
  )
}
```

---

## 🚀 Setup Local

### 1. Prérequis

```bash
Node.js 18+
npm ou pnpm
Compte Supabase (gratuit)
```

### 2. Installation

```bash
cd easyjob-next
npm install
```

### 3. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer :
   - URL du projet (Dashboard → Settings → API)
   - Anon key (clé publique)
   - Service key (clé privée)
   - Connection string PostgreSQL (Dashboard → Settings → Database)

3. Créer `.env.local` :

```bash
cp .env.example .env.local
```

4. Remplir `.env.local` :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# Resend (optionnel pour MVP)
RESEND_API_KEY=re_your_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Créer les tables (push schema)
npx prisma db push

# (Optionnel) Seed avec données de test
npx prisma db seed
```

### 5. Lancer le serveur dev

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) 🎉

---

## 🐛 Debugging

### Problème : "Can't reach database"

```bash
# Vérifier DATABASE_URL dans .env.local
# S'assurer que le projet Supabase est actif
npx prisma db push --force-reset
```

### Problème : "Module not found: Can't resolve '@/...'"

```bash
# Relancer le serveur dev
rm -rf .next
npm run dev
```

### Problème : Prisma Client non généré

```bash
npx prisma generate
```

---

## 🚢 Déploiement Vercel

### 1. Push vers GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/easyjob-next.git
git push -u origin main
```

### 2. Import sur Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. "Import Project" → Sélectionner le repo GitHub
3. Framework Preset : Next.js (détecté automatiquement)
4. Configurer les **Environment Variables** (même que `.env.local`) :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (ex: `https://easyjob.vercel.app`)

5. Deploy 🚀

### 3. Domaine Personnalisé

Vercel → Settings → Domains → Add `easyjob.tbs-education.fr`

### 4. Prisma sur Vercel

⚠️ **Important** : Prisma Client doit être généré à chaque build.

**Vérifier `package.json`** :
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "next build"
  }
}
```

Vercel exécutera automatiquement `postinstall` avant le build.

---

## 📊 Roadmap

### Phase 1 (MVP) ✅
- [x] Setup Next.js + Prisma + Supabase
- [x] Design system Connexions intégré
- [x] API routes basiques (jobs)
- [x] Homepage avec vraies données DB
- [ ] **Authentification Supabase** (en cours)
- [ ] Pages login/register
- [ ] Dashboard recruteur
- [ ] Upload CV (Supabase Storage)

### Phase 2
- [ ] Système emails (Resend)
- [ ] Filtres avancés (location, type, search)
- [ ] Recherche full-text (PostgreSQL tsvector)
- [ ] Analytics (Vercel Analytics)
- [ ] Tests (Vitest + Playwright)

### Phase 3
- [ ] Matching IA (OpenAI API) : Suggérer offres selon profil étudiant
- [ ] Notifications push (Web Push API)
- [ ] Chat recruteur-étudiant (Supabase Realtime)
- [ ] Mobile app (React Native)

---

## ⚠️ TODOs Critiques

### Sécurité (Avant Production)

- [ ] **Implémenter authentification complète** (Supabase Auth)
- [ ] **Protéger les routes API** (middleware auth)
- [ ] **Vérifier ownership** sur PATCH/DELETE (user owns resource)
- [ ] **Rate limiting** (éviter spam candidatures)
- [ ] **Sanitize inputs** (XSS protection)
- [ ] **CSRF tokens** sur formulaires
- [ ] **HTTPS obligatoire** (Vercel le fait auto)
- [ ] **Gestion des rôles** (STUDENT vs RECRUITER vs ADMIN)

### Emails

- [ ] Implémenter `sendApplicationNotification` dans `/api/jobs/[id]/apply`
- [ ] Email de bienvenue à l'inscription
- [ ] Email de confirmation après candidature
- [ ] Digest hebdomadaire des nouvelles offres (étudiant)
- [ ] Digest quotidien des candidatures (recruteur)

### UI/UX

- [ ] Page `/jobs` avec filtres et search
- [ ] Page `/jobs/[id]` détail d'offre
- [ ] Page `/dashboard` différenciée selon rôle
- [ ] Formulaire création d'offre (recruteur)
- [ ] Formulaire candidature avec upload CV
- [ ] Page profil étudiant (édition skills, CV, bio)

---

## 📝 Conventions de Code

### TypeScript

- **Strict mode** : Activé (`tsconfig.json`)
- **Nommage** :
  - Components : `PascalCase` (ex: `JobCard.tsx`)
  - Functions : `camelCase` (ex: `getJobs()`)
  - Constants : `UPPER_SNAKE_CASE` (ex: `DATABASE_URL`)

### Prisma

- **Nommage DB** : `snake_case` avec `@map()`
- **Relations** : Toujours définir `onDelete` (Cascade ou Restrict)
- **Index** : Ajouter sur les champs filtrés fréquemment

### API Routes

- **Validation** : Toujours utiliser Zod pour valider les inputs
- **Erreurs** :
  - 400 Bad Request : Validation failed
  - 401 Unauthorized : Pas authentifié
  - 403 Forbidden : Pas le bon rôle
  - 404 Not Found : Ressource introuvable
  - 500 Internal Server Error : Erreur serveur

### CSS

- **Tailwind** : Privilégier les utility classes
- **Custom classes** : Définir dans `globals.css` uniquement si réutilisées 3+ fois
- **Responsive** : Mobile-first (`sm:`, `md:`, `lg:`)

---

## 🎯 Points Clés pour Claude Code

1. **Design "Connexions"** : Minimalisme radical = 90% monochrome, 10% rose TBS
2. **Prisma relations** : Toujours inclure les relations nécessaires dans les queries
3. **API validation** : Zod schemas définis avant les handlers
4. **TODO auth** : Ne pas implémenter d'authentification sans demande explicite
5. **Compteurs** : `viewsCount` et `applicationsCount` sont dénormalisés pour performance
6. **Type-safety** : TypeScript strict, jamais de `any` (sauf `where` Prisma)
7. **Responsive** : Grille 3 colonnes desktop, 2 tablet, 1 mobile
8. **Emails** : TODO dans `/api/jobs/[id]/apply:41`, attendre config Resend

---

## 📚 Ressources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Resend Docs](https://resend.com/docs)
- [Zod Docs](https://zod.dev)

---

**Développé avec précision pour les étudiants et entreprises de TBS Education** 🎓
