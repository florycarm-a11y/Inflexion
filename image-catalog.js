/**
 * Inflexion — Catalogue d'images éditorial
 * ~120 images Unsplash classées par sous-thème
 * Chaque article sans image reçoit une illustration contextuelle via matchImage()
 */
(function(){
'use strict';

var CATALOG={

// ─── GÉOPOLITIQUE ───────────────────────────────────────
'petrole':[
'photo-1518709766631-a6a7f45921c3','photo-1611273426858-450d8e3c9fce',
'photo-1545250114-3744cc9f4e17','photo-1582561971547-d3afa1e0d218'
],
'iran':[
'photo-1564594736624-def7a10ab047','photo-1590079160513-be9f0de076e4',
'photo-1547981609-4b6bfe67ca0b'
],
'russie':[
'photo-1547448526-5e9d91d7d210','photo-1513326738677-b964603b136d',
'photo-1520970014086-2208d157c9e2'
],
'chine':[
'photo-1547981609-4b6bfe67ca0b','photo-1508804185872-d7badad00f7d',
'photo-1474181628609-0b43e1a8e6e0'
],
'trump':[
'photo-1580128660010-fd027e1e587a','photo-1541872703-74c5e44368f9',
'photo-1504711434969-e33886168d9c'
],
'ukraine':[
'photo-1589519160732-57fc498494f8','photo-1599930113854-d6d7fd521f10',
'photo-1548345680-f5475ea5df84'
],
'moyen-orient':[
'photo-1547981609-4b6bfe67ca0b','photo-1564594736624-def7a10ab047',
'photo-1466442929976-97f336a657be'
],
'ormuz':[
'photo-1518709766631-a6a7f45921c3','photo-1559827260-dc66d52bef19',
'photo-1544551763-46a013bb70d5'
],
'cuba':[
'photo-1568684053302-f1fd1b017297','photo-1570299437488-d430e1e677c7',
'photo-1514862445635-d20fd2cf873e'
],
'afrique':[
'photo-1489392191049-fc10c97e64b6','photo-1547471080-7cc2caa01a7e',
'photo-1504006833117-8886a355efbf'
],
'europe':[
'photo-1467269204594-9661b134dd2b','photo-1519677100203-a0e668c92439',
'photo-1485081669829-bacb8c7bb1f3'
],
'inde':[
'photo-1524492412937-b28074a5d7da','photo-1532664189809-02133fee698d',
'photo-1548013146-72479768bada'
],
'sanctions':[
'photo-1554224155-6726b3ff858f','photo-1586892477838-2b96e85e0f96',
'photo-1589829545856-d10d557cf95f'
],
'diplomatie':[
'photo-1529107386315-e1a2ed48a620','photo-1577495508326-19a1b3cf65b7',
'photo-1541872703-74c5e44368f9'
],
'guerre':[
'photo-1548345680-f5475ea5df84','photo-1599930113854-d6d7fd521f10',
'photo-1579546929518-9e396f3cc135'
],
'election':[
'photo-1540910419892-4a36d2c3266c','photo-1494172961521-33799ddd43a5',
'photo-1598128558393-70ff21433be0'
],
'groenland':[
'photo-1531168556467-80aace0d0144','photo-1476610182966-27b72de5e"; wrong','photo-1517783999520-f068d7431d60'
],
'arctique':[
'photo-1531168556467-80aace0d0144','photo-1483728642387-6c3bdd6c93e5',
'photo-1517783999520-f068d7431d60'
],
'douane':[
'photo-1578575437130-527eed3abbec','photo-1494412574643-ff11b0a5eb19',
'photo-1586528116311-ad8dd3c8310d'
],
'tarif':[
'photo-1578575437130-527eed3abbec','photo-1494412574643-ff11b0a5eb19',
'photo-1586528116311-ad8dd3c8310d'
],

// ─── MARCHÉS & FINANCE ─────────────────────────────────
'bourse':[
'photo-1611974789855-9c2a0a7236a3','photo-1590283603385-17ffb3a7f29f',
'photo-1535320903710-d993d3d77d29','photo-1642790106117-e829e14a795f'
],
'fed':[
'photo-1541872703-74c5e44368f9','photo-1554224155-6726b3ff858f',
'photo-1526304640581-d334cdbbf45e'
],
'taux':[
'photo-1554224155-6726b3ff858f','photo-1526304640581-d334cdbbf45e',
'photo-1611974789855-9c2a0a7236a3'
],
'inflation':[
'photo-1554224155-6726b3ff858f','photo-1579621970588-a35d0e7ab9b6',
'photo-1526304640581-d334cdbbf45e'
],
'recession':[
'photo-1535320903710-d993d3d77d29','photo-1590283603385-17ffb3a7f29f',
'photo-1642790106117-e829e14a795f'
],
'sp500':[
'photo-1611974789855-9c2a0a7236a3','photo-1642790106117-e829e14a795f',
'photo-1590283603385-17ffb3a7f29f'
],
'nasdaq':[
'photo-1611974789855-9c2a0a7236a3','photo-1642790106117-e829e14a795f',
'photo-1535320903710-d993d3d77d29'
],
'obligation':[
'photo-1554224155-6726b3ff858f','photo-1526304640581-d334cdbbf45e',
'photo-1579621970588-a35d0e7ab9b6'
],
'pib':[
'photo-1460925895917-afdab827c52f','photo-1526304640581-d334cdbbf45e',
'photo-1444653614773-995cb1ef9efa'
],
'emploi':[
'photo-1454165804606-c3d57bc86b40','photo-1521737711867-e3b97375f902',
'photo-1504607798333-52a30db54a5d'
],
'dette':[
'photo-1554224155-6726b3ff858f','photo-1579621970588-a35d0e7ab9b6',
'photo-1526304640581-d334cdbbf45e'
],
'dollar':[
'photo-1526304640581-d334cdbbf45e','photo-1554224155-6726b3ff858f',
'photo-1621504450181-5d356f61d307'
],
'euro':[
'photo-1519677100203-a0e668c92439','photo-1467269204594-9661b134dd2b',
'photo-1526304640581-d334cdbbf45e'
],
'ipo':[
'photo-1611974789855-9c2a0a7236a3','photo-1590283603385-17ffb3a7f29f',
'photo-1460925895917-afdab827c52f'
],

// ─── CRYPTO & BLOCKCHAIN ────────────────────────────────
'bitcoin':[
'photo-1518546305927-5a555bb7020d','photo-1622630998477-20aa696ecb05',
'photo-1609726494499-27d3e942456c','photo-1640340434855-6084b1f4901c'
],
'ethereum':[
'photo-1622630998477-20aa696ecb05','photo-1639762681057-408e52192e55',
'photo-1644143379190-4bb67b2f264f'
],
'defi':[
'photo-1639762681057-408e52192e55','photo-1644143379190-4bb67b2f264f',
'photo-1622630998477-20aa696ecb05'
],
'nft':[
'photo-1646463535018-f0a3d02d3151','photo-1644143379190-4bb67b2f264f',
'photo-1639762681057-408e52192e55'
],
'stablecoin':[
'photo-1621504450181-5d356f61d307','photo-1622630998477-20aa696ecb05',
'photo-1518546305927-5a555bb7020d'
],
'regulation crypto':[
'photo-1589829545856-d10d557cf95f','photo-1554224155-6726b3ff858f',
'photo-1622630998477-20aa696ecb05'
],
'mining':[
'photo-1516245834210-c4c142787335','photo-1640340434855-6084b1f4901c',
'photo-1518546305927-5a555bb7020d'
],
'altcoin':[
'photo-1622630998477-20aa696ecb05','photo-1639762681057-408e52192e55',
'photo-1640340434855-6084b1f4901c'
],

// ─── MATIÈRES PREMIÈRES ─────────────────────────────────
'or':[
'photo-1610375461246-83df859d849d','photo-1589656966895-2f33e7653819',
'photo-1624365168968-f283d506c6b1','photo-1603899122634-f086ca5f5ddd'
],
'argent metal':[
'photo-1589656966895-2f33e7653819','photo-1610375461246-83df859d849d',
'photo-1603899122634-f086ca5f5ddd'
],
'cuivre':[
'photo-1605557625850-af2e088a3646','photo-1558618666-fcd25c85f82e',
'photo-1610375461246-83df859d849d'
],
'gaz':[
'photo-1518709766631-a6a7f45921c3','photo-1582561971547-d3afa1e0d218',
'photo-1545250114-3744cc9f4e17'
],
'ble':[
'photo-1574323347407-f5e1ad6d020b','photo-1499529112087-3cb3b73b5820',
'photo-1471086569966-db3eebc25a59'
],
'lithium':[
'photo-1558618666-fcd25c85f82e','photo-1605557625850-af2e088a3646',
'photo-1611284446314-60a58ac0deb9'
],
'terres rares':[
'photo-1558618666-fcd25c85f82e','photo-1605557625850-af2e088a3646',
'photo-1610375461246-83df859d849d'
],
'agriculture':[
'photo-1574323347407-f5e1ad6d020b','photo-1499529112087-3cb3b73b5820',
'photo-1471086569966-db3eebc25a59'
],
'energie':[
'photo-1473341304170-971dccb5ac1e','photo-1509391366360-2e959784a276',
'photo-1466611653911-95081537e5b7'
],
'nucleaire':[
'photo-1473341304170-971dccb5ac1e','photo-1509391366360-2e959784a276',
'photo-1558618666-fcd25c85f82e'
],
'climat':[
'photo-1470071459604-3b5ec3a7fe05','photo-1466611653911-95081537e5b7',
'photo-1473341304170-971dccb5ac1e'
],
'opep':[
'photo-1518709766631-a6a7f45921c3','photo-1582561971547-d3afa1e0d218',
'photo-1545250114-3744cc9f4e17'
],

// ─── IA & TECH ──────────────────────────────────────────
'intelligence artificielle':[
'photo-1677442136019-21780ecad995','photo-1620712943543-bcc4688e7485',
'photo-1655720828018-edd2daec9349','photo-1684369175833-4b445ad6bfb5'
],
'cloud':[
'photo-1558494949-ef010cbdcc31','photo-1544197150-b99a580bb7a8',
'photo-1451187580459-43490279c0fa'
],
'souverainete numerique':[
'photo-1558494949-ef010cbdcc31','photo-1550751827-4bd374c3f58b',
'photo-1563986768494-4dee2763ff3f'
],
'cybersecurite':[
'photo-1550751827-4bd374c3f58b','photo-1563986768494-4dee2763ff3f',
'photo-1614064641938-3bbee52942c7'
],
'semiconductor':[
'photo-1518770660439-4636190af475','photo-1625314887424-9f190599bd56',
'photo-1597852074816-d933c7d2b988'
],
'puce':[
'photo-1518770660439-4636190af475','photo-1625314887424-9f190599bd56',
'photo-1597852074816-d933c7d2b988'
],
'nvidia':[
'photo-1518770660439-4636190af475','photo-1625314887424-9f190599bd56',
'photo-1597852074816-d933c7d2b988'
],
'apple':[
'photo-1611532736597-de2d4265fba3','photo-1491933382434-500287f9b54b',
'photo-1621768216002-5ac171876625'
],
'google':[
'photo-1573804633927-bfcbcd909acd','photo-1620712943543-bcc4688e7485',
'photo-1655720828018-edd2daec9349'
],
'microsoft':[
'photo-1633419461186-7d40a38105ec','photo-1620712943543-bcc4688e7485',
'photo-1655720828018-edd2daec9349'
],
'openai':[
'photo-1677442136019-21780ecad995','photo-1655720828018-edd2daec9349',
'photo-1684369175833-4b445ad6bfb5'
],
'robotique':[
'photo-1485827404703-89b55fcc595e','photo-1620712943543-bcc4688e7485',
'photo-1531746790095-6c46737faab8'
],
'spatial':[
'photo-1446776811953-b23d57bd21aa','photo-1451187580459-43490279c0fa',
'photo-1516849841032-87cbac4d88f7'
],
'regulation tech':[
'photo-1589829545856-d10d557cf95f','photo-1554224155-6726b3ff858f',
'photo-1563986768494-4dee2763ff3f'
],
'data':[
'photo-1558494949-ef010cbdcc31','photo-1544197150-b99a580bb7a8',
'photo-1451187580459-43490279c0fa'
],
'quantique':[
'photo-1635070041078-e363dbe005cb','photo-1518770660439-4636190af475',
'photo-1451187580459-43490279c0fa'
],

// ─── ETF & FONDS ────────────────────────────────────────
'etf':[
'photo-1611974789855-9c2a0a7236a3','photo-1590283603385-17ffb3a7f29f',
'photo-1460925895917-afdab827c52f'
],
'fonds':[
'photo-1454165804606-c3d57bc86b40','photo-1460925895917-afdab827c52f',
'photo-1590283603385-17ffb3a7f29f'
],
'private equity':[
'photo-1454165804606-c3d57bc86b40','photo-1486406146926-c627a92ad1ab',
'photo-1460925895917-afdab827c52f'
],

// ─── SANTÉ & PHARMA ─────────────────────────────────────
'sante':[
'photo-1576091160550-2173dba999ef','photo-1579684385127-1ef15d508118',
'photo-1559757175-5700dde675bc'
],
'pharma':[
'photo-1576091160550-2173dba999ef','photo-1579684385127-1ef15d508118',
'photo-1587854692152-cbe660dbde88'
],
'vaccin':[
'photo-1576091160550-2173dba999ef','photo-1587854692152-cbe660dbde88',
'photo-1579684385127-1ef15d508118'
]
};

// Catégories génériques (fallback final)
var CAT_FALLBACK={
geopolitique:'photo-1489392191049-fc10c97e64b6',
marches:'photo-1611974789855-9c2a0a7236a3',
crypto:'photo-1518546305927-5a555bb7020d',
matieres:'photo-1610375461246-83df859d849d',
matieres_premieres:'photo-1610375461246-83df859d849d',
iatech:'photo-1677442136019-21780ecad995',
ai_tech:'photo-1677442136019-21780ecad995'
};

/**
 * Trouve la meilleure image pour un article
 * @param {string} title - Titre de l'article
 * @param {string} category - Catégorie (geopolitique, marches, crypto, matieres, iatech)
 * @param {number} [w=400] - Largeur
 * @param {number} [h=240] - Hauteur
 * @returns {string} URL Unsplash complète
 */
function matchImage(title,category,w,h){
w=w||400; h=h||240;
var t=(title||'').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,''); // retire accents

var bestKey=null, bestScore=0;

for(var key in CATALOG){
  if(!CATALOG.hasOwnProperty(key)) continue;
  var k=key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  // Multi-word keys: all words must match
  var words=k.split(/\s+/);
  var allMatch=true;
  for(var i=0;i<words.length;i++){
    if(words[i].length<3) continue; // skip tiny words
    if(t.indexOf(words[i])===-1){allMatch=false;break}
  }
  if(allMatch && k.length>bestScore){
    bestScore=k.length;
    bestKey=key;
  }
}

var photoId;
if(bestKey){
  var arr=CATALOG[bestKey];
  // Pseudo-random basé sur la longueur du titre (déterministe)
  photoId=arr[title.length%arr.length];
}else{
  // Fallback catégorie
  var cat=(category||'').toLowerCase().replace(/[^a-z_]/g,'');
  photoId=CAT_FALLBACK[cat]||CAT_FALLBACK.geopolitique;
}

return 'https://images.unsplash.com/'+photoId+'?w='+w+'&h='+h+'&fit=crop&q=75';
}

// Export global
window.IMAGE_CATALOG=CATALOG;
window.CAT_FALLBACK=CAT_FALLBACK;
window.matchImage=matchImage;

})();
