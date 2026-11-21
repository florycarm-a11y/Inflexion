/**
 * nav-shared.js — Coquille de navigation des pages legacy (sans React).
 * Émet le MÊME DOM que la Navigation de la home (assets/header-shell.js : mêmes classes, mêmes id, mêmes aria-*),
 * stylé par assets/header-shell.css (liée par la page) et assets/site.css ; la logique d'état (défilement, méga-menu
 * « disclosure », overlay dialogue) est réécrite ici en vanilla. Construit aussi le hero et le pied de page (thème T).
 * Include AFTER app.js and data-loader.js, et après nav-config.js (window.MEGA_NAV).
 */
(function(){
'use strict';

// ── Thème du chrome (v1 = identité actuelle ; v2 = identité sombre, opt-in via <body data-chrome="v2">) ──
var THEMES={
  v1:{
    accent:'#006650',
    heroBg:'#006650', heroLabel:'#33B894', heroTitle:'#fff', heroSub:'rgba(255,255,255,.5)',
    footerBg:'#F7F8FA', footerBorder:'#E2E5EB', footerText:'#5A6178', footerTitle:'#1A1F2E', footerTag:'rgba(90,97,120,.4)',
    fontDisplay:'Libre Baskerville,Georgia,serif', fontBody:'Inter,sans-serif'
  },
  v2:{
    accent:'#8E2424',
    heroBg:'#17100E', heroLabel:'#9AA0A4', heroTitle:'#E8E4D8', heroSub:'rgba(232,228,216,.55)',
    footerBg:'#17100E', footerBorder:'rgba(232,228,216,.12)', footerText:'#9AA0A4', footerTitle:'#E8E4D8', footerTag:'rgba(154,160,164,.6)',
    fontDisplay:'Archivo,Georgia,serif', fontBody:'IBM Plex Sans,Inter,sans-serif'
  }
};
var T=THEMES[(document.body&&document.body.dataset&&document.body.dataset.chrome)]||THEMES.v1;

// ── CSS du hero et du pied de page (l'en-tête et l'overlay sont stylés par assets/header-shell.css, liée par la page) ──
var css=document.createElement('style');
css.textContent=
'.ns-footer-link:hover{color:'+T.accent+'!important}\n'+
'@keyframes ns-fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n'+
'.ns-anim{animation:ns-fade-up .6s ease-out both}\n'+
'.ns-anim-d1{animation-delay:.1s}.ns-anim-d2{animation-delay:.2s}\n'+
'/* Hide old elements */\n'+
'header.header,nav.nav-overlay,button.back-to-top{display:none!important}\n';
document.head.appendChild(css);

// ── Navigation Data : chargée depuis nav-config.js (source unique) ──
// MEGA_NAV est défini dans window par nav-config.js

var CATEGORY_LABELS={
geopolitics:'Risques & tensions internationales',
markets:'Actions, indices, taux & devises',
crypto:'Bitcoin, DeFi & blockchain',
commodities:'Or, p\u00e9trole, m\u00e9taux & \u00e9nergie',
etf:'Fonds indiciels & allocations',
macro:'Donn\u00e9es macro\u00e9conomiques',
briefing:'Intelligence quotidienne — Signal & Risk Radar',
tracker:'Tracker d’inflexions',
};

var FOOTER_SOURCES=['SEC EDGAR','8-K','10-Q','10-K','XBRL','GAAP'];

// ── Barre rouge, en-tête à deux états, méga-menu, overlay : même DOM que la Navigation de la home ──
var bronzeBar=document.createElement('div');
bronzeBar.className='fixed top-0 left-0 right-0 z-[51] h-[3px] bg-[var(--editorial-accent)]';
document.body.insertBefore(bronzeBar,document.body.firstChild);

var LOGO='<img src="logo-header.png" alt="Inflexion" class="h-10 w-auto" style="filter:brightness(10) saturate(0)"/>';
var BOUTON='nav-link px-3 py-2 text-sm transition-colors select-none text-[var(--chrome-text-2)] hover:text-[var(--chrome-text-1)] focus-visible:text-[var(--chrome-text-1)] bg-transparent border-0 cursor-pointer';
var megaHTML=MEGA_NAV.map(function(cat,ci){
var isWide=cat.children.length>3;
var entrees=cat.children.map(function(item){
return '<a href="'+item.href+'" class="mega-item flex flex-col px-3 py-2.5 no-underline">'+
'<span class="text-sm font-semibold text-[var(--chrome-text-1)]">'+item.label+'</span>'+
'<span class="text-xs text-[var(--chrome-text-2)] mt-0.5">'+item.desc+'</span></a>';
}).join('');
return '<div class="mega-trigger">'+
'<button type="button" aria-expanded="false" aria-controls="mega-panel-'+ci+'" class="'+BOUTON+'">'+cat.label+'</button>'+
'<div id="mega-panel-'+ci+'" class="mega-menu p-5" style="min-width:'+(isWide?'440px':'340px')+'">'+
'<p class="kicker mb-3 px-3" style="color:var(--editorial-accent-text)">'+cat.label+'</p>'+
'<div class="'+(isWide?'grid grid-cols-2 gap-1':'grid gap-1')+'">'+entrees+'</div></div></div>';
}).join('');

var header=document.createElement('header');
header.className='site-header fixed top-[3px] left-0 right-0 z-50 bg-transparent';
header.innerHTML=
'<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div class="flex items-center justify-between h-16">'+
'<a href="index.html" class="flex items-center gap-2">'+LOGO+'</a>'+
'<nav class="hidden md:flex items-center gap-1" aria-label="Navigation principale">'+
'<div class="nav-states"><div class="nav-state flex items-center gap-1">'+megaHTML+'</div>'+
'<div class="nav-state is-hidden"><button type="button" aria-expanded="false" aria-controls="menu-overlay" class="'+BOUTON+'">Menu</button></div></div>'+
'<a href="premium.html" class="ml-4 px-4 py-2 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[var(--chrome-text-1)] font-semibold text-sm transition-colors">R\u00e9server un diagnostic</a>'+
'</nav>'+
'<button class="hamburger md:hidden p-2" aria-label="Menu" aria-expanded="false" aria-controls="menu-overlay"><span></span><span></span><span></span></button>'+
'</div></div>';
document.body.insertBefore(header,bronzeBar.nextSibling);

var overlay=document.createElement('div');
overlay.id='menu-overlay';
overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Menu');
overlay.className='mobile-overlay fixed inset-0 z-[60] flex flex-col';
overlay.style.backgroundColor='var(--chrome-ground)';
var liensOverlay=MEGA_NAV.map(function(cat,ci){
return '<p class="menu-item text-xs uppercase tracking-[.2em] text-[var(--editorial-accent-text)] font-semibold mb-3'+(ci>0?' mt-8':'')+'" style="animation-delay:'+(0.05+ci*0.18)+'s">'+cat.label+'</p>'+
cat.children.map(function(item,ii){
return '<a href="'+item.href+'" class="menu-item flex items-center gap-3 py-3 text-white/90 hover:text-white transition-colors border-b border-white/[.08]" style="animation-delay:'+(0.08+ci*0.18+ii*0.05)+'s">'+
'<span class="w-8 h-8 bg-white/10 flex items-center justify-center text-xs font-semibold text-white/70" style="font-family:\'IBM Plex Mono\',monospace">'+item.icon+'</span>'+
'<span class="text-base sm:text-lg md:text-[20px]">'+item.label+'</span></a>';
}).join('');
}).join('');
overlay.innerHTML=
'<div class="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full">'+
'<img src="logo-header.png" alt="Inflexion" class="h-8 w-auto" style="filter:brightness(10) saturate(0)"/>'+
'<button class="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Fermer">'+
'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="text-white"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
'<div class="flex-1 overflow-y-auto px-6 pt-2 pb-4 md:max-w-2xl md:mx-auto md:w-full">'+liensOverlay+'</div>'+
'<div class="px-6 pt-4 pb-20 flex flex-col gap-3 flex-shrink-0 md:max-w-2xl md:mx-auto md:w-full">'+
'<a href="premium.html" class="menu-item block w-full text-center px-6 py-3.5 bg-[var(--editorial-accent)] hover:bg-[#6E1B1B] text-[var(--chrome-text-1)] font-semibold transition-colors text-base" style="animation-delay:0.8s">R\u00e9server un diagnostic</a></div>';
header.after(overlay);

// ── Build Page Hero ──
var oldPageHeader=document.querySelector('.page-header');
var premiumHero=document.querySelector('.premium-hero');
var expertiseHero=document.querySelector('.expertise-hero');
var mainEl=document.querySelector('main.main-content,main#main-content');

function buildHero(catLabel,titleText,subtitleText){
var hero=document.createElement('section');
hero.style.cssText='position:relative;padding:7rem 0 3.5rem;background-color:'+T.heroBg;
hero.innerHTML=
'<div style="max-width:80rem;margin:0 auto;padding:0 1rem">'+
'<div style="max-width:42rem">'+
'<p class="ns-anim" style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:'+T.heroLabel+';margin-bottom:1rem;font-family:'+T.fontBody+'">'+catLabel+'</p>'+
'<h1 class="ns-anim ns-anim-d1" style="font-size:clamp(1.5rem,5vw,3rem);font-weight:700;color:'+T.heroTitle+';line-height:1.1;letter-spacing:-0.02em;font-family:'+T.fontDisplay+'">'+titleText+'</h1>'+
(subtitleText?'<p class="ns-anim ns-anim-d2" style="margin-top:1.25rem;font-size:clamp(0.875rem,2vw,1.125rem);color:'+T.heroSub+';line-height:1.6;max-width:32rem;font-family:'+T.fontBody+'">'+subtitleText+'</p>':'')+
'</div></div>';
return hero;
}

if(oldPageHeader){
var titleText=oldPageHeader.querySelector('.page-title')?oldPageHeader.querySelector('.page-title').textContent:'';
var subtitleText=oldPageHeader.querySelector('.page-subtitle')?oldPageHeader.querySelector('.page-subtitle').textContent:'';
var category=oldPageHeader.getAttribute('data-category')||'';
var catLabel=CATEGORY_LABELS[category]||'Intelligence & analyse';
var hero=buildHero(catLabel,titleText,subtitleText);
if(mainEl)mainEl.parentNode.insertBefore(hero,mainEl);
oldPageHeader.style.display='none';
}

if(premiumHero){
var pTitle=premiumHero.querySelector('.premium-hero-title');
var pSub=premiumHero.querySelector('.premium-hero-subtitle');
var pBadge=premiumHero.querySelector('.premium-badge');
var hero2=buildHero(pBadge?pBadge.textContent:'Services',pTitle?pTitle.textContent:'',pSub?pSub.textContent:'');
if(mainEl)mainEl.parentNode.insertBefore(hero2,mainEl);
premiumHero.style.display='none';
}

if(expertiseHero){
var eTitle=expertiseHero.querySelector('.expertise-hero-title');
var eSub=expertiseHero.querySelector('.expertise-hero-subtitle');
var hero3=buildHero('M\u00e9thodologie & rigueur',eTitle?eTitle.textContent:'',eSub?eSub.textContent:'');
if(mainEl)mainEl.parentNode.insertBefore(hero3,mainEl);
expertiseHero.style.display='none';
}

// ── Replace Footer ──
var oldFooter=document.querySelector('footer.footer');
if(oldFooter){
var newFooter=document.createElement('footer');
newFooter.setAttribute('role','contentinfo');
newFooter.style.cssText='border-top:1px solid '+T.footerBorder+';background:'+T.footerBg+';padding:3rem 0 2rem';

var sourceTags=FOOTER_SOURCES.map(function(s){return '<span style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:'+T.footerTag+';font-weight:500">'+s+'</span>';}).join('');

newFooter.innerHTML=
'<div style="max-width:80rem;margin:0 auto;padding:0 1rem">'+
'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:2.5rem;margin-bottom:3rem" class="footer-grid">'+
// Col 1
'<div style="grid-column:span 2" class="footer-col1">'+
'<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem"><img src="logo-header.png" alt="Inflexion" style="height:2.5rem;width:auto"/></div>'+
'<p style="font-size:0.875rem;color:'+T.footerText+';line-height:1.6;font-family:'+T.fontBody+'">Tracker d\u2019inflexions. Lecture des publications de r\u00e9sultats des soci\u00e9t\u00e9s port\u00e9es par un r\u00e9cit \u2014 m\u00e9thode publique, limites comprises.</p></div>'+
// Col 2 \u2014 le tracker (pivot du 21 novembre 2026 : les liens de veille sortent du pied de page)
'<div><p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:'+T.footerTitle+';margin-bottom:1rem;font-family:'+T.fontBody+'">Tracker</p>'+
'<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">'+
'<li><a href="index.html#societes" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Soci\u00e9t\u00e9s suivies</a></li>'+
'<li><a href="index.html#alertes" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Alertes</a></li>'+
'<li><a href="methode.html" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">La m\u00e9thode, en clair</a></li>'+
'<li><a href="methode.html#backtest" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Le backtest</a></li>'+
'</ul></div>'+
// Col 3
'<div><p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:'+T.footerTitle+';margin-bottom:1rem;font-family:'+T.fontBody+'">Plateforme</p>'+
'<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">'+
'<li><a href="expertise.html" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Expertise & SEMPLICE</a></li>'+
'<li><a href="analyses.html" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Analyses \u2014 archives</a></li>'+
'<li><a href="premium.html" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Services</a></li>'+
'<li><a href="premium.html#contact" class="ns-footer-link" style="font-size:0.875rem;color:'+T.footerText+';text-decoration:none;transition:color .2s">Contact</a></li>'+
'</ul></div>'+
'</div>'+
// Bottom bar
'<div style="border-top:1px solid '+T.footerBorder+';padding-top:2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center">'+
'<span style="font-size:0.875rem;color:'+T.footerText+';font-family:'+T.fontBody+'">\u00a9 2026 Inflexion \u2014 Intelligence financi\u00e8re & g\u00e9opolitique</span>'+
'<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.75rem">'+sourceTags+'</div>'+
'</div></div>';

// Responsive footer grid
var footerCss=document.createElement('style');
footerCss.textContent='@media(min-width:768px){.footer-grid{grid-template-columns:repeat(4,1fr)!important}.footer-col1{grid-column:span 1!important}}';
document.head.appendChild(footerCss);

oldFooter.parentNode.replaceChild(newFooter,oldFooter);
}

// ── Logique d'état : la même que la Navigation de la home, en vanilla ──
var etats=header.querySelectorAll('.nav-state');
var triggers=[].slice.call(header.querySelectorAll('.mega-trigger'));
var boutonMenu=etats[1].querySelector('button');
var hamburger=header.querySelector('button.hamburger');
var croix=overlay.querySelector('button');
var megaOpen=-1, scrolled=false, overlayOuvert=false, ouvreur=null;
var survol=-1; // rubrique ouverte au survol (l'entrée du pointeur qui l'ouvre la marque, le clic et l'Entrée effacent la marque). La sortie du pointeur ne ferme
               // QUE ce panneau-là, sauf si le focus clavier (:focus-visible) est dans le panneau ; ouvert au clic ou au clavier, il reste ouvert à la sortie
               // (épinglé), quel que soit le moteur. Même règle que la home.

// Méga-menu « disclosure » : le clic bascule (souris, toucher, Entrée, Espace), Échap ferme et rend le focus ; le survol n'ouvre que pour une vraie souris
// (le survol émulé d'un toucher, suivi du clic, ouvrirait puis refermerait). Pas d'ouverture au focus. Panneau ouvert : un toucher hors de tout
// déclencheur le ferme (iOS ne donne pas le focus aux boutons), Échap aussi (ouvert au survol, rien n'a le focus).
function fermerDehors(e){if(!(e.target.closest&&e.target.closest('.mega-trigger')))setMegaOpen(-1);}
function echapDocument(e){if(e.key==='Escape')setMegaOpen(-1);}
function quitterFenetre(){setMegaOpen(-1);} // la fenêtre perd le focus (autre onglet, autre application, barre d'adresse) : rien ne reste ouvert au retour
function setMegaOpen(i){
if(i===megaOpen)return;
var avant=megaOpen;megaOpen=i;
triggers.forEach(function(t,ci){
t.querySelector('button').setAttribute('aria-expanded',ci===i?'true':'false');
t.querySelector('.mega-menu').classList.toggle('mega-open',ci===i);
});
if(avant<0&&i>=0){document.addEventListener('pointerdown',fermerDehors);document.addEventListener('keydown',echapDocument);window.addEventListener('blur',quitterFenetre);}
if(avant>=0&&i<0){document.removeEventListener('pointerdown',fermerDehors);document.removeEventListener('keydown',echapDocument);window.removeEventListener('blur',quitterFenetre);}
}
triggers.forEach(function(t,ci){
var b=t.querySelector('button'), p=t.querySelector('.mega-menu');
b.addEventListener('click',function(){survol=-1;setMegaOpen(megaOpen===ci?-1:ci);});
// Entrée et sortie calculées comme React (onPointerEnter/onMouseLeave de la home) : sur pointerover/mouseout, d'après relatedTarget.
// Une rubrique ne ferme que son propre panneau (megaOpen===ci) : l'entrée dans la voisine part avant la sortie de la rubrique quittée, et un focusout
// ne doit pas fermer le panneau d'une autre rubrique (le clic sur un de ses liens serait perdu). Même règle que la home.
// Perte de focus « vers rien » (relatedTarget nul : clic sur une zone non focalisable, ou sur un lien sous Safari) : on ne ferme pas,
// sinon le panneau disparaît sous le clic ; le clic hors des rubriques et la perte de focus de la fenêtre ferment par ailleurs.
t.addEventListener('pointerover',function(e){if(e.pointerType==='mouse'&&!t.contains(e.relatedTarget)){if(megaOpen!==ci)survol=ci;setMegaOpen(ci);}});
t.addEventListener('mouseout',function(e){var f=document.activeElement;if(megaOpen===ci&&survol===ci&&!t.contains(e.relatedTarget)&&!(p.contains(f)&&f.matches(':focus-visible')))setMegaOpen(-1);});
t.addEventListener('focusout',function(e){if(megaOpen===ci&&e.relatedTarget&&!t.contains(e.relatedTarget))setMegaOpen(-1);});
t.addEventListener('keydown',function(e){if(e.key==='Escape'&&megaOpen===ci){setMegaOpen(-1);b.focus();}});
});

// Deux états : au-delà de 60 px, les rubriques s'effacent et « Menu » prend leur place ; un panneau ouvert se ferme
// (sa visibility:visible battrait l'héritage de l'état masqué). Lu au chargement : défilement restauré par le navigateur.
function onScroll(){
var s=window.scrollY>60;
if(s===scrolled)return;
scrolled=s;
header.classList.toggle('nav-scrolled',s);header.classList.toggle('bg-transparent',!s);
etats[0].classList.toggle('is-hidden',s);etats[1].classList.toggle('is-hidden',!s);
if(s)setMegaOpen(-1);
}
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();

// Overlay : dialogue plein écran ; le focus entre sur la croix, Échap ferme, le focus revient à l'ouvreur (repli : le lien du logo, si l'ouvreur est masqué).
function echapOverlay(e){if(e.key==='Escape')setOpen(false);}
function setOpen(o){
if(o===overlayOuvert)return;
overlayOuvert=o;
overlay.classList.toggle('open',o);hamburger.classList.toggle('open',o);
hamburger.setAttribute('aria-expanded',o?'true':'false');boutonMenu.setAttribute('aria-expanded',o?'true':'false');
if(o){
document.body.classList.add('menu-open');document.addEventListener('keydown',echapOverlay);
croix.focus();
}else{
document.body.classList.remove('menu-open');document.removeEventListener('keydown',echapOverlay);
if(ouvreur)ouvreur.focus();
if(document.activeElement!==ouvreur)header.querySelector('a').focus();
}
}
boutonMenu.addEventListener('click',function(){ouvreur=boutonMenu;setOpen(true);});
hamburger.addEventListener('click',function(){ouvreur=hamburger;setOpen(!overlayOuvert);});
croix.addEventListener('click',function(){setOpen(false);});
[].forEach.call(overlay.querySelectorAll('a'),function(a){a.addEventListener('click',function(){setOpen(false);});});

// ── Scroll reveal (fade-in au scroll) ──
if(!document.querySelector('script[src*="scroll-reveal"]')){
var sr=document.createElement('script');sr.src='scroll-reveal.js';document.body.appendChild(sr);
}

})();
