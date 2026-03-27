/**
 * nav-shared.js — Modern Inflexion Navigation Shell
 * Replaces old header/nav/hero/footer with the new design system.
 * Matches index.html design: monograms, bronze accents, category headers, footer strips.
 * Include AFTER app.js and data-loader.js.
 */
(function(){
'use strict';

// ── Inject required CSS (matches index.html mega menu styles) ──
var css=document.createElement('style');
css.textContent=
'/* Nav shared styles */\n'+
'/* Hover states (replaces inline onmouseover/onmouseout) */\n'+
'.ns-btn-cta:hover{background:#06402A!important}\n'+
'.ns-close-btn:hover{background:rgba(255,255,255,.2)!important}\n'+
'.ns-mobile-cta:hover{background:rgba(255,255,255,.15)!important}\n'+
'.ns-footer-link:hover{color:#006650!important}\n'+
'.nav-link-new{position:relative}\n'+
'.nav-link-new::after{content:"";position:absolute;bottom:-2px;left:0;width:100%;height:2px;background:#006650;transform:scaleX(0);transition:transform .25s ease}\n'+
'.nav-link-new:hover::after,.nav-link-new.active::after{transform:scaleX(1)}\n'+
'.mega-trigger{position:relative}\n'+
'.mega-menu{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%) translateY(10px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .28s cubic-bezier(.4,0,.2,1),transform .28s cubic-bezier(.4,0,.2,1),visibility .28s;z-index:60;min-width:340px;padding:0;overflow:hidden}\n'+
'.mega-trigger:hover .mega-menu,.mega-menu:hover{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}\n'+
'.mega-menu::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#C8955A 20%,#C8955A 80%,transparent);z-index:2}\n'+
'.mega-menu::after{content:"";position:absolute;top:2px;right:0;width:60px;height:60px;background:radial-gradient(circle at top right,rgba(200,149,90,.06) 0%,transparent 70%);pointer-events:none}\n'+
'.mega-cat-header{font-family:"Libre Baskerville",Georgia,serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.18em;color:#C8955A;padding:20px 20px 10px;border-bottom:1px solid #F0F1F4;margin-bottom:4px;display:flex;align-items:center;gap:8px}\n'+
'.mega-cat-header::before{content:"";width:12px;height:1px;background:#C8955A}\n'+
'.mega-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:8px 10px 12px}\n'+
'.mega-list{display:flex;flex-direction:column;gap:2px;padding:8px 10px 12px}\n'+
'.mega-item{position:relative;display:flex;align-items:flex-start;gap:14px;padding:12px 14px;border-radius:10px;text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);border:1px solid transparent;overflow:hidden}\n'+
'.mega-item::before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);width:0;height:60%;background:#006650;border-radius:0 2px 2px 0;transition:width .2s cubic-bezier(.4,0,.2,1)}\n'+
'.mega-item:hover{background:#F8FAF9;border-color:#E8EDE9}\n'+
'.mega-item:hover::before{width:3px}\n'+
'.mega-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:"Libre Baskerville",Georgia,serif;font-size:12px;font-weight:700;font-style:italic;color:#006650;background:linear-gradient(135deg,rgba(0,102,80,.05) 0%,rgba(0,102,80,.1) 100%);border:1px solid rgba(0,102,80,.1);transition:all .25s cubic-bezier(.4,0,.2,1);letter-spacing:-.02em}\n'+
'.mega-item:hover .mega-icon{color:#fff;background:linear-gradient(135deg,#006650 0%,#06402A 100%);border-color:#006650;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,102,80,.18)}\n'+
'.mega-label{font-size:13.5px;font-weight:600;color:#1A1F2E;transition:color .2s}\n'+
'.mega-item:hover .mega-label{color:#006650}\n'+
'.mega-desc{font-size:11.5px;color:#6B7280;margin-top:2px;transition:color .2s}\n'+
'.mega-item:hover .mega-desc{color:#6B7280}\n'+
'.mega-arrow{position:absolute;right:12px;top:50%;transform:translateY(-50%) translateX(-4px);opacity:0;color:#006650;font-size:13px;font-weight:700;transition:all .2s cubic-bezier(.4,0,.2,1)}\n'+
'.mega-item:hover .mega-arrow{opacity:1;transform:translateY(-50%) translateX(0)}\n'+
'@keyframes mega-item-reveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\n'+
'.mega-trigger:hover .mega-item{animation:mega-item-reveal .3s cubic-bezier(.4,0,.2,1) both}\n'+
'.mega-trigger:hover .mega-item:nth-child(1){animation-delay:.04s}\n'+
'.mega-trigger:hover .mega-item:nth-child(2){animation-delay:.08s}\n'+
'.mega-trigger:hover .mega-item:nth-child(3){animation-delay:.12s}\n'+
'.mega-trigger:hover .mega-item:nth-child(4){animation-delay:.16s}\n'+
'.mega-trigger:hover .mega-item:nth-child(5){animation-delay:.20s}\n'+
'.mega-footer{padding:10px 20px;background:#F9FAFB;border-top:1px solid #F0F1F4;display:flex;align-items:center;gap:6px;font-size:10.5px;color:#A0A8B8;letter-spacing:.04em;font-weight:500}\n'+
'.mega-footer-dot{width:4px;height:4px;border-radius:50%;background:#C8955A;flex-shrink:0}\n'+
'@keyframes ns-fade-up{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}\n'+
'@keyframes ns-menu-item-in{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}\n'+
'.ns-anim{animation:ns-fade-up .6s ease-out both}\n'+
'.ns-anim-d1{animation-delay:.1s}.ns-anim-d2{animation-delay:.2s}\n'+
'/* Hamburger open animation */\n'+
'.hamburger-open .hamburger-bar:nth-child(1){transform:translateY(8px) rotate(45deg)}\n'+
'.hamburger-open .hamburger-bar:nth-child(2){opacity:0}\n'+
'.hamburger-open .hamburger-bar:nth-child(3){transform:translateY(-8px) rotate(-45deg)}\n'+
'/* Nav link hover emerald when scrolled */\n'+
'.nav-scrolled-mode .nav-link-new:hover{color:#006650!important}\n'+
'/* Hide old elements */\n'+
'header.header,nav.nav-overlay,button.back-to-top{display:none!important}\n';
document.head.appendChild(css);

// ── Navigation Data : chargée depuis nav-config.js (source unique) ──
// MEGA_NAV et MEGA_FOOTERS sont définis dans window par nav-config.js

var CATEGORY_LABELS={
geopolitics:'Risques & tensions internationales',
markets:'Actions, indices, taux & devises',
crypto:'Bitcoin, DeFi & blockchain',
commodities:'Or, p\u00e9trole, m\u00e9taux & \u00e9nergie',
etf:'Fonds indiciels & allocations',
macro:'Donn\u00e9es macro\u00e9conomiques',
briefing:'Intelligence quotidienne — Signal & Risk Radar',
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

var megaHTML=MEGA_NAV.map(function(cat,ci){
var isWide=ci===0;
var ch=cat.children.map(function(item){
return '<a href="'+item.href+'" class="mega-item">'+
'<span class="mega-icon">'+item.icon+'</span>'+
'<span style="display:flex;flex-direction:column">'+
'<span class="mega-label">'+item.label+'</span>'+
'<span class="mega-desc">'+item.desc+'</span>'+
'</span>'+
'<span class="mega-arrow">\u2192</span>'+
'</a>';
}).join('');
return '<div class="mega-trigger">'+
'<span class="nav-link-new" style="padding:0.5rem 0.75rem;font-size:0.875rem;font-weight:500;transition:color .2s;cursor:default;user-select:none;color:rgba(255,255,255,.7)">'+cat.label+'</span>'+
'<div class="mega-menu" style="background:#fff;border-radius:1rem;box-shadow:0 20px 60px rgba(0,20,15,.12),0 8px 24px rgba(0,20,15,.06);border:1px solid rgba(243,244,246,.8)'+(isWide?';min-width:480px':'')+'">'+
'<div class="mega-cat-header">'+cat.label+'</div>'+
'<div class="'+(isWide?'mega-grid':'mega-list')+'">'+ch+'</div>'+
'<div class="mega-footer"><span class="mega-footer-dot"></span>'+MEGA_FOOTERS[ci]+'</div>'+
'</div></div>';
}).join('');

header.innerHTML=
'<div style="max-width:80rem;margin:0 auto;padding:0 1rem">'+
'<div style="display:flex;align-items:center;justify-content:space-between;height:4rem">'+
'<a href="index.html" style="display:flex;align-items:center;gap:0.5rem;text-decoration:none">'+
'<img src="logo-header.png" alt="Inflexion" id="nav-logo" style="height:40px;width:auto;filter:brightness(10) saturate(0);transition:filter .3s ease"/></a>'+
'<nav style="display:none" class="md-show" id="desktop-nav-items">'+megaHTML+
'<a href="premium.html" class="ns-btn-cta" style="margin-left:0.5rem;padding:0.5rem 1rem;background:#006650;color:#fff;font-weight:600;font-size:0.875rem;border-radius:0.5rem;transition:background .2s;text-decoration:none">R\u00e9server un diagnostic</a>'+
'</nav>'+
'<button id="mobile-menu-btn" style="display:none;padding:0.5rem" class="md-hide" aria-label="Menu" aria-expanded="false">'+
'<div id="hamburger-wrapper" style="display:flex;flex-direction:column;gap:6px"><span class="hamburger-bar" style="display:block;width:24px;height:2px;background:#fff;transition:all .3s;transform-origin:center"></span>'+
'<span class="hamburger-bar" style="display:block;width:24px;height:2px;background:#fff;transition:all .3s"></span>'+
'<span class="hamburger-bar" style="display:block;width:24px;height:2px;background:#fff;transition:all .3s;transform-origin:center"></span></div></button>'+
'</div></div>';

// Add responsive CSS for md breakpoint + logo responsive sizing
var mdCss=document.createElement('style');
mdCss.textContent='@media(min-width:768px){#desktop-nav-items{display:flex!important;align-items:center;gap:4px}#mobile-menu-btn{display:none!important}#nav-logo{height:50px!important}}@media(min-width:1024px){#nav-logo{height:65px!important}}@media(max-width:767px){#desktop-nav-items{display:none!important}#mobile-menu-btn{display:block!important}}';
document.head.appendChild(mdCss);

document.body.insertBefore(header,bronzeBar.nextSibling);

// ── Build Mobile Overlay ──
var overlay=document.createElement('div');
overlay.id='mobile-overlay';
overlay.style.cssText='position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;background-color:#006650;opacity:0;visibility:hidden;transition:opacity .35s cubic-bezier(.4,0,.2,1),visibility .35s;height:100dvh';

var mobileLinks=MEGA_NAV.map(function(cat,ci){
var links=cat.children.map(function(item,ii){
return '<a href="'+item.href+'" class="mobile-nav-link" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 0;color:rgba(255,255,255,.9);transition:color .2s;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.08);opacity:0;animation-delay:'+(0.08+ci*0.18+ii*0.05)+'s;font-size:1rem;font-weight:500">'+
'<span style="width:2rem;height:2rem;border-radius:0.5rem;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);font-family:Libre Baskerville,Georgia,serif;font-style:italic;font-weight:700;font-size:11px;color:rgba(255,255,255,.7);flex-shrink:0">'+item.icon+'</span>'+
'<span>'+item.label+'</span></a>';
}).join('');
return '<p class="mobile-nav-link" style="font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,.4);font-weight:600;margin-bottom:0.75rem;opacity:0;animation-delay:'+(0.05+ci*0.18)+'s'+(ci>0?';margin-top:2rem':'')+'">' +cat.label+'</p>'+links;
}).join('');

overlay.innerHTML=
'<div style="display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem 1rem;flex-shrink:0">'+
'<img src="logo-header.png" alt="Inflexion" style="height:2rem;width:auto;filter:brightness(10) saturate(0)"/>'+
'<button id="mobile-close-btn" class="ns-close-btn" style="width:2.75rem;height:2.75rem;display:flex;align-items:center;justify-content:center;border-radius:9999px;background:rgba(255,255,255,.1);border:none;cursor:pointer;transition:background .2s" aria-label="Fermer">'+
'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
'<div style="flex:1;overflow-y:auto;padding:0.5rem 1.5rem 1rem">'+mobileLinks+'</div>'+
'<div style="padding:1rem 1.5rem 5rem;flex-shrink:0">'+
'<a href="premium.html" class="mobile-nav-link ns-mobile-cta" style="display:block;width:100%;text-align:center;padding:0.875rem 1.5rem;background:rgba(255,255,255,.1);color:#fff;font-weight:600;border-radius:0.75rem;transition:background .2s;font-size:1rem;text-decoration:none;opacity:0;animation-delay:0.85s">R\u00e9server un diagnostic</a></div>';

header.after(overlay);

// ── Build Page Hero ──
var oldPageHeader=document.querySelector('.page-header');
var premiumHero=document.querySelector('.premium-hero');
var expertiseHero=document.querySelector('.expertise-hero');
var mainEl=document.querySelector('main.main-content,main#main-content');

function buildHero(catLabel,titleText,subtitleText){
var hero=document.createElement('section');
hero.style.cssText='position:relative;padding:5rem 0 3rem;background-color:#006650';
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
'<li><a href="geopolitics.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">G\u00e9opolitique</a></li>'+
'<li><a href="markets.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">March\u00e9s</a></li>'+
'<li><a href="crypto.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">Crypto</a></li>'+
'<li><a href="commodities.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">Mati\u00e8res premi\u00e8res</a></li>'+
'<li><a href="etf.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">ETF & Fonds</a></li>'+
'</ul></div>'+
// Col 3
'<div><p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#1A1F2E;margin-bottom:1rem;font-family:Inter,sans-serif">Plateforme</p>'+
'<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.625rem">'+
'<li><a href="analyses.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">Analyses</a></li>'+
'<li><a href="expertise.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">Expertise</a></li>'+
'<li><a href="premium.html" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">Services</a></li>'+
'<li><a href="premium.html#contact" class="ns-footer-link" style="font-size:0.875rem;color:#5A6178;text-decoration:none;transition:color .2s">Contact</a></li>'+
'</ul></div>'+
'</div>'+
// Bottom bar
'<div style="border-top:1px solid #E2E5EB;padding-top:2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center">'+
'<span style="font-size:0.875rem;color:#5A6178;font-family:Inter,sans-serif">\u00a9 2026 Inflexion \u2014 Intelligence financi\u00e8re & g\u00e9opolitique</span>'+
'<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:0.75rem">'+sourceTags+'</div>'+
'</div></div>';

// Responsive footer grid
var footerCss=document.createElement('style');
footerCss.textContent='@media(min-width:768px){.footer-grid{grid-template-columns:repeat(4,1fr)!important}.footer-col1{grid-column:span 1!important}}';
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
header.style.webkitBackdropFilter='blur(16px)';
header.style.borderBottom='1px solid #E2E5EB';
header.style.boxShadow='0 1px 8px rgba(0,0,0,.04)';
header.classList.add('nav-scrolled-mode');
}else{
header.style.background='transparent';
header.style.backdropFilter='';
header.style.webkitBackdropFilter='';
header.style.borderBottom='';
header.style.boxShadow='';
header.classList.remove('nav-scrolled-mode');
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
var hamburgerWrapper=document.getElementById('hamburger-wrapper');
function toggleMobile(open){
mobileOpen=open;
var menuBtn=document.getElementById('mobile-menu-btn');
if(menuBtn)menuBtn.setAttribute('aria-expanded',open?'true':'false');
if(open){
overlay.style.opacity='1';overlay.style.visibility='visible';
document.body.style.overflow='hidden';
if(hamburgerWrapper)hamburgerWrapper.classList.add('hamburger-open');
overlay.querySelectorAll('.mobile-nav-link').forEach(function(el){el.style.animation='ns-menu-item-in .4s ease-out forwards';});
}else{
overlay.style.opacity='0';overlay.style.visibility='hidden';
document.body.style.overflow='';
if(hamburgerWrapper)hamburgerWrapper.classList.remove('hamburger-open');
overlay.querySelectorAll('.mobile-nav-link').forEach(function(el){el.style.animation='';el.style.opacity='0';});
}
}
document.getElementById('mobile-menu-btn').addEventListener('click',function(){toggleMobile(!mobileOpen);});
document.getElementById('mobile-close-btn').addEventListener('click',function(){toggleMobile(false);});
overlay.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){toggleMobile(false);});});

// ── Scroll reveal (fade-in au scroll) ──
if(!document.querySelector('script[src*="scroll-reveal"]')){
var sr=document.createElement('script');sr.src='scroll-reveal.js';document.body.appendChild(sr);
}

})();
