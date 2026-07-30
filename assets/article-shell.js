/* Coquille partagee des pages d'analyse : navigation, page de garde, pied de page.
   Extraite telle quelle des articles, qui en embarquaient chacun une copie. */

import React,{useState,useEffect} from 'https://esm.sh/react@18.2.0'
import { createRoot } from 'https://esm.sh/react-dom@18.2.0/client'
import { topDimensions, scenarioWidths } from './article-model.js'

const h = React.createElement
export { h, createRoot }

const MEGA_NAV=window.MEGA_NAV

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

export function Navigation(){
const[open,setOpen]=useState(false)
const[scrolled,setScrolled]=useState(false)
useEffect(()=>{
const fn=()=>setScrolled(window.scrollY>60)
window.addEventListener('scroll',fn,{passive:true})
return()=>window.removeEventListener('scroll',fn)
},[])
useEffect(()=>{
if(open){document.body.classList.add('menu-open')}else{document.body.classList.remove('menu-open')}
return()=>document.body.classList.remove('menu-open')
},[open])
return h('div',null,
 h('div',{className:'fixed top-0 left-0 right-0 z-[51] h-[3px] bg-[var(--editorial-accent)]'}),
 h('header',{className:`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 ${scrolled?'nav-scrolled':'bg-transparent'}`},
  h('div',{className:'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'},
   h('div',{className:'flex items-center justify-between h-16'},
    h('a',{href:'index.html',className:'flex items-center gap-2'},
     h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 sm:h-[50px] md:h-[65px] w-auto',style:{filter:'brightness(10) saturate(0)'}})
    ),
    h('nav',{className:'hidden md:flex items-center gap-1'},
     ...MEGA_NAV.map((cat,ci)=>
      h('div',{key:ci,className:'mega-trigger'},
       h('span',{className:'nav-link px-3 py-2 text-sm font-medium transition-colors cursor-default select-none text-[#9AA0A4] hover:text-[#E8E4D8]'},cat.label),
       h('div',{className:'mega-menu bg-[#FFFFFF] border border-[#4C5052] p-5 shadow-[0_6px_18px_rgba(14,16,18,.18)]'},
        h('div',{className:'grid gap-1'},
         ...cat.children.map((item,ii)=>
          h('a',{key:ii,href:item.href,className:'mega-item flex items-start gap-3 px-3 py-2.5 no-underline'},
           h('span',{className:'mega-icon bg-[#EDEBE4] text-[#101214]'},item.icon),
           h('span',{className:'flex flex-col'},
            h('span',{className:'text-sm font-semibold text-[#101214]'},item.label),
            h('span',{className:'text-xs text-[#4C5052] mt-0.5'},item.desc)
           )
          )
         )
        )
       )
      )
     ),
     h('a',{href:'premium.html',className:'ml-4 px-4 py-2 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[#F5EDE6] font-semibold text-sm transition-colors'},'R\u00e9server un diagnostic')
    ),
    h('button',{className:`hamburger md:hidden p-2 ${open?'open':''}`,'aria-label':'Menu','aria-expanded':open,onClick:()=>setOpen(!open)},
     h('span'),h('span'),h('span')
    )
   )
  )
 ),
 h('div',{className:`mobile-overlay fixed inset-0 z-[60] flex flex-col ${open?'open':''}`,style:{backgroundColor:'var(--chrome-ground)'}},
  h('div',{className:'flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0'},
   h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-8 w-auto',style:{filter:'brightness(10) saturate(0)'}}),
   h('button',{onClick:()=>setOpen(false),className:'w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors','aria-label':'Fermer'},
    h('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.5,strokeLinecap:'round',className:'text-white'},h('path',{d:'M18 6L6 18M6 6l12 12'}))
   )
  ),
  h('div',{className:'flex-1 overflow-y-auto px-6 pt-2 pb-4'},
   ...MEGA_NAV.map((cat,ci)=>[
    h('p',{key:'h'+ci,className:'menu-item text-[11px] uppercase tracking-[.2em] text-white/40 font-semibold mb-3'+(ci>0?' mt-8':''),style:{animationDelay:`${0.05+ci*0.18}s`}},cat.label),
    ...cat.children.map((item,ii)=>
     h('a',{key:'m'+ci+'-'+ii,href:item.href,onClick:()=>setOpen(false),className:'menu-item flex items-center gap-3 py-3 text-white/90 hover:text-white transition-colors border-b border-white/8',style:{animationDelay:`${0.08+ci*0.18+ii*0.05}s`}},
      h('span',{className:'text-base'},item.icon),
      h('span',{className:'text-base sm:text-lg md:text-[20px] font-medium'},item.label)
     )
    )
   ]).flat()
  ),
  h('div',{className:'px-6 pt-4 pb-20 flex-shrink-0'},
   h('a',{href:'premium.html',onClick:()=>setOpen(false),className:'menu-item block w-full text-center px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors text-base',style:{animationDelay:'0.85s'}},'R\u00e9server un diagnostic')
  )
 )
)
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────

export function Footer(){
const footerLinks={
intelligence:[
{label:'G\u00e9opolitique',href:'geopolitics.html'},
{label:'March\u00e9s',href:'markets.html'},
{label:'Crypto',href:'crypto.html'},
{label:'Mati\u00e8res premi\u00e8res',href:'commodities.html'},
{label:'ETF & Fonds',href:'etf.html'},
],
plateforme:[
{label:'Analyses',href:'analyses.html'},
{label:'Expertise',href:'expertise.html'},
{label:'Services',href:'premium.html'},
{label:'Diagnostic',href:'premium.html#diagnostic'},
],
}
const sources=['FRED','Finnhub','CoinGecko','DefiLlama','Messari','ECB','IFRI','SIPRI','Chatham House','OPEC']

return h('footer',{className:'v2-chrome bg-[var(--chrome-ground)] pt-12 sm:pt-16 pb-24 sm:pb-20',role:'contentinfo'},
 h('div',{className:'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'},
  h('div',{className:'grid grid-cols-2 md:grid-cols-4 gap-10 mb-12'},
   h('div',{className:'col-span-2 md:col-span-1'},
    h('div',{className:'flex items-center gap-2 mb-4'},
     h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 w-auto',style:{filter:'brightness(10) saturate(0)'}})
    ),
    h('p',{className:'text-sm text-[#9AA0A4] leading-relaxed'},'Intelligence financi\u00e8re et g\u00e9opolitique. Donn\u00e9es en temps r\u00e9el, analyses IA, signaux faibles.')
   ),
   h('div',null,
    h('p',{className:'text-xs font-semibold uppercase tracking-wider text-[#E8E4D8] mb-4'},'Intelligence'),
    h('ul',{className:'space-y-2.5'},
     ...footerLinks.intelligence.map(l=>
      h('li',{key:l.label},h('a',{href:l.href,className:'text-sm text-[#9AA0A4] hover:text-[#E8E4D8] transition-colors'},l.label))
     )
    )
   ),
   h('div',null,
    h('p',{className:'text-xs font-semibold uppercase tracking-wider text-[#E8E4D8] mb-4'},'Plateforme'),
    h('ul',{className:'space-y-2.5'},
     ...footerLinks.plateforme.map(l=>
      h('li',{key:l.label},h('a',{href:l.href,className:'text-sm text-[#9AA0A4] hover:text-[#E8E4D8] transition-colors'},l.label))
     )
    )
   ),
   h('div',null,
    h('p',{className:'text-xs font-semibold uppercase tracking-wider text-[#E8E4D8] mb-4'},'Suivez-nous'),
    h('div',{className:'flex items-center gap-3 mb-4'},
     h('a',{href:'#','aria-label':'LinkedIn',className:'w-9 h-9 bg-[rgba(232,228,216,.10)] hover:bg-[var(--editorial-accent)] hover:text-[#F5EDE6] flex items-center justify-center text-[#9AA0A4] transition-colors'},
      h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'currentColor'},h('path',{d:'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'}))
     ),
     h('a',{href:'#','aria-label':'X / Twitter',className:'w-9 h-9 bg-[rgba(232,228,216,.10)] hover:bg-[var(--editorial-accent)] hover:text-[#F5EDE6] flex items-center justify-center text-[#9AA0A4] transition-colors'},
      h('svg',{width:14,height:14,viewBox:'0 0 24 24',fill:'currentColor'},h('path',{d:'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'}))
     )
    ),
    h('a',{href:'#',className:'text-sm text-[#9AA0A4] hover:text-[#E8E4D8] transition-colors'},'Contact')
   )
  ),
  h('div',{className:'border-t border-[rgba(232,228,216,.14)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4'},
   h('span',{className:'text-sm text-[#9AA0A4]'},'\u00a9 2026 Inflexion \u2014 Intelligence financi\u00e8re & g\u00e9opolitique'),
   h('div',{className:'flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-wider text-[#9AA0A4] font-medium',style:{fontFamily:"'IBM Plex Mono',monospace"}},
    ...sources.map(s=>h('span',{key:s},s))
   )
  )
 )
)
}

// ─── CORPS ─────────────────────────────────────────────────

const ROMAINS = ['I','II','III','IV','V','VI','VII','VIII','IX','X']

/** Une section du corps. Le numéro alimente le rail de progression. */
/* `romain` porte la numérotation D'ORIGINE de l'article (I à V), pas le rang
   dans le tableau : « Thèse centrale », « Évaluation SEMPLICE » et « Trois
   scénarios » n'ont jamais été numérotés. Renuméroter à la volée décalerait
   les parties et casserait toute citation existante (« la partie III »).
   `rang` sert uniquement d'ancre stable. */
export function Section (props, ...children) {
  const { rang, romain, titre } = props
  return h('section', { key: rang, id: 'section-' + rang, className: 'mb-12 scroll-mt-24', 'data-rang': rang, 'data-romain': romain || '' },
    h('h2', { className: 'text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug mb-4' },
      romain
        ? h('span', { className: 'text-[var(--editorial-accent)] mr-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, romain + '.')
        : null,
      titre),
    ...children
  )
}

/** Un paragraphe. Ses sources s'affichent dans la gouttière, en regard. */
export function P (props, ...children) {
  const sources = (props && props.sources) || []
  return h('div', { className: 'md:grid md:grid-cols-[1fr_180px] md:gap-6 mb-5' },
    h('p', { className: 'text-base leading-relaxed text-[var(--text-secondary)]' }, ...children),
    h('aside', { className: 'mt-2 md:mt-0 text-[11px] leading-snug text-[var(--text-secondary)] md:border-l md:border-[var(--hairline-warm)] md:pl-4' },
      sources.length
        ? [
            h('span', { key: 'l', className: 'block uppercase tracking-[0.12em] text-[var(--editorial-accent)] mb-1', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Source'),
            h('span', { key: 's' }, sources.join(' · ')),
          ]
        : null
    )
  )
}

/** Un sous-titre dans une section (remplace les anciens h3). */
export function SousTitre (props, ...children) {
  return h('h3', { className: 'text-base md:text-lg font-semibold text-[var(--editorial-accent)] mt-8 mb-3' }, ...children)
}

/** Corps du dossier : rail de progression + sections. */
export function Body (sections) {
  return h('div', { className: 'max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16' },
    h('div', { className: 'md:grid md:grid-cols-[40px_1fr] md:gap-6' },
      h('nav', { className: 'hidden md:block', 'aria-label': 'Sections' },
        h('ol', { className: 'sticky top-24 space-y-3 text-[11px] text-right pr-3 border-r border-[var(--hairline-warm)]', style: { fontFamily: "'IBM Plex Mono',monospace" } },
          // Le rail lit le romain porté par chaque section. Les sections non
          // numérotées dans l'article d'origine sont marquées d'un point.
          ...sections.map((s, i) =>
            h('li', { key: i },
              h('a', {
                href: '#section-' + s.props['data-rang'],
                title: s.props.titre,
                className: 'text-[var(--text-secondary)] hover:text-[var(--editorial-accent)] transition-colors'
              }, s.props['data-romain'] || '·'))
          )
        )
      ),
      h('div', { className: 'min-w-0' }, ...sections)
    )
  )
}

// ─── PAGE DE GARDE ─────────────────────────────────────────

/* Un score se lit « 5.0/7 », jamais « 5/7 » : la decimale porte la precision
   de l'evaluation. JS rend 5.0 comme "5", d'ou cette mise en forme explicite.
   Le separateur est celui de l'article — le corpus est partage entre le point
   (ukraine, turquie, sahel) et la virgule (mer-chine) ; l'uniformiser d'office
   serait une modification editoriale non demandee. */
function score (v, a) {
  if (typeof v !== 'number') return v
  const t = v.toFixed(1)
  return (a && a.separateurDecimal === ',') ? t.replace('.', ',') : t
}

/* L'horizon des scenarios est propre a chaque article : l'Ukraine annonce
   « 12-24 mois », la Turquie et le Sahel « douze a trente-six prochains mois »,
   Cuba « six a dix-huit ». L'ecrire en dur affichait un horizon FAUX sur toute
   page dont l'horizon differait. */
function titreScenarios (a) {
  return a.horizonScenarios || 'Trois scénarios à 12-24 mois'
}

/** Page de garde — temps 1 du dossier. Tient dans un écran. */
export function Cover (a) {
  const top = topDimensions(a.semplice.dimensions)
  const scenarios = scenarioWidths(a.scenarios)
  return h('section', { className: 'v2-chrome pt-28 pb-12 md:pt-36 md:pb-14', style: { backgroundColor: 'var(--chrome-ground)' } },
    h('div', { className: 'max-w-4xl mx-auto px-4 sm:px-6' },

      h('p', { className: 'text-[11px] uppercase tracking-[0.18em] text-[var(--editorial-accent-text)] mb-4', style: { fontFamily: "'IBM Plex Mono',monospace" } },
        a.categorie + ' · ' + a.zone),
      h('h1', { className: 'text-2xl sm:text-3xl md:text-[2.75rem] font-extrabold text-white leading-[1.15] tracking-tight', style: { fontFamily: "'Archivo',Arial,sans-serif" } }, a.titre),
      h('p', { className: 'mt-5 text-base md:text-lg text-white/60 leading-relaxed' }, a.chapo),
      h('p', { className: 'mt-6 text-xs text-white/40', style: { fontFamily: "'IBM Plex Mono',monospace" } },
        // « références » et non « sources » : la bibliographie liste les references
        // principales, alors que le corps annonce le nombre de sources consultees.
        // Compter ce qu'on affiche evite une contradiction a l'ecran.
        [a.auteur, a.date, a.duree, a.bibliographie.length + ' références'].join('  ·  ')),

      h('div', { className: 'mt-8 pt-8 border-t border-[rgba(232,228,216,.14)] grid md:grid-cols-[minmax(0,30%)_1fr] gap-8' },
        h('div', null,
          h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-2', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Verdict SEMPLICE'),
          h('p', { className: 'text-5xl font-extrabold text-[#006650] leading-none', style: { fontFamily: "'IBM Plex Mono',monospace" } },
            score(a.semplice.risque, a), h('span', { className: 'text-xl text-white/40' }, '/7')),
          h('p', { className: 'mt-2 text-sm text-white/70' }, a.semplice.palier + ' · ' + a.semplice.tendance),
          h('p', { className: 'text-sm text-white/50' }, 'Opportunité ' + score(a.semplice.opportunite, a) + '/7')
        ),
        h('div', null,
          h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Dimensions dominantes'),
          ...top.map(d =>
            h('div', { key: d.cle, className: 'flex items-center gap-3 mb-2' },
              h('span', { className: 'w-24 text-xs text-white/70' }, d.nom),
              h('span', { className: 'flex-1 h-1.5 bg-white/10' },
                h('span', { className: 'block h-1.5 bg-[#006650]', style: { width: (d.risque / 7 * 100) + '%' } })),
              h('span', { className: 'w-10 text-xs text-white/70 text-right', style: { fontFamily: "'IBM Plex Mono',monospace" } }, score(d.risque, a))
            )
          ),
          h('p', { className: 'mt-2 text-[11px] text-white/35' }, 'Les 8 dimensions : tableau complet en fin de dossier.')
        )
      ),

      h('div', { className: 'mt-8' },
        h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, titreScenarios(a)),
        h('div', { className: 'flex gap-1.5' },
          ...scenarios.map((s, i) =>
            h('div', { key: i, className: 'border border-[rgba(232,228,216,.22)] px-3 py-2.5 min-w-0', style: { width: s.width + '%' } },
              h('p', { className: 'text-lg font-bold text-white', style: { fontFamily: "'IBM Plex Mono',monospace" } }, s.proba + ' %'),
              h('p', { className: 'text-[11px] text-white/60 leading-tight' }, s.titre)
            )
          )
        )
      ),

      h('div', { className: 'mt-8 border-l-[3px] border-[var(--editorial-accent-text)] pl-4' },
        h('p', { className: 'text-[11px] uppercase tracking-[0.14em] text-white/40 mb-2', style: { fontFamily: "'IBM Plex Mono',monospace" } }, 'Ce qu\'il faut retenir'),
        h('p', { className: 'text-[15px] text-white/80 leading-relaxed' }, a.retenir)
      ),

      h('div', { className: 'mt-8 pt-6 border-t border-[rgba(232,228,216,.14)] grid grid-cols-2 md:grid-cols-4 gap-5' },
        ...a.chiffres.map((c, i) =>
          h('div', { key: i },
            h('p', { className: 'text-xl font-bold text-white', style: { fontFamily: "'IBM Plex Mono',monospace" } }, c.valeur),
            h('p', { className: 'text-[11px] text-white/50 leading-tight mt-1' }, c.libelle)
          )
        )
      )
    )
  )
}

// ─── APPAREIL CRITIQUE ─────────────────────────────────────

/* Paliers de la matrice d'impact. Ces couleurs encodent une DONNÉE (niveau de
   risque / opportunité) : elles sont reprises telles quelles de la page
   d'origine et ne suivent pas la palette d'identité. */
/* Repli seulement. Chaque article définit sa PROPRE échelle de gravité : la
   Turquie peint « ÉLEVÉ » en #DC2626 là où l'Ukraine y met #f59e0b et réserve
   le rouge à « CRITIQUE ». Mapper globalement par libellé décale l'échelle et
   fait passer un palier pour moins grave qu'il n'est — c'est une altération de
   couleur-DONNÉE. Chaque ligne de matrice doit donc porter son `style` repris
   du fichier d'origine ; ce tableau ne sert que si l'article n'en fournit pas. */
const NIVEAUX = {
  'CRITIQUE':    { backgroundColor: '#DC2626', color: '#FFFFFF' },
  'ÉLEVÉ':       { backgroundColor: '#f59e0b', color: '#FFFFFF' },
  'MODÉRÉ':      { backgroundColor: '#f59e0b', color: '#FFFFFF' },
  'OPPORTUNITÉ': { backgroundColor: 'rgba(0,102,80,.1)', color: '#006650' },
}

/** Style du badge d'un palier : celui de l'article s'il est fourni, sinon le repli. */
function styleNiveau (ligne) {
  return ligne.style || NIVEAUX[ligne.niveau] || NIVEAUX['MODÉRÉ']
}

/* Échelle de gravité des cartes de scénario, du plus favorable au plus grave.
   Couleurs-DONNÉE elles aussi : les classes sont recopiées mot pour mot de la
   page d'origine, opacités comprises, et indexées par le rang du scénario. */
const GRAVITE = [
  { carte: 'border border-[#006650]/20 bg-[#F0FAF5]', entete: 'bg-[#006650]/10 border-b border-[#006650]/20', titre: 'text-[#006650]', badge: 'text-[#006650] bg-[#006650]/10' },
  { carte: 'border border-[#EAB308]/20 bg-[#FFFBEB]', entete: 'bg-[#EAB308]/10 border-b border-[#EAB308]/20', titre: 'text-[#92400E]', badge: 'text-[#92400E] bg-[#EAB308]/10' },
  { carte: 'border border-[#DC2626]/20 bg-[#FEF2F2]', entete: 'bg-[#DC2626]/10 border-b border-[#DC2626]/20', titre: 'text-[#991B1B]', badge: 'text-[#991B1B] bg-[#DC2626]/10' },
]

const TH = 'px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--hairline-warm)]'
const TD = 'px-3 py-2.5'
const LIGNE = 'border-b border-[var(--hairline-warm)]'

function TitreAppareil (texte) {
  return h('h2', { className: 'text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-snug mb-4' }, texte)
}

/** Appareil critique — temps 3 du dossier : ce qui étaye l'analyse (SEMPLICE,
 * scénarios, matrice, alertes, sources, AMF), puis seulement ensuite le CTA. */
export function Apparatus (a) {
  // Un article à quatre scénarios réutiliserait le dernier palier plutôt que
  // de planter : l'échelle sature, elle ne se replie pas sur undefined.
  const grav = i => GRAVITE[Math.min(i, GRAVITE.length - 1)]

  return h('div', { className: 'max-w-3xl mx-auto px-4 sm:px-6 pb-16' },

    h('section', { className: 'pt-2' },
      TitreAppareil('Évaluation SEMPLICE'),
      h('div', { className: 'my-6 overflow-x-auto' },
        h('table', { className: 'w-full text-sm border-collapse' },
          h('thead', null,
            h('tr', { className: 'bg-[rgba(94,74,58,.08)]' },
              h('th', { className: 'text-left ' + TH }, 'Dimension'),
              h('th', { className: 'text-center ' + TH }, 'Score risque'),
              h('th', { className: 'text-center ' + TH }, 'Score opp.'),
              h('th', { className: 'text-center ' + TH }, 'Tendance')
            )
          ),
          h('tbody', null,
            ...a.semplice.dimensions.map(d =>
              h('tr', { key: d.cle, className: LIGNE },
                h('td', { className: TD + ' font-medium text-[var(--text-primary)]' }, d.nom),
                h('td', { className: TD + ' text-center font-data font-semibold text-[#006650]' }, score(d.risque, a) + '/7'),
                h('td', { className: TD + ' text-center font-data text-[#5A6178]' }, score(d.opp, a) + '/7'),
                h('td', { className: TD + ' text-center text-lg' }, d.tendance)
              )
            ),
            h('tr', { key: 'composite', className: 'bg-[#006650]/5' },
              h('td', { className: TD + ' font-bold text-[#006650]' }, 'COMPOSITE RISQUE'),
              h('td', { className: TD + ' text-center font-data font-bold text-[#DC2626] text-base' }, score(a.semplice.risque, a) + '/7'),
              h('td', { className: TD + ' text-center font-data font-bold text-[#5A6178]' }, score(a.semplice.opportunite, a) + '/7'),
              h('td', { className: TD + ' text-center text-lg' }, a.semplice.tendance)
            )
          )
        )
      ),
      a.lectureScore
        ? h('p', { className: 'text-base leading-relaxed text-[var(--text-secondary)]' },
            h('strong', { className: 'text-[var(--text-primary)]' }, 'Lecture du score'), ' — ', a.lectureScore)
        : null
    ),

    h('section', { className: 'mt-12' },
      TitreAppareil(titreScenarios(a)),
      ...a.scenarios.map((s, i) =>
        h('div', { key: i, className: 'my-6 overflow-hidden ' + grav(i).carte },
          h('div', { className: 'px-5 py-3 ' + grav(i).entete },
            h('div', { className: 'flex items-center justify-between gap-3' },
              h('span', { className: 'text-sm font-bold ' + grav(i).titre }, 'Scénario ' + (i + 1) + ' — ' + s.titre),
              h('span', { className: 'text-xs font-semibold px-2 py-1 whitespace-nowrap ' + grav(i).badge }, 'Probabilité : ' + s.fourchette)
            )
          ),
          h('div', { className: 'px-5 py-4' },
            h('p', { className: 'text-sm text-[var(--text-secondary)] leading-relaxed' },
              s.texte, ' ',
              h('strong', { className: 'text-[var(--text-primary)]' }, 'Impact décideurs'), ' : ', s.impact)
          )
        )
      )
    ),

    a.matrice
      ? h('section', { className: 'mt-12' },
          TitreAppareil('Matrice d’impact sectoriel'),
          h('div', { className: 'my-6 overflow-x-auto' },
            h('table', { className: 'w-full text-sm border-collapse' },
              h('thead', null,
                h('tr', { className: 'bg-[rgba(94,74,58,.08)]' },
                  h('th', { className: 'text-left ' + TH }, 'Secteur'),
                  h('th', { className: 'text-left ' + TH }, 'Niveau'),
                  h('th', { className: 'text-left ' + TH }, 'Recommandation')
                )
              ),
              h('tbody', null,
                ...a.matrice.map((r, i) =>
                  h('tr', { key: i, className: i < a.matrice.length - 1 ? LIGNE : '' },
                    h('td', { className: TD + ' font-medium text-[var(--text-primary)]' }, r.secteur),
                    h('td', { className: TD },
                      h('span', { className: 'text-xs font-semibold px-2 py-0.5', style: styleNiveau(r) }, r.niveau)),
                    h('td', { className: TD + ' text-[var(--text-secondary)]' }, r.reco)
                  )
                )
              )
            )
          )
        )
      : null,

    a.alertes
      ? h('section', { className: 'mt-12' },
          SousTitre(null, 'Indicateurs d’alerte à surveiller'),
          h('div', { className: 'insight-box' },
            h('ul', { className: 'space-y-1.5 text-sm text-[var(--text-secondary)]' },
              ...a.alertes.map((al, i) =>
                h('li', { key: i },
                  h('strong', { className: 'text-[var(--text-primary)]' }, al.signal), ' — ', al.lecture)
              )
            )
          )
        )
      : null,

    h('section', { className: 'mt-12' },
      TitreAppareil('Sources principales'),
      a.sourcesMeta
        ? h('p', { className: 'text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-3', style: { fontFamily: "'IBM Plex Mono',monospace" } }, a.sourcesMeta)
        : null,
      h('ul', { className: 'space-y-1.5' },
        ...a.bibliographie.map((b, i) =>
          h('li', { key: i },
            h('a', { href: b.url, target: '_blank', rel: 'noopener noreferrer', className: 'text-xs text-[var(--editorial-accent)] hover:underline' }, b.nom + ' — ' + b.note))
        )
      ),
      a.sourcesNote
        ? h('p', { className: 'mt-3 text-[10px] text-[var(--text-secondary)] italic' }, a.sourcesNote)
        : null
    ),

    a.amf
      ? h('section', { className: 'mt-12' },
          h('div', { className: 'insight-box gold' },
            h('div', { className: 'text-[11px] font-semibold uppercase tracking-wider text-[#9A7506] mb-2' }, 'Avertissement AMF'),
            h('p', { className: 'text-xs text-[var(--text-secondary)] leading-relaxed' }, a.amf)
          )
        )
      : null,

    h('div', { className: 'mt-12 text-center' },
      h('a', { href: 'analyses.html', className: 'inline-block px-6 py-2.5 text-sm font-semibold text-[var(--editorial-accent)] border-2 border-[var(--editorial-accent)] hover:bg-[var(--editorial-accent)] hover:text-[#F5EDE6] transition-colors' }, '← Toutes les analyses')
    ),
    h('div', { className: 'mt-6 text-center' },
      h('a', { href: 'premium.html', className: 'inline-block px-7 py-3.5 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[#F5EDE6] font-semibold text-sm transition-colors' }, 'Réserver un diagnostic')
    ),

    a.articlesLies
      ? h('section', { className: 'mt-14 pt-10 border-t border-[var(--hairline-warm)]' },
          h('p', { className: 'text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-4' }, 'Articles liés'),
          h('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-5' },
            ...a.articlesLies.map((r, i) =>
              h('a', { key: i, href: r.href, className: 'article-card block overflow-hidden bg-[var(--surface-raised)] border border-[var(--hairline-warm)] no-underline' },
                h('div', { className: 'aspect-[16/9] overflow-hidden' },
                  h('img', { src: r.img, alt: '', className: 'w-full h-full object-cover', loading: 'lazy' })
                ),
                h('div', { className: 'p-3' },
                  /* Jetons de badge appliqués directement, sans passer par une classe
                     `category-<cat>` dérivée de la donnée : `cat:'geopolitique'` produisait
                     `.category-geopolitique`, qui n'existe dans le CSS d'aucune page (seul
                     `.category-geo` est défini) — le badge tombait sans style. Le squelette
                     sert 11 articles aux catégories variées : il ne peut pas dépendre de
                     l'existence d'une classe par catégorie. */
                  h('span', { className: 'text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-[var(--badge-bg)] text-[var(--badge-text)]', style: { fontFamily: "'IBM Plex Mono',monospace" } }, r.catLabel),
                  h('h4', { className: 'mt-2 text-xs font-semibold text-[var(--text-primary)] leading-snug line-clamp-2', style: { fontFamily: "'Archivo',Arial,sans-serif" } }, r.titre)
                )
              )
            )
          )
        )
      : null
  )
}

// ─── MONTAGE ───────────────────────────────────────────────

/** Monte l'article complet dans #app. */
export function renderArticle (article, sections) {
  createRoot(document.getElementById('app')).render(
    h('div', null,
      h(Navigation),
      h('main', { id: 'main-content' }, Cover(article), Body(sections), Apparatus(article)),
      h(Footer)
    )
  )
}
