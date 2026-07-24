import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase (pour Server Components et API Routes)
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Peut arriver avec middleware, ignorer
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Peut arriver avec middleware, ignorer
        }
      },
    },
  })
}

// Helper pour récupérer l'utilisateur courant depuis Prisma (avec rôle)
export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      studentProfile: true,
      Company: true,
    },
  })

  return user
}

// Helper pour vérifier si l'utilisateur est authentifié
export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}

// Helper pour vérifier le rôle
export async function hasRole(role: 'STUDENT' | 'RECRUITER' | 'ADMIN') {
  const user = await getCurrentUser()
  return user?.role === role
}

// Helper pour créer un utilisateur dans Prisma après signup Supabase
export async function createUserInPrisma(email: string, password: string, data: {
  firstName: string
  lastName: string
  role: 'STUDENT' | 'RECRUITER'
  phone?: string
}) {
  // Créer l'utilisateur dans Supabase Auth
  const supabase = createServerSupabaseClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Failed to create user')

  // Créer l'utilisateur dans Prisma
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'supabase', // Géré par Supabase Auth
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  })

  return { user, authUser: authData.user }
}
