/**
 * nav-shared.js — Modern Inflexion Navigation Shell
 * Replaces old header/nav/hero/footer with the new design system.
 * Include AFTER app.js and data-loader.js.
 */
(function(){
'use strict';

// ── Inject required CSS ──
var css=document.createElement('style');
css.textContent=
'/* Nav shared styles */\n'+
'.nav-link-new{position:relative}\n'+
'.nav-link-new::after{content:"";position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:#006650;transform:scaleX(0);transition:transform .25s ease}\n'+
'.nav-link-new:hover::after,.nav-link-new.active::after{transform:scaleX(1)}\n'+
'.mega-trigger{position:relative}\n'+
'.mega-menu{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(8px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .22s ease,transform .22s ease,visibility .22s;z-index:60;min-width:260px;padding:8px}\n'+
'.mega-trigger:hover .mega-menu,.mega-menu:hover{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}\n'+
'.mega-item{transition:background .15s ease,border-color .15s ease;border:1px solid transparent}\n'+
'.mega-item:hover{background:#F0FAF5;border-color:#D1EFE2}\n'+
'.mega-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;background:rgba(0,102,80,.08);color:#006650;transition:background .15s ease,transform .15s ease}\n'+
'.mega-item:hover .mega-icon{background:rgba(0,102,80,.15);transform:scale(1.1)}\n'+
'@keyframes ns-fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n'+
'@keyframes ns-menu-item-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}\n'+
'.ns-anim{animation:ns-fade-up .6s ease-out both}\n'+
'.ns-anim-d1{animation-delay:.1s}.ns-anim-d2{animation-delay:.2s}\n'+
'/* Hide old elements */\n'+
'header.header,nav.nav-overlay,button.back-to-top{display:none!important}\n';
document.head.appendChild(css);

// ── Navigation Data ──
var MEGA_NAV=[
{label:'Intelligence',children:[
 {icon:'\u{1F30D}',label:'G\u00e9opolitique',desc:'Risques pays & tensions internationales',href:'geopolitics.html'},
 {icon:'\u{1F4C8}',label:'March\u00e9s',desc:'Actions, indices, taux & devises',href:'markets.html'},
 {icon:'\u20bf',label:'Crypto & Blockchain',desc:'Bitcoin, DeFi, r\u00e9gulation',href:'crypto.html'},
 {icon:'\u{1F6E2}\ufe0f',label:'Mati\u00e8res premi\u00e8res',desc:'Or, p\u00e9trole, m\u00e9taux & \u00e9nergie',href:'commodities.html'},
 {icon:'\u{1F4CA}',label:'ETF & Fonds',desc:'Allocations & flux de capitaux',href:'etf.html'},
]},
{label:'Analyses',children:[
 {icon:'\u{1F4F0}',label:'Briefing du jour',desc:'Synth\u00e8se IA quotidienne',href:'index.html#briefing'},
 {icon:'\u{1F50E}',label:'Analyses approfondies',desc:'D\u00e9cryptages th\u00e9matiques',href:'analyses.html'},
 {icon:'\u{1F5FA}\ufe0f',label:'Macro par pays',desc:'Donn\u00e9es World Bank & indicateurs',href:'country.html'},
]},
{label:'Expertise',children:[
 {icon:'\u{1F9ED}',label:'Notre approche',desc:'M\u00e9thodologie & cadre d\'analyse',href:'expertise.html'},
 {icon:'\u{1F916}',label:'Pipeline IA',desc:'158 sources, 15 APIs, Claude IA',href:'expertise.html#pipeline'},
 {icon:'\u{1F4E1}',label:'Sources & donn\u00e9es',desc:'Transparence sur nos flux',href:'expertise.html#sources'},
]},
{label:'Services',children:[
 {icon:'\u{1F4BC}',label:'Diagnostic strat\u00e9gique',desc:'Audit personnalis\u00e9 de vos positions',href:'premium.html'},
 {icon:'\u{1F514}',label:'Alertes & veille',desc:'Notifications personnalis\u00e9es',href:'premium.html#alertes'},
 {icon:'\u{1F4CB}',label:'Rapports sur mesure',desc:'Analyses d\u00e9di\u00e9es \u00e0 votre portefeuille',href:'premium.html#rapports'},
]},
];

var CATEGORY_LABELS={
geopolitics:'Risques & tensions internationales',
markets:'Actions, indices, taux & devises',
crypto:'Bitcoin, DeFi & blockchain',
commodities:'Or, p\u00e9trole, m\u00e9taux & \u00e9nergie',
etf:'Fonds indiciels & allocations',
macro:'Donn\u00e9es macro\u00e9conomiques',
};

var FOOTER_SOURCES=['FRED','Finnhub','CoinGecko','DefiLlama','Messari','ECB','IFRI','SIPRI','Chatham House','OPEC'];

// ── Build Bronze Top Bar ──
var bronzeBar=document.createElement('div');
bronzeBar.style.cssText='position:fixed;top:0;left:0;right:0;z-index:51;height:3px;background:#C8955A';
document.body.insertBefore(bronzeBar,document.body.firstChild);

// ── Build Header ──
var header=document.createElement('header');
header.id='modern-header';
header.className='fixed left-0 right-0 z-50 transition-all duration-300 bg-transparent';
header.style.top='3px';

var megaHTML=MEGA_NAV.map(function(cat){
var ch=cat.children.map(function(item){
return '<a href="'+item.href+'" class="mega-item flex items-start gap-3 px-3 py-2.5 rounded-xl no-underline" style="text-decoration:none">'+
'<span class="mega-icon">'+item.icon+'</span>'+
'<span style="display:flex;flex-direction:column">'+
'<span style="font-size:0.875rem;font-weight:600;color:#1A1F2E">'+item.label+'</span>'+
'<span style="font-size:0.75rem;color:#8A93A8;margin-top:2px">'+item.desc+'</span>'+
'</span></a>';
}).join('');
return '<div class="mega-trigger">'+
'<span class="nav-link-new" style="padding:0.5rem 0.75rem;font-size:0.875rem;font-weight:500;transition:color .2s;cursor:default;user-select:none;color:rgba(255,255,255,.7)">'+cat.label+'</span>'+
'<div class="mega-menu" style="background:#fff;border-radius:1rem;box-shadow:0 20px 60px rgba(0,0,0,.12);border:1px solid #f3f4f6;padding:1.25rem">'+
'<div style="display:grid;gap:4px">'+ch+'</div></div></div>';
}).join('');

header.innerHTML=
'<div style="max-width:80rem;margin:0 auto;padding:0 1rem">'+
'<div style="display:flex;align-items:center;justify-content:space-between;height:4rem">'+
'<a href="index.html" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none">'+
'<img src="logo-header.png" alt="Inflexion" id="nav-logo" style="height:50px;width:auto;filter:brightness(10) saturate(0);transition:filter .3s ease"/></a>'+
'<nav style="display:none" class="md-show" id="desktop-nav-items">'+megaHTML+
'<a href="premium.html" style="margin-left:1rem;padding:0.5rem 1rem;background:#006650;color:#fff;font-weight:600;font-size:0.875rem;border-radius:0.5rem;transition:background .2s;text-decoration:none" onmouseover="this.style.background=\'#06402A\'" onmouseout="this.style.background=\'#006650\'">R\u00e9server un diagnostic</a>'+
'</nav>'+
'<button id="mobile-menu-btn" style="display:none;padding:0.5rem" class="md-hide" aria-label="Menu">'+
'<div style="display:flex;flex-direction:column;gap:6px"><span class="hamburger-bar" style="display:block;width:24px;height:2px;background:#fff;transition:all .3s"></span>'+
'<span class="hamburger-bar" style="display:block;width:24px;height:2px;background:#fff;transition:all .3s"></span>'+
'<span class="hamburger-bar" style="display:block;width:24px;height:2px;background:#fff;transition:all .3s"></span></div></button>'+
'</div></div>';

// Add responsive CSS for md breakpoint
var mdCss=document.createElement('style');
mdCss.textContent='@media(min-width:768px){#desktop-nav-items{display:flex!important;align-items:center;gap:4px}#mobile-menu-btn{display:none!important}}@media(max-width:767px){#desktop-nav-items{display:none!important}#mobile-menu-btn{display:block!important}}';
document.head.appendChild(mdCss);

document.body.insertBefore(header,bronzeBar.nextSibling);

// ── Build Mobile Overlay ──
var overlay=document.createElement('div');
overlay.id='mobile-overlay';
overlay.style.cssText='position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background-color:#006650;opacity:0;visibility:hidden;transition:opacity .35s cubic-bezier(.4,0,.2,1),visibility .35s;height:100dvh';

var mobileLinks=MEGA_NAV.map(function(cat,ci){
var links=cat.children.map(function(item,ii){
return '<a href="'+item.href+'" class="mobile-nav-link" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0;color:rgba(255,255,255,.9);transition:color .2s;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.08);opacity:0;animation-delay:'+(0.08+ci*0.18+ii*0.05)+'s;font-size:1rem;font-weight:500">'+
'<span style="font-size:1rem">'+item.icon+'</span>'+
'<span>'+item.label+'</span></a>';
}).join('');
return '<p class="mobile-nav-link" style="font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,.4);font-weight:600;margin-bottom:0.75rem;opacity:0;animation-delay:'+(0.05+ci*0.18)+'s'+(ci>0?';margin-top:2rem':'')+'">' +cat.label+'</p>'+links;
}).join('');

overlay.innerHTML=
'<div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem 1rem;flex-shrink:0">'+
'<img src="logo-header.png" alt="Inflexion" style="height:2rem;width:auto;filter:brightness(10) saturate(0)"/>'+
'<button id="mobile-close-btn" style="width:2.75rem;height:2.75rem;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:rgba(255,255,255,.1);border:none;cursor:pointer;transition:background .2s" onmouseover="this.style.background=\'rgba(255,255,255,.2)\'" onmouseout="this.style.background=\'rgba(255,255,255,.1)\'" aria-label="Fermer">'+
'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
'<div style="flex:1;overflow-y:auto;padding:0.5rem 1.5rem 1rem">'+mobileLinks+'</div>'+
'<div style="padding:1rem 1.5rem 5rem;flex-shrink:0">'+
'<a href="premium.html" class="mobile-nav-link" style="display:block;width:100%;text-align:center;padding:0.875rem 1.5rem;background:rgba(255,255,255,.1);color:#fff;font-weight:600;border-radius:0.75rem;transition:background .2s;font-size:1rem;text-decoration:none;opacity:0;animation-delay:0.85s" onmouseover="this.style.background=\'rgba(255,255,255,.15)\'" onmouseout="this.style.background=\'rgba(255,255,255,.1)\'">R\u00e9server un diagnostic</a></div>';

header.after(overlay);

// ── Build Page Hero ──
var oldPageHeader=document.querySelector('.page-header');
var premiumHero=document.querySelector('.premium-hero');
var expertiseHero=document.querySelector('.expertise-hero');
var mainEl=document.querySelector('main.main-content,main#main-content');

function buildHero(catLabel,titleText,subtitleText){
var hero=document.createElement('section');
hero.style.cssText='position:relative;padding:7rem 0 3.5rem;background-color:#006650';
hero.innerHTML=
'<div style="max-width:80rem;margin:0 auto;padding:0 1rem">'+
'<div style="max-width:42rem">'+
'<p class="ns-anim" style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#33B894;margin-bottom:1rem;font-family:Inter,sans-serif">'+catLabel+'</p>'+
'<h1 class="ns-anim ns-anim-d1" style="font-size:clamp(1.5rem,5vw,3rem);font-weight:700;color:#fff;line-height:1.1;letter-spacing:-0.02em;font-family:Libre Baskerville,Georgia,serif">'+titleText+'</h1>'+
(subtitleText?'<p class="ns-anim ns-anim-d2" style="margin-top:1.25rem;font-size:clamp(0.875rem,2vw,1.125rem);color:rgba(255,255,255,.5);line-height:1.6;max-width:32rem;font-family:Inter,sans-serif">'+subtitleText+'</p>':'')+
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
newFooter.style.cssText='border-top:1px solid #E2E5EB;background:#F7F8FA;padding:3rem 0 2rem';

var sourceTags=FOOTER_SOURCES.map(function(s){return '<span style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(90,97,120,.4);font-weight:500">'+s+'</span>';}).join('');

newFooter.innerHTML=
'<div style="max-width:80rem;margin:0 auto;padding:0 1rem">'+
'<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:2.5rem;margin-bottom:3rem" class="footer-grid">'+
// Col 1
'<div style="grid-column:span 2" class="footer-col1">'+
'<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem"><img src="logo-header.png" alt="Inflexion" style="height:2.5rem;width:auto"/></div>'+
'<p style="font-size:0.875rem;color:#5A6178;line-height:1.6;font-family:Inter,sans-serif">Intelligence financi\u00e8re et g\u00e9opolitique. Donn\u00e9es en temps r\u00e9el, analyses IA, signaux faibles.</p></div>'+
// Col 2
'<div><p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#1A1F2E;margin-bottom:1rem;font-family:Inter,sans-serif">Intelligence</p>'+
'<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">'+
'<li><a href="geopolitics.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">G\u00e9opolitique</a></li>'+
'<li><a href="markets.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">March\u00e9s</a></li>'+
'<li><a href="crypto.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">Crypto</a></li>'+
'<li><a href="commodities.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">Mati\u00e8res premi\u00e8res</a></li>'+
'<li><a href="etf.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">ETF & Fonds</a></li>'+
'</ul></div>'+
// Col 3
'<div><p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#1A1F2E;margin-bottom:1rem;font-family:Inter,sans-serif">Plateforme</p>'+
'<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">'+
'<li><a href="analyses.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">Analyses</a></li>'+
'<li><a href="expertise.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">Expertise</a></li>'+
'<li><a href="premium.html" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">Services</a></li>'+
'<li><a href="premium.html#contact" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s" onmouseover="this.style.color=\'#006650\'" onmouseout="this.style.color=\'#5A6178\'">Contact</a></li>'+
'</ul></div>'+
'</div>'+
// Bottom bar
'<div style="border-top:1px solid #E2E5EB;padding-top:2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center">'+
'<span style="font-size:0.875rem;color:#5A6178;font-family:Inter,sans-serif">\u00a9 2026 Inflexion \u2014 Intelligence financi\u00e8re & g\u00e9opolitique</span>'+
'<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.75rem">'+sourceTags+'</div>'+
'</div></div>';

// Responsive footer grid
var footerCss=document.createElement('style');
footerCss.textContent='@media(min-width:768px){.footer-grid{grid-template-columns:repeat(4,1fr)!important}.footer-col1{grid-column:span 1!important}}@media(min-width:768px){.footer-grid>div:last-child+div{}}';
document.head.appendChild(footerCss);

oldFooter.parentNode.replaceChild(newFooter,oldFooter);
}

// ── Scroll Handler ──
var scrolled=false;
function onScroll(){
var s=window.scrollY>60;
if(s===scrolled)return;
scrolled=s;
if(scrolled){
header.style.background='rgba(255,255,255,.92)';
header.style.backdropFilter='blur(16px)';
header.style.borderBottom='1px solid #E2E5EB';
header.style.boxShadow='0 1px 8px rgba(0,0,0,.04)';
}else{
header.style.background='transparent';
header.style.backdropFilter='';
header.style.borderBottom='';
header.style.boxShadow='';
}
// Update nav link colors
var links=header.querySelectorAll('.nav-link-new');
links.forEach(function(el){
el.style.color=scrolled?'#6b7280':'rgba(255,255,255,.7)';
});
// Update logo
var logo=document.getElementById('nav-logo');
if(logo)logo.style.filter=scrolled?'none':'brightness(10) saturate(0)';
// Update hamburger bars
header.querySelectorAll('.hamburger-bar').forEach(function(b){
b.style.background=scrolled?'#1A1F2E':'#fff';
});
}
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();

// ── Mobile Menu ──
var mobileOpen=false;
function toggleMobile(open){
mobileOpen=open;
if(open){
overlay.style.opacity='1';overlay.style.visibility='visible';
document.body.style.overflow='hidden';
overlay.querySelectorAll('.mobile-nav-link').forEach(function(el){el.style.animation='ns-menu-item-in .4s ease-out forwards';});
}else{
overlay.style.opacity='0';overlay.style.visibility='hidden';
document.body.style.overflow='';
overlay.querySelectorAll('.mobile-nav-link').forEach(function(el){el.style.animation='';el.style.opacity='0';});
}
}
document.getElementById('mobile-menu-btn').addEventListener('click',function(){toggleMobile(!mobileOpen);});
document.getElementById('mobile-close-btn').addEventListener('click',function(){toggleMobile(false);});
overlay.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){toggleMobile(false);});});

})();
