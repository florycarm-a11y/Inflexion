import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-blanc-casse border-t border-gris-clair">
      <div className="max-w-7xl mx-auto px-[10%] py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          {/* Brand */}
          <div>
            <div className="text-lg font-semibold text-noir mb-2">
              EasyJob
            </div>
            <p className="text-sm text-gris-moyen leading-normal">
              Le job service de
              <br />
              TBS Education
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-xs font-semibold text-gris-moyen uppercase tracking-wider mb-4">
              Liens
            </div>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/jobs"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  Offres
                </Link>
              </li>
              <li>
                <Link
                  href="/recruiter/register"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  Recruteurs
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  À propos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="text-xs font-semibold text-gris-moyen uppercase tracking-wider mb-4">
              Contact
            </div>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:contact@easyjob-tbs.fr"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  contact@easyjob-tbs.fr
                </a>
              </li>
              <li>
                <a
                  href="tel:0561294949"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  05 61 29 49 49
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <div className="text-xs font-semibold text-gris-moyen uppercase tracking-wider mb-4">
              Suivez-nous
            </div>
            <ul className="space-y-4">
              <li>
                <a
                  href="#"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm font-medium text-noir hover:text-rose-tbs transition-colors"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gris-clair pt-8">
          <p className="text-center text-xs text-gris-moyen">
            © 2026 EasyJob — TBS Education
          </p>
        </div>
      </div>
    </footer>
  )
}
