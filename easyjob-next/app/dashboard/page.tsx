import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Rediriger selon le rôle
  if (user.role === 'STUDENT') {
    return <StudentDashboard user={user} />
  } else if (user.role === 'RECRUITER') {
    return <RecruiterDashboard user={user} />
  } else {
    return <AdminDashboard user={user} />
  }
}

// Dashboard Étudiant
async function StudentDashboard({ user }: { user: any }) {
  // Récupérer les candidatures de l'étudiant
  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      job: {
        include: {
          company: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'PENDING').length,
    reviewed: applications.filter((a) => a.status === 'REVIEWED').length,
    accepted: applications.filter((a) => a.status === 'ACCEPTED').length,
  }

  return (
    <main>
      <Nav />

      <section className="section bg-blanc-casse min-h-screen">
        <div className="section-container">
          {/* Header */}
          <div className="flex justify-between items-start mb-16">
            <div>
              <div className="inline-block px-3 py-1.5 bg-violet-rare/10 text-violet-rare text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                Étudiant
              </div>
              <h1 className="text-5xl font-light text-noir mb-4">
                Bonjour, {user.firstName}
              </h1>
              <p className="text-gris-fonce">
                {user.studentProfile?.program} • Promo{' '}
                {user.studentProfile?.graduationYear}
              </p>
            </div>
            <Link href="/profile" className="btn-secondary">
              Modifier mon profil
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 mb-16">
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-noir mb-2">
                {stats.total}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                Candidatures
              </div>
            </div>
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-rose-tbs mb-2">
                {stats.pending}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                En attente
              </div>
            </div>
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-violet-rare mb-2">
                {stats.reviewed}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                En révision
              </div>
            </div>
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-noir mb-2">
                {stats.accepted}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                Acceptées
              </div>
            </div>
          </div>

          {/* Candidatures */}
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-light text-noir">
                Mes candidatures
              </h2>
              <Link href="/jobs" className="btn-secondary">
                Explorer les offres
              </Link>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div
                    key={application.id}
                    className="bg-white border border-gris-clair rounded-xl p-8 hover:border-noir transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-semibold text-noir">
                            {application.job.title}
                          </h3>
                          <span
                            className={`badge ${
                              application.status === 'PENDING'
                                ? 'badge-petit-boulot'
                                : application.status === 'REVIEWED'
                                ? 'badge-stage'
                                : application.status === 'ACCEPTED'
                                ? 'badge-cdi'
                                : 'bg-gris-moyen/10 text-gris-moyen'
                            }`}
                          >
                            {application.status === 'PENDING' && 'En attente'}
                            {application.status === 'REVIEWED' && 'En révision'}
                            {application.status === 'ACCEPTED' && 'Acceptée'}
                            {application.status === 'REJECTED' && 'Refusée'}
                          </span>
                        </div>
                        <p className="text-gris-fonce mb-4">
                          {application.job.company.name} •{' '}
                          {application.job.location}
                        </p>
                        <div className="text-xs text-gris-moyen">
                          Postulé le{' '}
                          {new Date(application.createdAt).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/jobs/${application.job.id}`}
                        className="text-sm text-rose-tbs font-semibold hover:underline"
                      >
                        Voir l'offre →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gris-clair rounded-xl p-16 text-center">
                <p className="text-gris-moyen text-lg mb-8">
                  Vous n'avez pas encore postulé à d'offres.
                </p>
                <Link href="/jobs" className="btn-primary">
                  Explorer les opportunités
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

// Dashboard Recruteur
async function RecruiterDashboard({ user }: { user: any }) {
  // Récupérer les entreprises du recruteur
  const companies = await prisma.company.findMany({
    where: { createdById: user.id },
    include: {
      jobs: {
        include: {
          _count: {
            select: { applications: true },
          },
        },
      },
    },
  })

  const company = companies[0] // Pour simplifier, on prend la première entreprise

  if (!company) {
    return (
      <main>
        <Nav />
        <section className="section bg-blanc-casse min-h-screen">
          <div className="section-container">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-5xl font-light text-noir mb-8">
                Créer votre entreprise
              </h1>
              <p className="text-gris-fonce mb-12">
                Vous devez d'abord créer le profil de votre entreprise avant de
                pouvoir publier des offres.
              </p>
              <Link href="/company/create" className="btn-primary">
                Créer mon entreprise
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    )
  }

  const stats = {
    totalJobs: company.jobs.length,
    published: company.jobs.filter((j) => j.status === 'PUBLISHED').length,
    draft: company.jobs.filter((j) => j.status === 'DRAFT').length,
    totalApplications: company.jobs.reduce(
      (sum, job) => sum + job._count.applications,
      0
    ),
  }

  return (
    <main>
      <Nav />

      <section className="section bg-blanc-casse min-h-screen">
        <div className="section-container">
          {/* Header */}
          <div className="flex justify-between items-start mb-16">
            <div>
              <div className="inline-block px-3 py-1.5 bg-rose-tbs/10 text-rose-tbs text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
                Recruteur
              </div>
              <h1 className="text-5xl font-light text-noir mb-4">
                {company.name}
              </h1>
              <p className="text-gris-fonce">Gérez vos offres d'emploi</p>
            </div>
            <Link href="/jobs/create" className="btn-primary">
              Publier une offre
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 mb-16">
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-noir mb-2">
                {stats.totalJobs}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                Offres totales
              </div>
            </div>
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-rose-tbs mb-2">
                {stats.published}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                Publiées
              </div>
            </div>
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-gris-moyen mb-2">
                {stats.draft}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                Brouillons
              </div>
            </div>
            <div className="bg-white border border-gris-clair rounded-xl p-8">
              <div className="text-4xl font-mono text-violet-rare mb-2">
                {stats.totalApplications}
              </div>
              <div className="text-sm text-gris-moyen uppercase tracking-wider">
                Candidatures
              </div>
            </div>
          </div>

          {/* Offres */}
          <div>
            <h2 className="text-3xl font-light text-noir mb-8">Mes offres</h2>

            {company.jobs.length > 0 ? (
              <div className="space-y-4">
                {company.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-gris-clair rounded-xl p-8 hover:border-noir transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-xl font-semibold text-noir">
                            {job.title}
                          </h3>
                          <span
                            className={`badge ${
                              job.type === 'STAGE'
                                ? 'badge-stage'
                                : job.type === 'CDI'
                                ? 'badge-cdi'
                                : job.type === 'CDD'
                                ? 'badge-cdd'
                                : 'badge-petit-boulot'
                            }`}
                          >
                            {job.type}
                          </span>
                          <span
                            className={`badge ${
                              job.status === 'PUBLISHED'
                                ? 'badge-cdi'
                                : 'bg-gris-moyen/10 text-gris-moyen'
                            }`}
                          >
                            {job.status === 'PUBLISHED'
                              ? 'Publiée'
                              : job.status === 'DRAFT'
                              ? 'Brouillon'
                              : 'Fermée'}
                          </span>
                        </div>
                        <p className="text-gris-fonce mb-4">{job.location}</p>
                        <div className="flex gap-8 text-sm text-gris-moyen">
                          <div>
                            <span className="font-mono text-rose-tbs">
                              {job.viewsCount}
                            </span>{' '}
                            vues
                          </div>
                          <div>
                            <span className="font-mono text-violet-rare">
                              {job._count.applications}
                            </span>{' '}
                            candidatures
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          className="text-sm text-gris-fonce hover:text-noir font-semibold"
                        >
                          Modifier
                        </Link>
                        <Link
                          href={`/jobs/${job.id}/applications`}
                          className="text-sm text-rose-tbs font-semibold hover:underline"
                        >
                          Voir candidatures →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gris-clair rounded-xl p-16 text-center">
                <p className="text-gris-moyen text-lg mb-8">
                  Vous n'avez pas encore publié d'offres.
                </p>
                <Link href="/jobs/create" className="btn-primary">
                  Créer ma première offre
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

// Dashboard Admin (placeholder)
async function AdminDashboard({ user }: { user: any }) {
  return (
    <main>
      <Nav />
      <section className="section bg-blanc-casse min-h-screen">
        <div className="section-container">
          <h1 className="text-5xl font-light text-noir mb-8">
            Dashboard Admin
          </h1>
          <p className="text-gris-fonce">Coming soon...</p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
