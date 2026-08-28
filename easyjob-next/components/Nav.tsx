'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gris-clair transition-shadow ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-[10%]">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="text-lg font-semibold text-noir">
            EasyJob
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span className="w-6 h-0.5 bg-noir transition-all" />
            <span className="w-6 h-0.5 bg-noir transition-all" />
          </button>

          {/* Desktop menu */}
          <ul className="hidden md:flex items-center gap-12">
            <li>
              <Link
                href="/jobs"
                className="text-sm font-medium text-gris-moyen uppercase tracking-wider hover:text-noir transition-colors"
              >
                Offres
              </Link>
            </li>
            <li>
              <Link
                href="/recruiter/register"
                className="text-sm font-medium text-gris-moyen uppercase tracking-wider hover:text-noir transition-colors"
              >
                Recruteurs
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-sm font-medium text-gris-moyen uppercase tracking-wider hover:text-noir transition-colors"
              >
                À propos
              </Link>
            </li>
            <li>
              <Link href="/login" className="btn-secondary-small">
                Mon espace
              </Link>
            </li>
          </ul>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-gris-clair md:hidden">
              <ul className="flex flex-col gap-4 p-6">
                <li>
                  <Link
                    href="/jobs"
                    className="text-sm font-medium text-gris-moyen uppercase tracking-wider"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Offres
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recruiter/register"
                    className="text-sm font-medium text-gris-moyen uppercase tracking-wider"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Recruteurs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-sm font-medium text-gris-moyen uppercase tracking-wider"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    À propos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="btn-secondary-small"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mon espace
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
