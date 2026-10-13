# 🚀 EasyJob Next.js - Production-Ready

**Design System "Connexions"** • Next.js 14 • TypeScript • Prisma • Supabase

Site web complet du job service de TBS Education avec backend fonctionnel.

---

## 📋 Stack Technique

### Frontend
- **Next.js 14** : App Router, Server Components, API Routes
- **TypeScript** : Type-safety complète
- **Tailwind CSS** : Styling avec design system Connexions
- **React** : 18.2

### Backend
- **Prisma** : ORM TypeScript pour PostgreSQL
- **Supabase** : PostgreSQL + Auth + Storage
- **Zod** : Validation des données

### Services
- **Resend** : Envoi d'emails transactionnels
- **Vercel** : Hébergement (déploiement automatique)

---

## 🏁 Quick Start

### 1. Prérequis

```bash
Node.js 18+
npm ou pnpm
Compte Supabase (gratuit)
```

### 2. Installation

```bash
# Cloner le projet
cd easyjob-next

# Installer les dépendances
npm install
```

### 3. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier l'URL et la clé publique du projet
3. Créer `.env.local` :

```bash
cp .env.example .env.local
```

4. Remplir `.env.local` :

```env
# Supabase (Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_KEY=votre-service-key

# Database (Dashboard → Settings → Database → Connection String)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.votre-projet.supabase.co:5432/postgres

# Resend (optionnel pour MVP)
RESEND_API_KEY=re_your_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Setup Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Créer les tables (migrations)
npx prisma db push

# (Optionnel) Seed avec données de test
npx prisma db seed
```

### 5. Lancer en Dev

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Structure du Projet

```
easyjob-next/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── jobs/         # CRUD offres
│   │   └── auth/         # Authentification
│   ├── jobs/             # Pages offres
│   ├── login/            # Connexion
│   ├── register/         # Inscription
│   ├── layout.tsx        # Layout root
│   ├── page.tsx          # Homepage
│   └── globals.css       # Styles globaux
├── components/            # Composants React
│   ├── Nav.tsx           # Navigation
│   ├── Footer.tsx        # Footer
│   └── JobCard.tsx       # Card offre
├── lib/                   # Utilitaires
│   ├── prisma.ts         # Client Prisma
│   └── supabase.ts       # Client Supabase
├── prisma/
│   └── schema.prisma     # Schéma DB
├── .env.example          # Template variables d'env
├── next.config.js        # Config Next.js
├── tailwind.config.ts    # Config Tailwind
├── tsconfig.json         # Config TypeScript
└── package.json          # Dépendances
```

---

## 🗄️ Schéma Base de Données

### Tables Principales

**Users** : Étudiants et recruteurs
```typescript
id, email, passwordHash, role (STUDENT | RECRUITER | ADMIN),
firstName, lastName, phone, createdAt, updatedAt
```

**Companies** : Entreprises
```typescript
id, name, logoUrl, description, website, createdById, createdAt
```

**Jobs** : Offres d'emploi
```typescript
id, companyId, title, type (STAGE | CDD | CDI | PETIT_BOULOT),
location, description, requirements, salaryRange,
status (DRAFT | PUBLISHED | CLOSED), publishedAt, expiresAt,
viewsCount, applicationsCount, createdAt, updatedAt
```

**Applications** : Candidatures
```typescript
id, jobId, userId, coverLetter, cvUrl,
status (PENDING | REVIEWED | ACCEPTED | REJECTED), createdAt
```

**StudentProfiles** : Profils étudiants
```typescript
userId, program, graduationYear, cvUrl, linkedinUrl, skills[], bio
```

---

## 🔌 API Routes

### Jobs

```
GET    /api/jobs              # Liste offres (avec filtres)
GET    /api/jobs/[id]         # Détail offre
POST   /api/jobs              # Créer offre (recruteur)
PATCH  /api/jobs/[id]         # Modifier offre (recruteur)
DELETE /api/jobs/[id]         # Supprimer offre (recruteur)
POST   /api/jobs/[id]/apply   # Postuler (étudiant)
```

### Exemples

**Liste des offres avec filtres** :
```bash
GET /api/jobs?type=STAGE&location=Toulouse&limit=10
```

**Créer une offre** :
```bash
POST /api/jobs
Content-Type: application/json

{
  "companyId": "uuid",
  "title": "Stage Data Analyst",
  "type": "STAGE",
  "location": "Toulouse",
  "description": "Description longue...",
  "requirements": "Master 1/2, Python...",
  "salaryRange": "1200€/mois"
}
```

**Postuler** :
```bash
POST /api/jobs/[id]/apply
Content-Type: application/json

{
  "coverLetter": "Votre lettre de motivation...",
  "cvUrl": "https://storage.supabase.co/cv.pdf"
}
```

---

## 🎨 Design System "Connexions"

### Couleurs

```typescript
// Monochromes (90% de l'interface)
noir: '#0A0A0A'
gris-fonce: '#3A3A3A'
gris-moyen: '#7A7A7A'
gris-clair: '#D4D4D4'
blanc-casse: '#FAFAFA'

// Accents (10%)
rose-tbs: '#EA5256'      // CTAs, compteurs
violet-rare: '#8b5cf6'   // Badges stage
```

### Composants Tailwind

```tsx
// Boutons
<button className="btn-primary">Explorer</button>
<button className="btn-secondary">Voir plus</button>

// Card Job
<div className="job-card">...</div>

// Badges
<span className="badge badge-stage">Stage</span>
<span className="badge badge-cdd">CDD</span>

// Inputs
<input className="input" type="text" />
<textarea className="textarea" />
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
2. "Import Project" → Sélectionner le repo
3. Configurer les variables d'environnement (même que .env.local)
4. Deploy 🚀

### 3. Domaine Personnalisé

Vercel → Settings → Domains → Add easyjob.tbs-education.fr

---

## 🔐 TODO Sécurité

Avant production :

- [ ] Implémenter authentification complète (Supabase Auth)
- [ ] Protéger les routes API (middleware auth)
- [ ] Vérifier ownership sur PATCH/DELETE (user owns resource)
- [ ] Rate limiting (éviter spam)
- [ ] Sanitize inputs (XSS protection)
- [ ] CSRF tokens sur formulaires
- [ ] HTTPS obligatoire (Vercel le fait auto)
- [ ] Gestion des rôles (STUDENT vs RECRUITER)

---

## 📧 Emails (Resend)

### Setup

1. Créer compte sur [resend.com](https://resend.com)
2. Vérifier domaine (easyjob-tbs.fr)
3. Copier API key dans `.env.local`

### Implémenter

```typescript
// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendApplicationNotification(
  recruiterEmail: string,
  job: Job,
  student: User
) {
  await resend.emails.send({
    from: 'EasyJob <noreply@easyjob-tbs.fr>',
    to: recruiterEmail,
    subject: `Nouvelle candidature : ${job.title}`,
    html: `
      <h2>Nouvelle candidature</h2>
      <p>${student.firstName} ${student.lastName} a postulé pour ${job.title}</p>
    `
  })
}
```

---

## 🐛 Troubleshooting

### Erreur Prisma "Can't reach database"

```bash
# Vérifier DATABASE_URL dans .env.local
# S'assurer que le projet Supabase est actif
npx prisma db push --force-reset
```

### Erreur "Module not found: Can't resolve '@/...'"

```bash
# Relancer le serveur dev
rm -rf .next
npm run dev
```

### Erreur CORS

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}
```

---

## 📚 Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Resend Docs](https://resend.com/docs)

---

## 📝 Roadmap

### Phase 1 (MVP) ✅
- [x] Setup Next.js + Prisma + Supabase
- [x] Design system Connexions intégré
- [x] API routes basiques (jobs)
- [x] Homepage avec vraies données DB
- [ ] Authentification Supabase
- [ ] Pages login/register
- [ ] Dashboard recruteur
- [ ] Upload CV (Supabase Storage)

### Phase 2
- [ ] Système emails (Resend)
- [ ] Filtres avancés
- [ ] Recherche full-text
- [ ] Analytics (Vercel Analytics)
- [ ] Tests (Vitest + Playwright)

### Phase 3
- [ ] Matching IA (OpenAI API)
- [ ] Notifications push
- [ ] Chat recruteur-étudiant
- [ ] Mobile app (React Native)

---

## 👥 Équipe

- **Design System** : "Connexions" (Minimaliste Épuré)
- **Stack** : Next.js 14 + TypeScript + Prisma
- **École** : TBS Education, Toulouse

---

## 📄 Licence

© 2026 EasyJob — TBS Education. Tous droits réservés.

---

**Développé avec précision pour les étudiants et entreprises de TBS Education** 🎓
