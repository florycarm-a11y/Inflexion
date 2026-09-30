'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER'>('STUDENT')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Student fields
    program: '',
    graduationYear: new Date().getFullYear() + 1,
    // Recruiter fields
    companyName: '',
    companyWebsite: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      // Rediriger vers le dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blanc-casse py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-block text-sm text-gris-moyen hover:text-noir transition-colors mb-8"
          >
            ← Retour à l'accueil
          </Link>
          <h1 className="text-5xl font-light text-noir mb-4">Inscription</h1>
          <p className="text-gris-fonce">
            Créez votre compte EasyJob en quelques minutes
          </p>
        </div>

        {/* Sélecteur de rôle */}
        <div className="flex gap-4 mb-8">
          <button
            type="button"
            onClick={() => setRole('STUDENT')}
            className={`flex-1 px-8 py-4 rounded-xl border transition-all ${
              role === 'STUDENT'
                ? 'bg-rose-tbs text-white border-rose-tbs'
                : 'bg-white text-gris-fonce border-gris-clair hover:border-noir'
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wider mb-1">
              Étudiant
            </div>
            <div className="text-xs opacity-80">
              Je cherche un stage ou un emploi
            </div>
          </button>
          <button
            type="button"
            onClick={() => setRole('RECRUITER')}
            className={`flex-1 px-8 py-4 rounded-xl border transition-all ${
              role === 'RECRUITER'
                ? 'bg-rose-tbs text-white border-rose-tbs'
                : 'bg-white text-gris-fonce border-gris-clair hover:border-noir'
            }`}
          >
            <div className="text-sm font-semibold uppercase tracking-wider mb-1">
              Recruteur
            </div>
            <div className="text-xs opacity-80">
              Je souhaite recruter des talents
            </div>
          </button>
        </div>

        {/* Formulaire */}
        <div className="bg-white border border-gris-clair rounded-xl p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-noir mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-noir mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-noir mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-noir mb-2">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            {/* Mot de passe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-noir mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-noir mb-2">
                  Confirmer
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Champs spécifiques étudiant */}
            {role === 'STUDENT' && (
              <>
                <div className="pt-6 border-t border-gris-clair">
                  <h3 className="text-lg font-semibold text-noir mb-4">
                    Informations académiques
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-noir mb-2">
                    Programme d'études
                  </label>
                  <input
                    type="text"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    required={role === 'STUDENT'}
                    className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                    placeholder="ex: Master in Management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-noir mb-2">
                    Année de diplomation
                  </label>
                  <select
                    name="graduationYear"
                    value={formData.graduationYear}
                    onChange={handleChange}
                    required={role === 'STUDENT'}
                    className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                  >
                    {[0, 1, 2, 3, 4].map((offset) => {
                      const year = new Date().getFullYear() + offset
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </>
            )}

            {/* Champs spécifiques recruteur */}
            {role === 'RECRUITER' && (
              <>
                <div className="pt-6 border-t border-gris-clair">
                  <h3 className="text-lg font-semibold text-noir mb-4">
                    Informations entreprise
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-noir mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required={role === 'RECRUITER'}
                    className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                    placeholder="ex: Airbus"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-noir mb-2">
                    Site web (optionnel)
                  </label>
                  <input
                    type="url"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gris-clair rounded-xl focus:outline-none focus:border-noir transition-colors"
                    placeholder="https://www.entreprise.com"
                  />
                </div>
              </>
            )}

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
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          {/* Lien connexion */}
          <div className="mt-8 pt-8 border-t border-gris-clair text-center">
            <p className="text-sm text-gris-fonce">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-rose-tbs font-semibold hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
