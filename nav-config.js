/**
 * nav-config.js — Source de vérité unique pour la navigation Inflexion
 * Chargé AVANT nav-shared.js (legacy) et les scripts React (index/analyses/articles)
 *
 * Pivot du 21 novembre 2026 : le tracker d'inflexions devient ce que le site est.
 * Les pages de veille (geopolitics, markets, crypto, commodities, etf, briefing, ai-tech)
 * sortent de la navigation mais restent dans le dépôt, accessibles par URL directe.
 */
;(function(){
'use strict';
// Nombre de sources affiché là où l'expertise le cite. Une seule valeur à modifier.
var SOURCES_COUNT=178;
window.SOURCES_COUNT=SOURCES_COUNT;
window.MEGA_NAV=[
{label:'Tracker',children:[
 {icon:'So',label:'Sociétés suivies',desc:'Une fiche par société portée par un récit',href:'index.html#societes'},
 {icon:'Al',label:'Alertes',desc:'Rechutes d\'abord, puis Bascules',href:'index.html#alertes'},
 {icon:'Ar',label:'Analyses — archives',desc:'Les quatorze analyses publiées',href:'analyses.html'},
]},
{label:'Méthode',children:[
 {icon:'Mc',label:'La méthode, en clair',desc:'Quatre dimensions, un solde, quatre alertes',href:'methode.html'},
 {icon:'Bt',label:'Ce que le backtest a montré',desc:'Dix-sept cas, échecs compris',href:'methode.html#backtest'},
]},
{label:'Expertise',children:[
 {icon:'Se',label:'SEMPLICE',desc:'Notre cadre d\'évaluation géopolitique en 8 dimensions',href:'expertise.html#semplice'},
 {icon:'Na',label:'Notre approche',desc:'Méthodologie & cadre d\'analyse',href:'expertise.html'},
 {icon:'Rp',label:'Radar Pays',desc:'Carte des zones évaluées, risque & opportunité',href:'country.html'},
 {icon:'Sd',label:'Sources & données',desc:'Transparence sur nos flux',href:'expertise.html#sources'},
]},
{label:'Services',children:[
 {icon:'Ds',label:'Diagnostic stratégique',desc:'Audit personnalisé de vos positions',href:'premium.html'},
 {icon:'Av',label:'Alertes & veille',desc:'Notifications personnalisées',href:'premium.html#alertes'},
 {icon:'Rm',label:'Rapports sur mesure',desc:'Analyses dédiées à votre portefeuille',href:'premium.html#rapports'},
]},
];
})();
