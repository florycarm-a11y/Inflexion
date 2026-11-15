/** @type {import('tailwindcss').Config} */
// Source unique de la configuration Tailwind du site (remplace les tailwind.config inline des pages,
// dont aucun utilitaire personnalisé n'était employé — voir docs/superpowers/specs/2026-11-15-tailwind-compile-design.md).
module.exports = {
  // assets/article-shell.js porte des classes : la coquille React des dossiers d'analyse.
  content: ['./*.html', './*.js', './assets/*.js'],
  theme: { extend: {} },
  plugins: [],
};
