import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/supabase'
import { z } from 'zod'

// GET /api/jobs - Liste des offres avec filtres
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as any
    const location = searchParams.get('location')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      status: 'PUBLISHED',
    }

    if (type && ['STAGE', 'CDD', 'CDI', 'PETIT_BOULOT'].includes(type)) {
      where.type = type
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Créer une offre (recruteur only)
const createJobSchema = z.object({
  companyId: z.string().uuid(),
  title: z.string().min(5).max(255),
  type: z.enum(['STAGE', 'CDD', 'CDI', 'PETIT_BOULOT']),
  location: z.string().min(2).max(100),
  description: z.string().min(50),
  requirements: z.string().optional(),
  salaryRange: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Vérifier authentification et rôle recruteur
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

    const body = await request.json()
    const validatedData = createJobSchema.parse(body)

    // Vérifier que le recruteur possède bien l'entreprise
    const company = await prisma.company.findFirst({
      where: {
        id: validatedData.companyId,
        createdById: user.id,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 403 }
      )
    }

    const job = await prisma.job.create({
      data: {
        ...validatedData,
        status: 'DRAFT',
      },
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
