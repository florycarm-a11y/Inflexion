import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/supabase'

// GET /api/jobs/[id] - Détail d'une offre
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
            description: true,
            website: true,
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

    // Incrémenter le compteur de vues
    await prisma.job.update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

// PATCH /api/jobs/[id] - Modifier une offre (recruteur only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier authentification
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Recruiter access only' },
        { status: 403 }
      )
    }

    // Vérifier ownership
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
      include: { company: true },
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (existingJob.company.createdById !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied - Not your job' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const job = await prisma.job.update({
      where: { id: params.id },
      data: body,
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    })

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

// DELETE /api/jobs/[id] - Supprimer une offre (recruteur only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier authentification
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'RECRUITER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Recruiter access only' },
        { status: 403 }
      )
    }

    // Vérifier ownership
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id },
      include: { company: true },
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (existingJob.company.createdById !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied - Not your job' },
        { status: 403 }
      )
    }

    await prisma.job.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}
