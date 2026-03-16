/* semplice-zones-config.js — Source unique des zones SEMPLICE v2.1
   Utilisé par expertise.html (radar) et country.html (carte + scatter + tableau)
   Échelle 1-7 risque ET opportunité — 18 zones évaluées */

var SEMPLICE_DIM_LABELS=['Social','Économique','Militaire','Politique','Légal','Information','Cyber','Environnemental'];
var SEMPLICE_OPP_LABELS=['Capital humain','Croissance','Sécurité','Gouvernance','Attract. juridique','Innovation','Maturité tech','Durabilité'];
var SEMPLICE_DIM_SHORT=['S','E','M','P','L','I','C','E'];

var SEMPLICE_ZONES=[
    {id:'ormuz',name:'Détroit d\'Ormuz',
     scores:[4.4,5.7,6.2,6.7,6.9,6.9,6.5,5.2],composite:6.2,level:'Critique',
     opp:[3.3,2.5,2.4,1.9,1.3,2.3,2.2,1.9],oppComposite:2.2,oppLevel:'Faible',
     color:'#7C2D12',fill:'rgba(124,45,18,0.10)',href:'analyse-petrole-trump-iran-ormuz.html',
     center:[26.5,56],zoom:6,gdp:510,region:'Moyen-Orient'},

    {id:'sahel',name:'Sahel',
     scores:[6.6,4.7,5.9,6.8,5.8,5.8,4.8,5.8],composite:5.8,level:'Très élevé',
     opp:[2.2,3.3,2.2,1.9,2.8,2.0,2.2,3.0],oppComposite:2.6,oppLevel:'Faible',
     color:'#C8955A',fill:'rgba(200,149,90,0.10)',href:'analyse-sahel-mali-niger-burkina-crise.html',
     center:[15,2],zoom:5,gdp:45,region:'Afrique'},

    {id:'ukraine',name:'Ukraine / Mer Noire',
     scores:[5.6,5.7,6.6,5.4,4.7,5.8,6.3,4.6],composite:5.6,level:'Très élevé',
     opp:[4,3,1,3,3,5,4,3],oppComposite:3.2,oppLevel:'Modéré',
     color:'#DC2626',fill:'rgba(220,38,38,0.10)',href:'analyse-ukraine-mer-noire-guerre-attrition.html',
     center:[48.5,35],zoom:5,gdp:178,region:'Europe'},

    {id:'cuba',name:'Cuba',
     scores:[3.8,6.0,3.3,5.6,5.9,5.6,4.2,4.1],composite:5.0,level:'Élevé',
     opp:[3.3,1.9,3.1,1.8,1.9,2.0,2.2,3.0],oppComposite:2.3,oppLevel:'Faible',
     color:'#9333ea',fill:'rgba(147,51,234,0.10)',href:'analyse-cuba-crise-perspectives.html',
     center:[21.5,-79.9],zoom:7,gdp:107,region:'Amériques'},

    {id:'chine',name:'Mer de Chine',
     scores:[3.5,3.6,4.7,5.0,3.9,6.9,5.0,3.9],composite:4.8,level:'Élevé',
     opp:[5.0,5.9,4.2,3.1,4.1,6.2,5.9,4.9],oppComposite:5.4,oppLevel:'Très élevé',
     color:'#f59e0b',fill:'rgba(245,158,11,0.10)',href:'analyse-mer-chine-taiwan-indopacifique.html',
     center:[16,115],zoom:5,gdp:18000,region:'Asie'},

    {id:'madagascar',name:'Madagascar',
     scores:[5.8,4.1,4.2,5.5,4.9,3.5,4.7,4.3],composite:4.6,level:'Élevé',
     opp:[1.9,2.7,2.1,1.9,2.2,1.7,1.2,2.0],oppComposite:2.0,oppLevel:'Minimal',
     color:'#be185d',fill:'rgba(190,24,93,0.10)',href:'analyse-madagascar-fragilite-ressources.html',
     center:[-18.9,47.5],zoom:5,gdp:14.5,region:'Afrique'},

    {id:'turquie',name:'Turquie',
     scores:[3.7,3.9,3.7,5.1,4.5,5.7,3.8,3.9],composite:4.3,level:'Élevé',
     opp:[3.5,4.1,4.4,3.0,3.4,4.1,4.1,3.0],oppComposite:3.7,oppLevel:'Modéré',
     color:'#0891b2',fill:'rgba(8,145,178,0.10)',href:'analyse-turquie-erdogan-equilibriste.html',
     center:[39,35],zoom:6,gdp:905,region:'Europe'},

    {id:'inde',name:'Inde',
     scores:[4.1,2.9,4.0,3.8,3.8,4.5,3.2,4.9],composite:3.9,level:'Modéré',
     opp:[3.5,5.0,3.5,3.5,3.0,5.0,4.5,3.5],oppComposite:4.0,oppLevel:'Modéré',
     color:'#ea580c',fill:'rgba(234,88,12,0.10)',href:'#',
     center:[21,78],zoom:5,gdp:3730,region:'Asie'},

    {id:'bresil',name:'Brésil',
     scores:[3.5,3.6,2.4,3.8,3.4,3.5,4.1,4.2],composite:3.5,level:'Modéré',
     opp:[4.5,5.5,3.5,3.5,3.0,4.0,4.5,5.5],oppComposite:4.2,oppLevel:'Élevé',
     color:'#16a34a',fill:'rgba(22,163,74,0.10)',href:'#',
     center:[-14,-51],zoom:4,gdp:2130,region:'Amériques'},

    {id:'tamil',name:'Tamil Nadu',
     scores:[2.8,2.1,3.2,2.9,3.8,4.0,3.2,4.0],composite:3.2,level:'Modéré',
     opp:[5.5,6.0,4.5,4.5,3.0,5.5,5.0,4.5],oppComposite:4.9,oppLevel:'Élevé',
     color:'#006650',fill:'rgba(0,102,80,0.10)',href:'analyse-corridor-defense-france-inde.html',
     center:[11,79],zoom:7,gdp:310,region:'Asie'},

    {id:'arctique',name:'Arctique',
     scores:[2.9,2.8,4.5,2.5,1.6,3.1,3.6,3.5],composite:3.1,level:'Modéré',
     opp:[5.3,5.2,4.6,6.1,5.9,5.2,6.2,6.2],oppComposite:5.6,oppLevel:'Très élevé',
     color:'#d97706',fill:'rgba(217,119,6,0.10)',href:'analyse-arctique-groenland-grand-jeu-polaire.html',
     center:[74,0],zoom:3,gdp:2100,region:'Multi'},

    {id:'ile-maurice',name:'Île Maurice',
     scores:[2.4,2.3,1.2,2.2,2.2,2.4,3.2,3.8],composite:2.5,level:'Modéré-Faible',
     opp:[4.5,4.0,5.0,5.0,5.5,3.5,4.0,3.5],oppComposite:4.3,oppLevel:'Significatif',
     color:'#7c3aed',fill:'rgba(124,58,237,0.10)',href:'#',
     center:[-20.25,57.55],zoom:9,gdp:14.8,region:'Afrique'},

    {id:'singapour',name:'Singapour',
     scores:[2.2,1.4,2.7,1.9,1.2,3.2,2.1,2.9],composite:2.2,level:'Modéré-Faible',
     opp:[5,5,5,6,6,6,6,4],oppComposite:5.5,oppLevel:'Très élevé',
     color:'#6366f1',fill:'rgba(99,102,241,0.10)',href:'#',
     center:[1.35,103.82],zoom:11,gdp:397,region:'Asie'},

    {id:'republique-tcheque',name:'République tchèque',
     scores:[1.7,1.9,1.7,1.6,1.7,1.6,2.8,2.6],composite:1.9,level:'Faible',
     opp:[5.4,3.9,4.8,5.5,5.0,3.9,5.1,4.0],oppComposite:4.7,oppLevel:'Élevé',
     color:'#0d9488',fill:'rgba(13,148,136,0.10)',href:'#',
     center:[49.8,15.5],zoom:7,gdp:330,region:'Europe'},

    {id:'iran',name:'Iran',
     scores:[4.2,4.6,5.5,5.7,5.5,5.9,4.8,4.6],composite:5.1,level:'Très élevé',
     opp:[3.9,3.0,3.1,1.7,1.9,2.8,2.2,1.8],oppComposite:2.5,oppLevel:'Faible',
     color:'#991b1b',fill:'rgba(153,27,27,0.10)',href:'#',
     center:[32,53],zoom:5,gdp:388,region:'Moyen-Orient'},

    {id:'mexique',name:'Mexique',
     scores:[3.6,2.4,3.3,3.6,3.6,3.3,3.8,3.6],composite:3.4,level:'Modéré',
     opp:[3.9,4.3,3.7,3.7,3.9,3.2,3.3,3.1],oppComposite:3.7,oppLevel:'Modéré',
     color:'#2563eb',fill:'rgba(37,99,235,0.10)',href:'#',
     center:[23.6,-102.5],zoom:5,gdp:1790,region:'Amériques'},

    {id:'vietnam',name:'Vietnam',
     scores:[3.0,2.9,3.9,3.7,3.7,5.5,4.1,3.7],composite:3.8,level:'Modéré',
     opp:[4.8,4.9,3.9,3.6,4.1,3.6,3.8,3.0],oppComposite:4.0,oppLevel:'Modéré',
     color:'#db2777',fill:'rgba(219,39,119,0.10)',href:'#',
     center:[16,107.8],zoom:6,gdp:430,region:'Asie'},

    {id:'ethiopie',name:'Éthiopie',
     scores:[5.2,4.3,4.5,5.1,4.6,4.8,3.9,3.5],composite:4.5,level:'Élevé',
     opp:[2.6,3.6,3.0,2.7,2.8,1.9,1.9,3.0],oppComposite:2.8,oppLevel:'Faible',
     color:'#92400e',fill:'rgba(146,64,14,0.10)',href:'#',
     center:[9.1,40.5],zoom:6,gdp:156,region:'Afrique'}
];
