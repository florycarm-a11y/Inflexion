/**
 * nav-config.js — Source de vérité unique pour la navigation Inflexion
 * Chargé AVANT nav-shared.js (legacy) et les scripts React (index/analyses/articles)
 */
;(function(){
'use strict';
window.MEGA_NAV=[
{label:'Analyses',children:[
 {icon:'Bj',label:'Briefing du jour',desc:'Synthèse IA quotidienne',href:'briefing.html'},
 {icon:'An',label:'Analyses approfondies',desc:'Décryptages thématiques',href:'analyses.html'},
 {icon:'Mc',label:'Macro par pays',desc:'Données World Bank & indicateurs',href:'country.html'},
]},
{label:'Expertise',children:[
 {icon:'Se',label:'SEMPLICE',desc:'Notre cadre d\'évaluation géopolitique en 8 dimensions',href:'expertise.html#semplice'},
 {icon:'Na',label:'Notre approche',desc:'Méthodologie & cadre d\'analyse',href:'expertise.html'},
 {icon:'Ia',label:'Pipeline IA',desc:'163 flux RSS, 15 APIs, Claude IA',href:'expertise.html#pipeline'},
 {icon:'Sd',label:'Sources & données',desc:'Transparence sur nos flux',href:'expertise.html#sources'},
]},
{label:'Intelligence',children:[
 {icon:'Gp',label:'Géopolitique',desc:'Risques pays & tensions internationales',href:'geopolitics.html'},
 {icon:'Mk',label:'Marchés',desc:'Actions, indices, taux & devises',href:'markets.html'},
 {icon:'Cr',label:'Crypto & Blockchain',desc:'Bitcoin, DeFi, régulation',href:'crypto.html'},
 {icon:'Mp',label:'Matières premières',desc:'Or, pétrole, métaux & énergie',href:'commodities.html'},
 {icon:'Ef',label:'ETF & Fonds',desc:'Allocations & flux de capitaux',href:'etf.html'},
]},
{label:'Services',children:[
 {icon:'Ds',label:'Diagnostic stratégique',desc:'Audit personnalisé de vos positions',href:'premium.html'},
 {icon:'Av',label:'Alertes & veille',desc:'Notifications personnalisées',href:'premium.html#alertes'},
 {icon:'Rm',label:'Rapports sur mesure',desc:'Analyses dédiées à votre portefeuille',href:'premium.html#rapports'},
]},
];

window.MEGA_FOOTERS=[
'Analyses · Mis à jour quotidiennement',
'Méthodologie · Transparence totale',
'5 rubriques · Données temps réel',
'Services · Sur mesure',
];
})();
