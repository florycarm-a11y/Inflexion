import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/supabase'
import { z } from 'zod'

const applySchema = z.object({
  coverLetter: z.string().min(100).max(5000).optional(),
  cvUrl: z.string().url().optional(),
})

// POST /api/jobs/[id]/apply - Postuler à une offre (étudiant only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier authentification
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden - Students only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = applySchema.parse(body)

    // Vérifier que le job existe et est publié
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        company: {
          include: {
            createdBy: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This job is not accepting applications' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur n'a pas déjà postulé
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_userId: {
          jobId: params.id,
          userId: user.id,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      )
    }

    // Créer la candidature
    const application = await prisma.application.create({
      data: {
        jobId: params.id,
        userId: user.id,
        coverLetter: validatedData.coverLetter,
        cvUrl: validatedData.cvUrl,
        status: 'PENDING',
      },
    })

    // Incrémenter le compteur de candidatures
    await prisma.job.update({
      where: { id: params.id },
      data: { applicationsCount: { increment: 1 } },
    })

    // TODO: Envoyer emails
    // await sendApplicationNotification(job.company.createdBy.email, job, user)
    // await sendApplicationConfirmation(user.email, job)

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}
