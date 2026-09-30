import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['STUDENT', 'RECRUITER']),
  // Student fields
  program: z.string().optional(),
  graduationYear: z.number().int().optional(),
  // Recruiter fields
  companyName: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Validation conditionnelle
    if (validatedData.role === 'STUDENT') {
      if (!validatedData.program || !validatedData.graduationYear) {
        return NextResponse.json(
          { error: 'Program and graduation year are required for students' },
          { status: 400 }
        )
      }
    }

    if (validatedData.role === 'RECRUITER') {
      if (!validatedData.companyName) {
        return NextResponse.json(
          { error: 'Company name is required for recruiters' },
          { status: 400 }
        )
      }
    }

    // Créer l'utilisateur dans Supabase Auth
    const supabase = createServerSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Créer l'utilisateur dans Prisma avec transaction
    const user = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          email: validatedData.email,
          passwordHash: 'supabase', // Géré par Supabase
          role: validatedData.role,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
        },
      })

      // Si étudiant, créer le profil
      if (validatedData.role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            program: validatedData.program!,
            graduationYear: validatedData.graduationYear!,
          },
        })
      }

      // Si recruteur, créer l'entreprise
      if (validatedData.role === 'RECRUITER') {
        await tx.company.create({
          data: {
            name: validatedData.companyName!,
            website: validatedData.companyWebsite || null,
            createdById: newUser.id,
          },
        })
      }

      return newUser
    })

    // Connecter automatiquement l'utilisateur
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (signInError) {
      console.error('Auto sign-in failed:', signInError)
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
