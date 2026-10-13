import Link from 'next/link'
import { Job, Company } from '@prisma/client'

type JobWithCompany = Job & {
  company: Pick<Company, 'name' | 'logoUrl'>
}

const BADGE_CLASSES = {
  STAGE: 'badge-stage',
  CDD: 'badge-cdd',
  CDI: 'badge-cdi',
  PETIT_BOULOT: 'badge-petit-boulot',
}

const BADGE_LABELS = {
  STAGE: 'Stage',
  CDD: 'CDD',
  CDI: 'CDI',
  PETIT_BOULOT: 'Job',
}

function timeAgo(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (hours < 1) return 'Il y a moins d\'1h'
  if (hours < 24) return `Il y a ${hours}h`
  return `Il y a ${days}j`
}

export function JobCard({ job }: { job: JobWithCompany }) {
  return (
    <Link href={`/jobs/${job.id}`} className="job-card">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="text-lg font-semibold text-noir">
          {job.company.name}
        </div>
        <span className={`badge ${BADGE_CLASSES[job.type]}`}>
          {BADGE_LABELS[job.type]}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-light text-noir leading-tight mb-8">
        {job.title}
      </h3>

      {/* Description */}
      <p className="text-base text-gris-fonce leading-relaxed mb-8 line-clamp-3">
        {job.description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center pt-6 border-t border-gris-tres-clair">
        <span className="text-sm font-medium text-noir">
          📍 {job.location}
        </span>
        <span className="text-xs text-gris-moyen">
          {timeAgo(job.publishedAt || job.createdAt)}
        </span>
      </div>
    </Link>
  )
}
