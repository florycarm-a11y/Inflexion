/* En-tête du site : la Navigation d'index.html, telle quelle (deux états, méga-menu en verre en modèle disclosure, overlay dialogue).
   index.html reste la source de vérité et garde sa copie ; test/pages-header.test.mjs exige l'identité des deux textes.
   Les règles CSS vivent dans assets/header-shell.css, liée par chaque page avant son <style>. Lit window.MEGA_NAV (nav-config.js). */
import React,{useState,useEffect,useRef} from 'https://esm.sh/react@18.2.0'
const h=React.createElement
const MEGA_NAV=window.MEGA_NAV

export function Navigation(){
const[open,setOpen]=useState(false)
const[scrolled,setScrolled]=useState(()=>window.scrollY>60) // lu au montage : rechargement ou retour arrière avec défilement restauré
const[megaOpen,setMegaOpen]=useState(-1)
const ouvreur=useRef(null) // bouton qui a ouvert l'overlay : le focus lui revient à la fermeture
const survol=useRef(-1) // rubrique ouverte au survol (pas au clic ni au clavier) : elle se referme à la sortie du pointeur, même si son bouton a gardé le focus d'un clic antérieur
useEffect(()=>{
const fn=()=>setScrolled(window.scrollY>60)
window.addEventListener('scroll',fn,{passive:true})
return()=>window.removeEventListener('scroll',fn)
},[])
useEffect(()=>{
if(scrolled)setMegaOpen(-1) // un panneau ouvert garderait visibility:visible sous des rubriques effacées
},[scrolled])
// Panneau ouvert : un toucher ou un clic hors de tout déclencheur le ferme (iOS ne donne pas le focus aux boutons : onBlur n'y suffit pas)
useEffect(()=>{
if(megaOpen<0)return
const fermer=e=>{if(!e.target.closest?.('.mega-trigger'))setMegaOpen(-1)}
const echap=e=>{if(e.key==='Escape')setMegaOpen(-1)} // panneau ouvert au survol : rien n'a le focus, le onKeyDown du déclencheur ne reçoit rien
const quitter=()=>setMegaOpen(-1) // la fenêtre perd le focus (autre onglet, autre application, barre d'adresse) : rien ne reste ouvert au retour
document.addEventListener('pointerdown',fermer);document.addEventListener('keydown',echap);window.addEventListener('blur',quitter)
return()=>{document.removeEventListener('pointerdown',fermer);document.removeEventListener('keydown',echap);window.removeEventListener('blur',quitter)}
},[megaOpen])
useEffect(()=>{
if(!open)return
document.body.classList.add('menu-open')
const fn=e=>{if(e.key==='Escape')setOpen(false)}
document.addEventListener('keydown',fn)
document.getElementById('menu-overlay').querySelector('button').focus() // le focus entre dans le dialogue (la croix) : sinon Tab parcourt l'en-tête invisible derrière
return()=>{
document.body.classList.remove('menu-open');document.removeEventListener('keydown',fn)
const o=ouvreur.current;o?.focus()
if(document.activeElement!==o)document.querySelector('header a')?.focus() // ouvreur masqué (redimensionnement, en-tête revenu au repos) : repli sur le logo
}
},[open])
return h('div',null,
 h('div',{className:'fixed top-0 left-0 right-0 z-[51] h-[3px] bg-[var(--editorial-accent)]'}),
 h('header',{className:`site-header fixed top-[3px] left-0 right-0 z-50 ${scrolled?'nav-scrolled':'bg-transparent'}`},
  h('div',{className:'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'},
   h('div',{className:'flex items-center justify-between h-16'},
    h('a',{href:'index.html',className:'flex items-center gap-2'},
     h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-10 w-auto',style:{filter:'brightness(10) saturate(0)'}})
    ),
    h('nav',{className:'hidden md:flex items-center gap-1','aria-label':'Navigation principale'},
     h('div',{className:'nav-states'},
      h('div',{className:'nav-state flex items-center gap-1'+(scrolled?' is-hidden':'')},
     ...MEGA_NAV.map((cat,ci)=>{
      const isWide=cat.children.length>3
      // Modèle « disclosure » : le clic bascule (souris, toucher, Entrée, Espace), Échap ferme et rend le focus ; le survol n'ouvre que pour une vraie souris
      // (le survol émulé d'un toucher, suivi du clic, ouvrirait puis refermerait). Pas d'ouverture au focus : tabuler le long de la barre n'ouvre rien.
      // Une rubrique ne ferme que SON panneau, en forme fonctionnelle (état à jour) : en Chrome, l'entrée dans la rubrique voisine part avant la sortie
      // de la rubrique quittée, et la perte de focus d'une rubrique ne doit pas fermer le panneau d'une autre (le clic sur un de ses liens serait perdu).
      // Perte de focus « vers rien » (relatedTarget nul : clic sur une zone non focalisable, ou sur un lien sous Safari, qui ne donne pas le focus aux liens) :
      // on ne ferme pas, sinon le panneau disparaît sous le clic ; le clic hors des rubriques et la perte de focus de la fenêtre ferment par ailleurs.
      return h('div',{key:ci,className:'mega-trigger',onPointerEnter:(e)=>{if(e.pointerType==='mouse'){survol.current=ci;setMegaOpen(ci)}},onMouseLeave:(e)=>{if(survol.current===ci||!e.currentTarget.contains(document.activeElement))setMegaOpen(m=>m===ci?-1:m)},onBlur:(e)=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))setMegaOpen(m=>m===ci?-1:m)},onKeyDown:(e)=>{if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1);e.currentTarget.querySelector('button').focus()}}},
       h('button',{type:'button','aria-expanded':megaOpen===ci,'aria-controls':'mega-panel-'+ci,onClick:()=>{survol.current=-1;setMegaOpen(m=>m===ci?-1:ci)},className:'nav-link px-3 py-2 text-sm transition-colors select-none text-[var(--chrome-text-2)] hover:text-[var(--chrome-text-1)] focus-visible:text-[var(--chrome-text-1)] bg-transparent border-0 cursor-pointer'},cat.label),
       h('div',{id:'mega-panel-'+ci,className:'mega-menu '+(megaOpen===ci?'mega-open ':'')+'p-5',style:{minWidth:isWide?'440px':'340px'}},
        h('p',{className:'kicker mb-3 px-3',style:{color:'var(--editorial-accent-text)'}},cat.label),
        h('div',{className:isWide?'grid grid-cols-2 gap-1':'grid gap-1'},
         ...cat.children.map((item,ii)=>
          h('a',{key:ii,href:item.href,className:'mega-item flex flex-col px-3 py-2.5 no-underline'},
           h('span',{className:'text-sm font-semibold text-[var(--chrome-text-1)]'},item.label),
           h('span',{className:'text-xs text-[var(--chrome-text-2)] mt-0.5'},item.desc)
          )
         )
        )
       )
      )}
      )
      ),
      h('div',{className:'nav-state'+(scrolled?'':' is-hidden')},
       h('button',{type:'button',onClick:(e)=>{ouvreur.current=e.currentTarget;setOpen(true)},'aria-expanded':open,'aria-controls':'menu-overlay',className:'nav-link px-3 py-2 text-sm transition-colors select-none text-[var(--chrome-text-2)] hover:text-[var(--chrome-text-1)] focus-visible:text-[var(--chrome-text-1)] bg-transparent border-0 cursor-pointer'},'Menu')
      )
     ),
     h('a',{href:'premium.html',className:'ml-4 px-4 py-2 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[var(--chrome-text-1)] font-semibold text-sm transition-colors'},'Réserver un diagnostic')
    ),
    h('button',{className:`hamburger md:hidden p-2 ${open?'open':''}`,onClick:(e)=>{ouvreur.current=e.currentTarget;setOpen(!open)},'aria-label':'Menu','aria-expanded':open,'aria-controls':'menu-overlay'},
     h('span'),h('span'),h('span')
    )
   )
  )
 ),
 h('div',{id:'menu-overlay',role:'dialog','aria-modal':'true','aria-label':'Menu',className:`mobile-overlay fixed inset-0 z-[60] flex flex-col ${open?'open':''}`,style:{backgroundColor:'var(--chrome-ground)'}},
  h('div',{className:'flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full'},
   h('img',{src:'logo-header.png',alt:'Inflexion',className:'h-8 w-auto',style:{filter:'brightness(10) saturate(0)'}}),
   h('button',{onClick:()=>setOpen(false),className:'w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors','aria-label':'Fermer'},
    h('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2.5,strokeLinecap:'round',className:'text-white'},h('path',{d:'M18 6L6 18M6 6l12 12'}))
   )
  ),
  h('div',{className:'flex-1 overflow-y-auto px-6 pt-2 pb-4 md:max-w-2xl md:mx-auto md:w-full'},
   ...MEGA_NAV.map((cat,ci)=>[
    h('p',{key:'h'+ci,className:'menu-item text-xs uppercase tracking-[.2em] text-[var(--editorial-accent-text)] font-semibold mb-3'+(ci>0?' mt-8':''),style:{animationDelay:`${0.05+ci*0.18}s`}},cat.label),
    ...cat.children.map((item,ii)=>
     h('a',{key:'m'+ci+'-'+ii,href:item.href,onClick:()=>setOpen(false),className:'menu-item flex items-center gap-3 py-3 text-white/90 hover:text-white transition-colors border-b border-white/[.08]',style:{animationDelay:`${0.08+ci*0.18+ii*0.05}s`}},
      h('span',{className:'w-8 h-8 bg-white/10 flex items-center justify-center text-xs font-semibold text-white/70',style:{fontFamily:"'IBM Plex Mono',monospace"}},item.icon),
      h('span',{className:'text-base sm:text-lg md:text-[20px]'},item.label)
     )
    )
   ]).flat()
  ),
  h('div',{className:'px-6 pt-4 pb-20 flex flex-col gap-3 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full'},
   h('a',{href:'premium.html',onClick:()=>setOpen(false),className:'menu-item block w-full text-center px-6 py-3.5 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[var(--chrome-text-1)] font-semibold transition-colors text-base',style:{animationDelay:'0.8s'}},'Réserver un diagnostic')
  )
 )
)
}
