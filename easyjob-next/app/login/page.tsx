'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Rediriger vers le dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blanc-casse flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo / Retour */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-block text-sm text-gris-moyen hover:text-noir transition-colors mb-8"
          >
            ← Retour à l'accueil
          </Link>
          <h1 className="text-5xl font-light text-noir mb-4">Connexion</h1>
          <p className="text-gris-fonce">
            Accédez à votre espace personnel EasyJob
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white border border-gris-clair rounded-xl p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-noir mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-noir mb-2"
              >
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-rose-tbs/10 border border-rose-tbs/20 text-rose-tbs text-sm p-4 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Lien inscription */}
          <div className="mt-8 pt-8 border-t border-gris-clair text-center">
            <p className="text-sm text-gris-fonce">
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="text-rose-tbs font-semibold hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        {/* Message info */}
        <div className="mt-8 text-center text-xs text-gris-moyen">
          <p>
            Réservé aux étudiants TBS Education et entreprises partenaires
          </p>
        </div>
      </div>
    </div>
  )
}
