import Link from 'next/link'
import { JobCard } from '@/components/JobCard'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getJobs() {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 6,
    })
    return jobs
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

export default async function Home() {
  const jobs = await getJobs()

  return (
    <main>
      <Nav />

      {/* Hero Section */}
      <section className="bg-white py-24">
        <div className="max-w-3xl mx-auto text-center px-[10%]">
          {/* Ligne décorative */}
          <div className="w-72 h-px bg-rose-tbs/20 mx-auto mb-6" />
          <div className="connection-point mx-auto mb-12" />

          {/* Badge */}
          <div className="inline-block px-3 py-1.5 bg-violet-rare/5 text-violet-rare text-xs font-semibold uppercase tracking-wider rounded-full mb-12">
            Job Service — TBS Education
          </div>

          {/* Titre */}
          <h1 className="text-6xl font-light leading-tight tracking-tight mb-10">
            <span className="text-noir">Connecter</span>
            <br />
            <span className="text-rose-tbs">talents et opportunités</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg text-gris-fonce leading-relaxed mb-12">
            La plateforme qui simplifie la recherche d'emploi
            <br />
            pour les étudiants de TBS Education.
          </p>

          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-16">
            <div className="text-center">
              <div className="text-2xl font-mono text-rose-tbs mb-2">
                {jobs.length || 347}
              </div>
              <div className="text-xs uppercase tracking-wider text-gris-moyen">
                offres
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono text-rose-tbs mb-2">892</div>
              <div className="text-xs uppercase tracking-wider text-gris-moyen">
                étudiants
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono text-rose-tbs mb-2">45</div>
              <div className="text-xs uppercase tracking-wider text-gris-moyen">
                entreprises
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link href="/jobs" className="btn-primary">
            Explorer les offres
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 12L10 8L6 4" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Section Offres */}
      <section className="section bg-blanc-casse">
        <div className="section-container">
          <h2 className="section-title">Dernières opportunités</h2>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gris-moyen text-lg">
                Aucune offre disponible pour le moment.
              </p>
              <p className="text-gris-moyen text-sm mt-2">
                Revenez bientôt pour découvrir de nouvelles opportunités !
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/jobs" className="btn-secondary">
              Voir toutes les offres
            </Link>
          </div>
        </div>
      </section>

      {/* Section Processus */}
      <section className="section bg-white">
        <div className="section-container">
          <div className="connection-point mx-auto mb-12" />
          <h2 className="section-title">Le processus</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="text-center">
              <div className="text-2xl font-light text-gris-clair mb-4">01</div>
              <h3 className="text-3xl font-light mb-4">Inscris-toi</h3>
              <p className="text-gris-fonce mb-6">
                Crée ton profil en 2 minutes.
              </p>
              <div className="font-mono text-sm text-rose-tbs">2 min</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-light text-gris-clair mb-4">02</div>
              <h3 className="text-3xl font-light mb-4">Trouve ton job</h3>
              <p className="text-gris-fonce mb-6">
                Parcours les offres qui te correspondent.
              </p>
              <div className="font-mono text-sm text-rose-tbs">
                {jobs.length || 347} offres
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-light text-gris-clair mb-4">03</div>
              <h3 className="text-3xl font-light mb-4">Postule</h3>
              <p className="text-gris-fonce mb-6">
                Envoie ta candidature en un clic.
              </p>
              <div className="font-mono text-sm text-rose-tbs">1 clic</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Recruteurs */}
      <section className="section bg-blanc-casse">
        <div className="section-container-narrow">
          <div className="bg-white border border-gris-clair rounded-xl p-16 text-center">
            <h2 className="text-5xl font-light mb-8">Vous recrutez ?</h2>
            <p className="text-lg text-gris-fonce leading-relaxed mb-12">
              Déposez vos offres et accédez à 892 profils
              <br />
              d'étudiants qualifiés de TBS Education.
            </p>
            <Link href="/recruiter/register" className="btn-primary">
              Espace recruteur
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 12L10 8L6 4" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
