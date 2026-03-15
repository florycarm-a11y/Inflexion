/* semplice-country.js — Radar Pays (country.html)
   Extrait du HTML inline — GeoJSON error handling + responsive canvases */

(function(){
'use strict';

/* ════════════════════════════════════════════
   SEMPLICE DATA
   ════════════════════════════════════════════ */
var DIMS=SEMPLICE_DIM_SHORT;
var DIM_LABELS=SEMPLICE_DIM_LABELS;
var OPP_LABELS=SEMPLICE_OPP_LABELS;
var ZONES=SEMPLICE_ZONES;

var GEOJSON={};

var currentMode='risk';
var leafletMap=null;
var geoLayers={};

/* ════════════════════════════════════════════
   COLOR HELPERS
   ════════════════════════════════════════════ */
function riskColor(s){
    if(s>=6)return '#991b1b';if(s>=5)return '#DC2626';if(s>=4)return '#ea580c';
    if(s>=3)return '#f59e0b';if(s>=2)return '#33B894';return '#006650';
}
function oppColor(s){
    if(s>=5)return '#006650';if(s>=4)return '#33B894';if(s>=3)return '#a7f3d0';return '#d1d5db';
}
function getColor(zone){return currentMode==='risk'?riskColor(zone.composite):(zone.oppComposite!=null?oppColor(zone.oppComposite):'#d1d5db');}
var ZONES_OPP=ZONES.filter(function(z){return z.opp!==null;});

/* ════════════════════════════════════════════
   LEAFLET MAP
   ════════════════════════════════════════════ */
function initLeafletMap(){
    leafletMap=L.map('leaflet-map',{
        center:[25,20],
        zoom:2,
        minZoom:2,
        maxZoom:14,
        scrollWheelZoom:true,
        zoomControl:true,
        attributionControl:true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains:'abcd',
        maxZoom:19
    }).addTo(leafletMap);

    ZONES.forEach(function(zone){
        var features=GEOJSON[zone.id];
        if(!features||!features.length)return;

        var group=L.featureGroup();
        features.forEach(function(geo){
            var layer=L.geoJSON(geo,{
                style:function(){
                    return {
                        fillColor:getColor(zone),
                        fillOpacity:0.45,
                        color:zone.color,
                        weight:2,
                        opacity:0.9
                    };
                },
                onEachFeature:function(feature,lyr){
                    lyr.bindTooltip(
                        '<div class="map-tooltip-custom">'+
                        '<strong style="color:'+zone.color+'">'+zone.name+'</strong>'+
                        '<span style="color:#DC2626;">Risque : '+zone.composite.toFixed(1)+'/7</span><br>'+
                        (zone.oppComposite!=null?'<span style="color:#006650;">Opportunité : '+zone.oppComposite.toFixed(1)+'/7</span><br><span style="color:#5A6178;font-size:.75rem;">Ratio O/R : '+(zone.oppComposite/zone.composite).toFixed(2)+'</span>':'<span style="color:#5A6178;font-size:.75rem;">Opp. : données indisponibles</span>')+
                        '</div>',
                        {sticky:true,direction:'top',offset:[0,-10],className:''}
                    );
                    lyr.on('mouseover',function(){
                        group.eachLayer(function(gl){gl.setStyle({fillOpacity:0.7,weight:3});});
                    });
                    lyr.on('mouseout',function(){
                        group.eachLayer(function(gl){gl.setStyle({fillOpacity:0.45,weight:2});});
                    });
                    lyr.on('click',function(){
                        leafletMap.flyTo(zone.center,zone.zoom,{duration:0.8});
                        highlightZoneCard(zone.id);
                        pulseScatterBubble(zone.id);
                    });
                }
            });
            group.addLayer(layer);
        });
        group.addTo(leafletMap);
        geoLayers[zone.id]=group;
    });
}

function updateMapColors(){
    ZONES.forEach(function(zone){
        var group=geoLayers[zone.id];
        if(!group)return;
        group.setStyle({
            fillColor:getColor(zone),
            color:zone.color,
            fillOpacity:0.45,
            weight:2
        });
        group.eachLayer(function(geoLayer){
            geoLayer.eachLayer(function(lyr){
                lyr.unbindTooltip();
                lyr.bindTooltip(
                    '<div class="map-tooltip-custom">'+
                    '<strong style="color:'+zone.color+'">'+zone.name+'</strong>'+
                    '<span style="color:#DC2626;">Risque : '+zone.composite.toFixed(1)+'/7</span><br>'+
                    (zone.oppComposite!=null?'<span style="color:#006650;">Opportunité : '+zone.oppComposite.toFixed(1)+'/7</span><br><span style="color:#5A6178;font-size:.75rem;">Ratio O/R : '+(zone.oppComposite/zone.composite).toFixed(2)+'</span>':'<span style="color:#5A6178;font-size:.75rem;">Opp. : données indisponibles</span>')+
                    '</div>',
                    {sticky:true,direction:'top',offset:[0,-10]}
                );
            });
        });
    });

    var legendLabel=document.getElementById('legend-label');
    var legendBar=document.getElementById('legend-bar');
    var legendMax=document.getElementById('legend-max');
    if(currentMode==='risk'){
        legendLabel.textContent='Risque :';
        legendBar.style.background='linear-gradient(to right,#006650,#33B894,#f59e0b,#ea580c,#DC2626)';
        legendMax.textContent='7';
    }else{
        legendLabel.textContent='Opportunité :';
        legendBar.style.background='linear-gradient(to right,#d1d5db,#a7f3d0,#33B894,#006650)';
        legendMax.textContent='7';
    }
}

function initToggle(){
    var riskBtn=document.getElementById('toggle-risk');
    var oppBtn=document.getElementById('toggle-opp');
    riskBtn.addEventListener('click',function(){
        currentMode='risk';riskBtn.classList.add('active');oppBtn.classList.remove('active');
        updateMapColors();
    });
    oppBtn.addEventListener('click',function(){
        currentMode='opp';oppBtn.classList.add('active');riskBtn.classList.remove('active');
        updateMapColors();
    });
}

function flyToZone(zoneId){
    var zone=ZONES.find(function(z){return z.id===zoneId;});
    if(zone&&leafletMap){
        leafletMap.flyTo(zone.center,zone.zoom,{duration:0.8});
        var layer=geoLayers[zoneId];
        if(layer){
            layer.setStyle({fillOpacity:0.8,weight:4});
            setTimeout(function(){layer.setStyle({fillOpacity:0.45,weight:2});},2000);
        }
    }
    if(typeof selectTimelineZone==='function'&&selectedTLZone!==zoneId)selectTimelineZone(zoneId);
}

/* ════════════════════════════════════════════
   ZONE CARDS
   ════════════════════════════════════════════ */
function renderZoneCards(){
    var grid=document.getElementById('zone-cards-grid');
    if(!grid)return;

    grid.innerHTML=ZONES.map(function(zone){
        var hasArticle=zone.href&&zone.href!=='#';
        var riskDom=DIM_LABELS[zone.scores.indexOf(Math.max.apply(null,zone.scores))];
        var oppDom=zone.opp?OPP_LABELS[zone.opp.indexOf(Math.max.apply(null,zone.opp))]:'—';
        var hasOpp=zone.oppComposite!=null;

        return '<div class="zone-card" id="card-'+zone.id+'" data-zone="'+zone.id+'">'+
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem;">'+
                '<div style="flex:1;min-width:0;">'+
                    '<h3 style="font-family:\'Libre Baskerville\',serif;font-size:1rem;font-weight:700;color:#1A1F2E;margin:0 0 6px;">'+
                        '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+zone.color+';margin-right:6px;vertical-align:middle;"></span>'+
                        zone.name+
                    '</h3>'+
                    '<div style="display:flex;gap:6px;flex-wrap:wrap;">'+
                        '<span class="score-badge score-risk">R '+zone.composite.toFixed(1)+'</span>'+
                        (hasOpp?'<span class="score-badge score-opp">O '+zone.oppComposite.toFixed(1)+'</span>':'')+
                        '<span style="font-size:.72rem;color:#5A6178;padding:3px 8px;background:#F7F8FA;border-radius:20px;">'+zone.level+'</span>'+
                    '</div>'+
                '</div>'+
                '<canvas class="mini-radar" id="radar-'+zone.id+'" width="150" height="150" style="width:120px;height:120px;flex-shrink:0;"></canvas>'+
            '</div>'+
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;margin-bottom:.75rem;">'+
                '<div style="color:#5A6178;">Risque dom. : <strong style="color:#1A1F2E;">'+riskDom+'</strong></div>'+
                '<div style="color:#5A6178;">Opp. dom. : <strong style="color:#1A1F2E;">'+oppDom+'</strong></div>'+
                (hasOpp?'<div style="color:#5A6178;">Ratio O/R : <strong style="color:#1A1F2E;font-family:\'JetBrains Mono\',monospace;">'+(zone.oppComposite/zone.composite).toFixed(2)+'</strong></div>'+
                '<div style="color:#5A6178;">Score global : <strong style="color:#1A1F2E;font-family:\'JetBrains Mono\',monospace;">'+(zone.composite+zone.oppComposite).toFixed(1)+'/14</strong></div>':'<div style="color:#9ca3af;font-style:italic;" colspan="2">Opp. : données à venir</div>')+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;align-items:center;">'+
                (hasArticle?'<a href="'+zone.href+'" style="font-size:.8rem;color:#006650;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">Lire l\'analyse <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></a>':'<span style="font-size:.78rem;color:#9ca3af;">Analyse à venir</span>')+
                '<button onclick="flyToZone(\''+zone.id+'\')" style="font-size:.72rem;color:#006650;background:#E8F5EE;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-weight:500;">Voir sur la carte</button>'+
            '</div>'+
        '</div>';
    }).join('');

    ZONES.forEach(function(zone){drawMiniRadar(zone);});
}

window.flyToZone=flyToZone;

function drawMiniRadar(zone){
    var canvas=document.getElementById('radar-'+zone.id);
    if(!canvas)return;
    var ctx=canvas.getContext('2d');
    var W=150,H=150,cx=W/2,cy=H/2,r=55,n=8;
    ctx.clearRect(0,0,W,H);

    for(var ring=1;ring<=7;ring++){
        ctx.beginPath();
        for(var i=0;i<=n;i++){
            var a=(Math.PI*2/n)*i-Math.PI/2;
            var px=cx+Math.cos(a)*(r*ring/7);
            var py=cy+Math.sin(a)*(r*ring/7);
            i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        }
        ctx.strokeStyle=ring===7?'#E2E5EB':'#F0F0F0';
        ctx.lineWidth=0.5;ctx.stroke();
    }
    for(var i=0;i<n;i++){
        var a=(Math.PI*2/n)*i-Math.PI/2;
        ctx.beginPath();ctx.moveTo(cx,cy);
        ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
        ctx.strokeStyle='#E2E5EB';ctx.lineWidth=0.5;ctx.stroke();
    }
    ctx.beginPath();
    for(var i=0;i<n;i++){
        var a=(Math.PI*2/n)*i-Math.PI/2;
        var v=zone.scores[i]/7*r;
        var px=cx+Math.cos(a)*v,py=cy+Math.sin(a)*v;
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fillStyle='rgba(220,38,38,0.15)';ctx.fill();
    ctx.strokeStyle='#DC2626';ctx.lineWidth=1.5;ctx.stroke();
    if(zone.opp){
        ctx.beginPath();
        for(var i=0;i<n;i++){
            var a=(Math.PI*2/n)*i-Math.PI/2;
            var v=zone.opp[i]/7*r;
            var px=cx+Math.cos(a)*v,py=cy+Math.sin(a)*v;
            i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        }
        ctx.closePath();ctx.fillStyle='rgba(0,102,80,0.15)';ctx.fill();
        ctx.strokeStyle='#006650';ctx.lineWidth=1.5;ctx.stroke();
    }
    ctx.font='bold 7px Inter,sans-serif';ctx.fillStyle='#5A6178';
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(var i=0;i<n;i++){
        var a=(Math.PI*2/n)*i-Math.PI/2;
        ctx.fillText(DIMS[i],cx+Math.cos(a)*(r+12),cy+Math.sin(a)*(r+12));
    }
}

/* ════════════════════════════════════════════
   SCATTER PLOT
   ════════════════════════════════════════════ */
var scatterBubbles=[];
var scatterMeta={};
var lastHoveredZone=null;

function getFilteredZones(requireOpp){
    var region=document.getElementById('filter-region').value;
    var riskMax=parseFloat(document.getElementById('filter-risk').value);
    var dim=document.getElementById('filter-dim').value;
    return ZONES.filter(function(z){
        if(requireOpp&&z.opp===null)return false;
        if(region!=='all'&&z.region!==region)return false;
        if(z.composite>riskMax)return false;
        if(dim!=='all'&&z.scores[parseInt(dim)]<=3)return false;
        return true;
    });
}

function bubbleRadius(gdp){
    var minR=12,maxR=34;
    var gdps=ZONES.map(function(z){return z.gdp;});
    var logMin=Math.log(Math.min.apply(null,gdps)),logMax=Math.log(Math.max.apply(null,gdps));
    var t=(Math.log(gdp)-logMin)/(logMax-logMin);
    return minR+t*(maxR-minR);
}

function initScatterPlot(){
    var canvas=document.getElementById('scatter-canvas');
    if(!canvas)return;
    var container=document.getElementById('scatter-container');
    var dpr=window.devicePixelRatio||1;
    var W=container.clientWidth-32;
    var H=Math.min(420,Math.max(300,W*0.55));
    canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    var ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);

    var pad={top:40,right:30,bottom:50,left:55};
    var pW=W-pad.left-pad.right,pH=H-pad.top-pad.bottom;

    function xPos(risk){return pad.left+(7-risk)/6*pW;}
    function yPos(opp){return pad.top+(7-opp)/6*pH;}

    scatterMeta={W:W,H:H,pad:pad,pW:pW,pH:pH,xPos:xPos,yPos:yPos,canvas:canvas,container:container};

    var midX=xPos(4),midY=yPos(4);

    ctx.fillStyle='rgba(0,102,80,0.06)';ctx.fillRect(midX,pad.top,pad.left+pW-midX+pad.right,midY-pad.top);
    ctx.fillStyle='rgba(245,158,11,0.06)';ctx.fillRect(pad.left,pad.top,midX-pad.left,midY-pad.top);
    ctx.fillStyle='rgba(90,97,120,0.04)';ctx.fillRect(midX,midY,pad.left+pW-midX+pad.right,pad.top+pH-midY);
    ctx.fillStyle='rgba(220,38,38,0.06)';ctx.fillRect(pad.left,midY,midX-pad.left,pad.top+pH-midY);

    ctx.font='italic 10px Inter,sans-serif';ctx.fillStyle='rgba(90,97,120,0.7)';ctx.textAlign='center';
    ctx.fillText('Zone idéale',(midX+pad.left+pW)/2,pad.top+16);
    ctx.fillText('Potentiel sous contrainte',(pad.left+midX)/2,pad.top+16);
    ctx.fillText('Stabilité sans rendement',(midX+pad.left+pW)/2,pad.top+pH-6);
    ctx.fillText('Zone à éviter',(pad.left+midX)/2,pad.top+pH-6);

    ctx.strokeStyle='#E2E5EB';ctx.lineWidth=0.5;
    for(var v=1;v<=7;v++){
        var x=xPos(v);ctx.beginPath();ctx.moveTo(x,pad.top);ctx.lineTo(x,pad.top+pH);ctx.stroke();
    }
    for(var v=1;v<=7;v++){
        var y=yPos(v);ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+pW,y);ctx.stroke();
    }

    ctx.font='600 11px Inter,sans-serif';ctx.fillStyle='#1A1F2E';ctx.textAlign='center';
    ctx.fillText('\u2190 Risque \u00e9lev\u00e9          Risque faible \u2192',pad.left+pW/2,H-8);
    ctx.save();ctx.translate(14,pad.top+pH/2);ctx.rotate(-Math.PI/2);
    ctx.fillText('Opportunit\u00e9 \u2192',0,0);ctx.restore();

    ctx.font='500 9px JetBrains Mono,monospace';ctx.fillStyle='#5A6178';
    for(var v=1;v<=7;v++){
        ctx.textAlign='center';ctx.fillText(v.toString(),xPos(v),pad.top+pH+16);
    }
    for(var v=1;v<=7;v++){
        ctx.textAlign='right';ctx.fillText(v.toString(),pad.left-8,yPos(v)+4);
    }

    scatterBubbles=[];
    var filtered=getFilteredZones(true);
    filtered.forEach(function(zone){
        var bx=xPos(zone.composite),by=yPos(zone.oppComposite);
        var br=bubbleRadius(zone.gdp);
        ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);
        ctx.fillStyle=zone.color+'25';ctx.fill();
        ctx.strokeStyle=zone.color;ctx.lineWidth=2.5;ctx.stroke();
        ctx.beginPath();ctx.arc(bx,by,3.5,0,Math.PI*2);
        ctx.fillStyle=zone.color;ctx.fill();
        ctx.font='bold 7.5px Inter,sans-serif';ctx.fillStyle=zone.color;
        ctx.textAlign='center';ctx.textBaseline='bottom';
        var short=zone.name.length>12?zone.name.substring(0,10)+'…':zone.name;
        ctx.fillText(short,bx,by-br-3);
        scatterBubbles.push({zone:zone,x:bx,y:by,r:br});
    });

    var tip=container.querySelector('.scatter-tip');
    if(!tip){
        tip=document.createElement('div');
        tip.className='scatter-tip';tip.style.cssText='position:absolute;pointer-events:none;opacity:0;transition:opacity .15s;z-index:50;min-width:180px;background:#fff;border:1px solid #E2E5EB;border-radius:10px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.1);font-family:Inter,sans-serif;font-size:.8rem;';
        container.appendChild(tip);
    }

    canvas.onmousemove=function(e){
        var rect=canvas.getBoundingClientRect();
        var mx=(e.clientX-rect.left)*(W/rect.width),my=(e.clientY-rect.top)*(H/rect.height);
        var found=null;
        scatterBubbles.forEach(function(b){var d=Math.sqrt((mx-b.x)*(mx-b.x)+(my-b.y)*(my-b.y));if(d<b.r*1.3)found=b;});
        if(found){
            canvas.style.cursor='pointer';
            var gdpLabel=found.zone.gdp>=1000?(found.zone.gdp/1000).toFixed(1)+' T$':found.zone.gdp+' Mrd$';
            tip.innerHTML='<strong style="color:'+found.zone.color+';font-size:.9rem;">'+found.zone.name+'</strong>'+
                '<div style="margin-top:4px;color:#DC2626;">Risque : '+found.zone.composite.toFixed(1)+'/7</div>'+
                '<div style="color:#006650;">Opp. : '+found.zone.oppComposite.toFixed(1)+'/7</div>'+
                '<div style="color:#5A6178;margin-top:2px;">Ratio O/R : '+(found.zone.oppComposite/found.zone.composite).toFixed(2)+'</div>'+
                '<div style="color:#5A6178;font-size:.72rem;margin-top:2px;">PIB ~ '+gdpLabel+'</div>';
            tip.style.opacity='1';
            var cx2=e.clientX-container.getBoundingClientRect().left+15;
            var cy2=e.clientY-container.getBoundingClientRect().top-10;
            if(cx2+200>container.clientWidth)cx2-=220;
            tip.style.left=cx2+'px';tip.style.top=cy2+'px';
            if(lastHoveredZone!==found.zone.id){
                if(lastHoveredZone)unhighlightMapZone(lastHoveredZone);
                highlightMapZone(found.zone.id);
                lastHoveredZone=found.zone.id;
            }
        }else{
            canvas.style.cursor='default';tip.style.opacity='0';
            if(lastHoveredZone){unhighlightMapZone(lastHoveredZone);lastHoveredZone=null;}
        }
    };
    canvas.onclick=function(e){
        var rect=canvas.getBoundingClientRect();
        var mx=(e.clientX-rect.left)*(W/rect.width),my=(e.clientY-rect.top)*(H/rect.height);
        scatterBubbles.forEach(function(b){
            if(Math.sqrt((mx-b.x)*(mx-b.x)+(my-b.y)*(my-b.y))<b.r*1.3){
                highlightZoneCard(b.zone.id);
                flyToZone(b.zone.id);
            }
        });
    };
    canvas.onmouseleave=function(){
        tip.style.opacity='0';
        if(lastHoveredZone){unhighlightMapZone(lastHoveredZone);lastHoveredZone=null;}
    };
}

function highlightMapZone(zoneId){
    var group=geoLayers[zoneId];
    if(group)group.setStyle({fillOpacity:0.75,weight:4});
}
function unhighlightMapZone(zoneId){
    var group=geoLayers[zoneId];
    if(group)group.setStyle({fillOpacity:0.45,weight:2});
}

function pulseScatterBubble(zoneId){
    var b=scatterBubbles.find(function(bb){return bb.zone.id===zoneId;});
    if(!b||!scatterMeta.container)return;
    var container=scatterMeta.container;
    var canvas=scatterMeta.canvas;
    var rect=canvas.getBoundingClientRect();
    var scaleX=rect.width/scatterMeta.W,scaleY=rect.height/scatterMeta.H;
    var dot=document.createElement('div');
    dot.className='scatter-pulse-dot';
    var sz=b.r*2*scaleX;
    dot.style.cssText='width:'+sz+'px;height:'+sz+'px;left:'+(b.x*scaleX+canvas.offsetLeft-sz/2)+'px;top:'+(b.y*scaleY+canvas.offsetTop-sz/2)+'px;border:3px solid '+b.zone.color+';';
    container.appendChild(dot);
    setTimeout(function(){if(dot.parentNode)dot.parentNode.removeChild(dot);},2000);
    container.scrollIntoView({behavior:'smooth',block:'center'});
}

function initScatterFilters(){
    var regionSel=document.getElementById('filter-region');
    var riskRange=document.getElementById('filter-risk');
    var riskVal=document.getElementById('filter-risk-val');
    var dimSel=document.getElementById('filter-dim');
    function refresh(){initScatterPlot();}
    regionSel.addEventListener('change',refresh);
    dimSel.addEventListener('change',refresh);
    riskRange.addEventListener('input',function(){riskVal.textContent=parseFloat(riskRange.value).toFixed(1);refresh();});
}

/* ════════════════════════════════════════════
   SCORE HISTORY TIMELINE
   ════════════════════════════════════════════ */
var HISTORY={};
var selectedTLZone='cuba';
var tlMode='composite';
var DIM_COLORS=['#3b82f6','#f59e0b','#DC2626','#8b5cf6','#6b7280','#06b6d4','#4f46e5','#16a34a'];

async function loadHistory(){
    try{
        var resp=await fetch('data/semplice-history.json');
        if(!resp.ok)throw new Error('HTTP '+resp.status);
        var data=await resp.json();
        HISTORY=data.zones||{};
    }catch(e){console.warn('History load failed:',e);}
}

function renderTimelinePills(){
    var container=document.getElementById('timeline-zone-pills');
    if(!container)return;
    container.innerHTML=ZONES.map(function(z){
        var active=z.id===selectedTLZone;
        return '<button class="tl-pill'+(active?' active':'')+'" data-zone="'+z.id+'" style="'+(active?'background:'+z.color+';':'')+'">'+z.name+'</button>';
    }).join('');
    container.querySelectorAll('.tl-pill').forEach(function(btn){
        btn.addEventListener('click',function(){
            selectTimelineZone(btn.dataset.zone);
        });
    });
}

function selectTimelineZone(zoneId){
    selectedTLZone=zoneId;
    renderTimelinePills();
    drawTimeline();
    renderTimelineEvents(zoneId);
}

function drawTimeline(){
    var canvas=document.getElementById('timeline-canvas');
    if(!canvas)return;
    var container=document.getElementById('timeline-container');
    var hist=HISTORY[selectedTLZone];
    var zone=ZONES.find(function(z){return z.id===selectedTLZone;});
    if(!hist||!zone){
        var ctx0=canvas.getContext('2d');
        canvas.width=container.clientWidth-32;canvas.height=200;
        ctx0.clearRect(0,0,canvas.width,canvas.height);
        ctx0.font='13px Inter,sans-serif';ctx0.fillStyle='#9ca3af';ctx0.textAlign='center';
        ctx0.fillText('Historique non disponible pour cette zone',canvas.width/2,100);
        return;
    }

    var dpr=window.devicePixelRatio||1;
    var W=container.clientWidth-32;
    var H=Math.min(380,Math.max(260,W*0.45));
    canvas.width=W*dpr;canvas.height=H*dpr;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    var ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);

    var pad={top:30,right:25,bottom:55,left:50};
    var pW=W-pad.left-pad.right,pH=H-pad.top-pad.bottom;

    var snaps=hist.snapshots;
    var events=hist.events||[];

    var allDates=snaps.map(function(s){return new Date(s.date).getTime();});
    var tMin=Math.min.apply(null,allDates),tMax=Math.max.apply(null,allDates);
    if(tMin===tMax)tMax=tMin+86400000*30;

    function xTime(t){return pad.left+(t-tMin)/(tMax-tMin)*pW;}
    function yScore(s){return pad.top+(7-s)/6*pH;}

    ctx.fillStyle='rgba(220,38,38,0.04)';ctx.fillRect(pad.left,yScore(7),pW,yScore(5)-yScore(7));
    ctx.fillStyle='rgba(245,158,11,0.03)';ctx.fillRect(pad.left,yScore(5),pW,yScore(3)-yScore(5));
    ctx.fillStyle='rgba(0,102,80,0.03)';ctx.fillRect(pad.left,yScore(3),pW,yScore(1)-yScore(3));

    ctx.strokeStyle='#E2E5EB';ctx.lineWidth=0.5;
    for(var v=1;v<=7;v++){
        var gy=yScore(v);ctx.beginPath();ctx.moveTo(pad.left,gy);ctx.lineTo(pad.left+pW,gy);ctx.stroke();
    }

    ctx.font='500 9px JetBrains Mono,monospace';ctx.fillStyle='#5A6178';ctx.textAlign='right';
    for(var v=1;v<=7;v++){ctx.fillText(v.toString(),pad.left-8,yScore(v)+4);}
    ctx.save();ctx.translate(12,pad.top+pH/2);ctx.rotate(-Math.PI/2);
    ctx.font='600 10px Inter,sans-serif';ctx.fillStyle='#1A1F2E';ctx.textAlign='center';
    ctx.fillText('Score',0,0);ctx.restore();

    ctx.textAlign='center';ctx.font='500 8px JetBrains Mono,monospace';ctx.fillStyle='#5A6178';
    var MONTHS=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    snaps.forEach(function(s){
        var d=new Date(s.date);
        var x=xTime(d.getTime());
        ctx.fillText(MONTHS[d.getMonth()]+' '+d.getFullYear(),x,H-8);
        ctx.beginPath();ctx.moveTo(x,pad.top+pH);ctx.lineTo(x,pad.top+pH+4);ctx.strokeStyle='#E2E5EB';ctx.stroke();
    });

    events.forEach(function(ev){
        var evT=new Date(ev.date).getTime();
        if(evT<tMin||evT>tMax)return;
        var x=xTime(evT);
        ctx.save();ctx.setLineDash([3,3]);
        ctx.strokeStyle=ev.type==='escalation'?'rgba(220,38,38,0.3)':ev.type==='deescalation'?'rgba(0,102,80,0.3)':'rgba(200,149,90,0.3)';
        ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,pad.top);ctx.lineTo(x,pad.top+pH);ctx.stroke();ctx.restore();
        ctx.fillStyle=ev.type==='escalation'?'#DC2626':ev.type==='deescalation'?'#006650':'#C8955A';
        ctx.beginPath();ctx.moveTo(x,pad.top-8);ctx.lineTo(x+5,pad.top-3);ctx.lineTo(x,pad.top+2);ctx.lineTo(x-5,pad.top-3);ctx.closePath();ctx.fill();
    });

    if(tlMode==='composite'){
        drawLine(ctx,snaps.map(function(s){return {x:xTime(new Date(s.date).getTime()),y:yScore(s.composite)};}),
            '#DC2626',2,'rgba(220,38,38,0.08)',pad.top+pH);
        drawLine(ctx,snaps.map(function(s){return {x:xTime(new Date(s.date).getTime()),y:yScore(s.oppComposite)};}),
            '#006650',2,'rgba(0,102,80,0.06)',pad.top+pH);
        ctx.font='600 9px Inter,sans-serif';
        var lx=pad.left+10,ly=pad.top+14;
        ctx.fillStyle='#DC2626';ctx.fillRect(lx,ly-4,14,2);ctx.fillText('Risque',lx+18,ly);
        ctx.fillStyle='#006650';ctx.fillRect(lx+70,ly-4,14,2);ctx.fillText('Opportunité',lx+88,ly);
    }else{
        for(var di=0;di<8;di++){
            var pts=snaps.map(function(s){return {x:xTime(new Date(s.date).getTime()),y:yScore(s.scores[di])};});
            drawLine(ctx,pts,DIM_COLORS[di],1.5,null,0);
        }
        ctx.font='bold 7px Inter,sans-serif';
        for(var di=0;di<8;di++){
            var lx2=pad.left+10+(di%4)*((pW-20)/4);
            var ly2=pad.top+pH+22+(di<4?0:12);
            ctx.fillStyle=DIM_COLORS[di];
            ctx.fillRect(lx2,ly2-3,10,2);
            ctx.textAlign='left';ctx.fillText(DIMS[di]+' — '+DIM_LABELS[di],lx2+14,ly2);
        }
    }

    if(tlMode==='composite'){
        snaps.forEach(function(s){
            var x=xTime(new Date(s.date).getTime());
            ctx.beginPath();ctx.arc(x,yScore(s.composite),4,0,Math.PI*2);
            ctx.fillStyle='#DC2626';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
            ctx.beginPath();ctx.arc(x,yScore(s.oppComposite),4,0,Math.PI*2);
            ctx.fillStyle='#006650';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();
        });
    }

    var tip=container.querySelector('.tl-tip');
    if(!tip){
        tip=document.createElement('div');
        tip.className='tl-tip';tip.style.cssText='position:absolute;pointer-events:none;opacity:0;transition:opacity .15s;z-index:50;min-width:160px;background:#fff;border:1px solid #E2E5EB;border-radius:10px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.1);font-family:Inter,sans-serif;font-size:.78rem;';
        container.appendChild(tip);
    }
    canvas.onmousemove=function(e){
        var rect=canvas.getBoundingClientRect();
        var mx=(e.clientX-rect.left)*(W/rect.width);
        var closest=null,minD=Infinity;
        snaps.forEach(function(s){
            var sx=xTime(new Date(s.date).getTime());
            var d=Math.abs(mx-sx);
            if(d<minD&&d<30){minD=d;closest=s;}
        });
        if(closest){
            var d=new Date(closest.date);
            var dateStr=d.toLocaleDateString('fr-FR',{year:'numeric',month:'short'});
            tip.innerHTML='<strong style="color:'+zone.color+';">'+zone.name+'</strong> — <span style="color:#5A6178;">'+dateStr+'</span>'+
                '<div style="margin-top:4px;color:#DC2626;">Risque : '+closest.composite.toFixed(1)+'/7</div>'+
                '<div style="color:#006650;">Opp. : '+closest.oppComposite.toFixed(1)+'/7</div>'+
                '<div style="color:#5A6178;font-size:.72rem;margin-top:2px;">'+DIMS.map(function(d2,i){return d2+':'+closest.scores[i];}).join(' ')+'</div>';
            tip.style.opacity='1';
            var cx2=e.clientX-container.getBoundingClientRect().left+15;
            var cy2=e.clientY-container.getBoundingClientRect().top-10;
            if(cx2+180>container.clientWidth)cx2-=200;
            tip.style.left=cx2+'px';tip.style.top=cy2+'px';
        }else{tip.style.opacity='0';}
    };
    canvas.onmouseleave=function(){tip.style.opacity='0';};
}

function drawLine(ctx,pts,color,width,fillColor,bottomY){
    if(pts.length<2)return;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
    if(fillColor&&bottomY){
        ctx.lineTo(pts[pts.length-1].x,bottomY);ctx.lineTo(pts[0].x,bottomY);ctx.closePath();
        ctx.fillStyle=fillColor;ctx.fill();
    }
}

function renderTimelineEvents(zoneId){
    var panel=document.getElementById('timeline-events');
    if(!panel)return;
    var hist=HISTORY[zoneId];
    if(!hist||!hist.events||!hist.events.length){panel.innerHTML='';return;}

    panel.innerHTML='<h3 style="font-family:\'Libre Baskerville\',serif;font-size:1rem;font-weight:700;color:#1A1F2E;margin-bottom:.75rem;">&Eacute;v&eacute;nements cl&eacute;s</h3>'+
        hist.events.map(function(ev){
            var d=new Date(ev.date);
            var dateStr=d.toLocaleDateString('fr-FR',{year:'numeric',month:'short'});
            var dimLabel=typeof ev.dim==='number'?DIMS[ev.dim]:'';
            var deltaClass=ev.delta.startsWith('+')?'up':ev.delta.startsWith('-')?'down':'flat';
            return '<div class="tl-event-item '+ev.type+'">'+
                '<span class="tl-event-date">'+dateStr+'</span>'+
                '<span class="tl-event-label">'+ev.label+'</span>'+
                '<span class="tl-event-delta '+deltaClass+'">'+dimLabel+' '+ev.delta+'</span>'+
            '</div>';
        }).join('');
}

function initTimelineToggles(){
    var compBtn=document.getElementById('tl-mode-composite');
    var dimsBtn=document.getElementById('tl-mode-dims');
    compBtn.addEventListener('click',function(){
        tlMode='composite';compBtn.classList.add('active');dimsBtn.classList.remove('active');drawTimeline();
    });
    dimsBtn.addEventListener('click',function(){
        tlMode='dims';dimsBtn.classList.add('active');compBtn.classList.remove('active');drawTimeline();
    });
}

/* ════════════════════════════════════════════
   SORTABLE TABLE
   ════════════════════════════════════════════ */
var sortCol='risk',sortAsc=false;

function renderTable(){
    var tbody=document.getElementById('zone-table-body');
    if(!tbody)return;
    var sorted=ZONES.slice().sort(function(a,b){
        var va,vb;
        switch(sortCol){
            case 'name':va=a.name;vb=b.name;return sortAsc?va.localeCompare(vb):vb.localeCompare(va);
            case 'risk':va=a.composite;vb=b.composite;break;
            case 'opp':va=(a.oppComposite||0);vb=(b.oppComposite||0);break;
            case 'ratio':va=a.oppComposite?a.oppComposite/a.composite:0;vb=b.oppComposite?b.oppComposite/b.composite:0;break;
            default:va=a.composite;vb=b.composite;
        }
        return sortAsc?va-vb:vb-va;
    });

    tbody.innerHTML=sorted.map(function(zone){
        var hasOpp=zone.oppComposite!=null;
        var ratio=hasOpp?(zone.oppComposite/zone.composite).toFixed(2):'—';
        var riskDom=DIM_LABELS[zone.scores.indexOf(Math.max.apply(null,zone.scores))];
        var oppDom=zone.opp?OPP_LABELS[zone.opp.indexOf(Math.max.apply(null,zone.opp))]:'—';
        var hasArticle=zone.href&&zone.href!=='#';
        return '<tr style="border-bottom:1px solid #E2E5EB;cursor:pointer;" data-zone="'+zone.id+'" onmouseenter="this.style.background=\'#F0FAF5\'" onmouseleave="this.style.background=\'\'">'+
            '<td style="padding:.65rem .75rem;font-weight:600;color:#1A1F2E;white-space:nowrap;">'+
                '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+zone.color+';margin-right:6px;vertical-align:middle;"></span>'+zone.name+'</td>'+
            '<td style="padding:.65rem .75rem;text-align:center;"><span class="score-badge score-risk">'+zone.composite.toFixed(1)+'</span></td>'+
            '<td style="padding:.65rem .75rem;text-align:center;">'+(hasOpp?'<span class="score-badge score-opp">'+zone.oppComposite.toFixed(1)+'</span>':'<span style="color:#9ca3af;font-size:.78rem;">—</span>')+'</td>'+
            '<td style="padding:.65rem .75rem;text-align:center;font-family:\'JetBrains Mono\',monospace;font-weight:600;color:'+(hasOpp&&parseFloat(ratio)>=1?'#006650':hasOpp?'#DC2626':'#9ca3af')+';">'+ratio+'</td>'+
            '<td style="padding:.65rem .75rem;text-align:center;color:#5A6178;font-size:.78rem;">'+riskDom+'</td>'+
            '<td style="padding:.65rem .75rem;text-align:center;color:#5A6178;font-size:.78rem;">'+oppDom+'</td>'+
            '<td style="padding:.65rem .75rem;text-align:center;">'+(hasArticle?'<a href="'+zone.href+'" style="color:#006650;font-weight:600;font-size:.78rem;text-decoration:none;">Lire →</a>':'<span style="color:#9ca3af;font-size:.78rem;">—</span>')+'</td>'+
        '</tr>';
    }).join('');

    tbody.querySelectorAll('tr').forEach(function(row){
        row.addEventListener('click',function(e){
            if(e.target.tagName==='A')return;
            var zid=row.dataset.zone;
            highlightZoneCard(zid);
            flyToZone(zid);
        });
    });
}

function initTableSort(){
    document.querySelectorAll('.sort-header').forEach(function(th){
        th.addEventListener('click',function(){
            var col=th.dataset.col;
            if(sortCol===col)sortAsc=!sortAsc;else{sortCol=col;sortAsc=false;}
            document.querySelectorAll('.sort-header').forEach(function(h){h.classList.remove('asc','desc');});
            th.classList.add(sortAsc?'asc':'desc');
            renderTable();
        });
    });
}

/* ════════════════════════════════════════════
   INTERACTION SYNC
   ════════════════════════════════════════════ */
function highlightZoneCard(zoneId){
    document.querySelectorAll('.zone-card').forEach(function(c){c.classList.remove('highlighted');});
    var card=document.getElementById('card-'+zoneId);
    if(card){
        card.classList.add('highlighted');
        card.scrollIntoView({behavior:'smooth',block:'center'});
    }
}

/* ════════════════════════════════════════════
   WORLD BANK DATA
   ════════════════════════════════════════════ */
var COUNTRIES={
    USA:{flag:'\u{1F1FA}\u{1F1F8}',name:'États-Unis',currency:'USD',region:'Amérique du Nord'},
    CHN:{flag:'\u{1F1E8}\u{1F1F3}',name:'Chine',currency:'CNY',region:'Asie'},
    JPN:{flag:'\u{1F1EF}\u{1F1F5}',name:'Japon',currency:'JPY',region:'Asie'},
    DEU:{flag:'\u{1F1E9}\u{1F1EA}',name:'Allemagne',currency:'EUR',region:'Europe'},
    GBR:{flag:'\u{1F1EC}\u{1F1E7}',name:'Royaume-Uni',currency:'GBP',region:'Europe'},
    FRA:{flag:'\u{1F1EB}\u{1F1F7}',name:'France',currency:'EUR',region:'Europe'},
    IND:{flag:'\u{1F1EE}\u{1F1F3}',name:'Inde',currency:'INR',region:'Asie'},
    BRA:{flag:'\u{1F1E7}\u{1F1F7}',name:'Brésil',currency:'BRL',region:'Amérique du Sud'},
    CAN:{flag:'\u{1F1E8}\u{1F1E6}',name:'Canada',currency:'CAD',region:'Amérique du Nord'},
    KOR:{flag:'\u{1F1F0}\u{1F1F7}',name:'Corée du Sud',currency:'KRW',region:'Asie'}
};
var INDICATOR_LABELS={
    'NY.GDP.MKTP.CD':{label:'PIB nominal',unit:'USD',format:'usd'},
    'FP.CPI.TOTL.ZG':{label:'Inflation (CPI)',unit:'% annuel',format:'pct'},
    'SL.UEM.TOTL.ZS':{label:'Chômage',unit:'% pop. active',format:'pct'},
    'GC.DOD.TOTL.GD.ZS':{label:'Dette / PIB',unit:'%',format:'pct'}
};
function formatLargeUSD(v){
    if(v>=1e12)return(v/1e12).toFixed(1)+' T$';if(v>=1e9)return(v/1e9).toFixed(0)+' Mrd$';
    if(v>=1e6)return(v/1e6).toFixed(0)+' M$';return v.toLocaleString('fr-FR')+' $';
}
function renderCountryGrid(){
    var grid=document.querySelector('.country-grid');if(!grid)return;
    var wb=DataLoader.getWorldBank();var codes=Object.keys(COUNTRIES);
    grid.innerHTML=codes.map(function(code){
        var m=COUNTRIES[code];var gdp='';
        if(wb&&wb.indicators){var g=wb.indicators.find(function(i){return i.id==='NY.GDP.MKTP.CD';});
        if(g&&g.data){var d=g.data.find(function(d){return d.country_code===code;});if(d)gdp=formatLargeUSD(d.value);}}
        return '<button class="country-card" role="listitem" data-code="'+code+'" aria-label="'+m.name+'">'+
            '<span class="country-card-flag">'+m.flag+'</span><span class="country-card-name">'+m.name+'</span>'+
            '<span class="country-card-region">'+m.region+'</span>'+(gdp?'<span class="country-card-gdp">PIB '+gdp+'</span>':'')+'</button>';
    }).join('');
    grid.addEventListener('click',function(e){var c=e.target.closest('.country-card');if(c)selectCountry(c.dataset.code);});
    var back=document.getElementById('country-back');
    if(back)back.addEventListener('click',function(){deselectCountry();});
}
function selectCountry(code){
    var m=COUNTRIES[code];if(!m)return;
    var sel=document.getElementById('country-selector'),det=document.getElementById('country-detail');
    var hdr=document.getElementById('country-detail-header'),ind=document.getElementById('country-indicators');
    if(sel)sel.hidden=true;if(det)det.hidden=false;
    if(hdr)hdr.innerHTML='<div class="country-detail-title"><span class="country-detail-flag">'+m.flag+'</span><div><h2>'+m.name+'</h2><span class="country-detail-meta">'+m.region+' &middot; '+m.currency+'</span></div></div>';
    if(ind)renderCountryIndicators(code,ind);
    det.scrollIntoView({behavior:'smooth',block:'start'});
}
function deselectCountry(){
    var sel=document.getElementById('country-selector'),det=document.getElementById('country-detail');
    if(sel)sel.hidden=false;if(det)det.hidden=true;
}
function renderCountryIndicators(code,container){
    var wb=DataLoader.getWorldBank();
    if(!wb||!wb.indicators){container.innerHTML='<p class="loading-fallback-text">Données indisponibles.</p>';return;}
    var cards=[];
    wb.indicators.forEach(function(ind){
        var meta=INDICATOR_LABELS[ind.id];if(!meta||!ind.data)return;
        var match=ind.data.find(function(d){return d.country_code===code;});if(!match)return;
        var val=meta.format==='usd'?formatLargeUSD(match.value):match.value.toFixed(1)+'%';
        cards.push('<div class="country-ind-card"><div class="country-ind-content"><span class="country-ind-label">'+meta.label+'</span><span class="country-ind-value">'+val+'</span><span class="country-ind-unit">'+meta.unit+' ('+(match.year||'2024')+')</span></div></div>');
    });
    var html='<div class="country-comparison"><h3 class="country-comparison-title">Comparaison internationale</h3><div class="country-comparison-table-wrapper"><table class="country-comparison-table"><thead><tr><th>Pays</th>';
    wb.indicators.forEach(function(i){var m=INDICATOR_LABELS[i.id];if(m)html+='<th>'+m.label+'</th>';});
    html+='</tr></thead><tbody>';
    Object.keys(COUNTRIES).forEach(function(cc){
        var m=COUNTRIES[cc];html+='<tr class="'+(cc===code?'country-row-selected':'')+'"><td class="country-comp-name">'+m.flag+' '+m.name+'</td>';
        wb.indicators.forEach(function(i){var im=INDICATOR_LABELS[i.id];if(!im)return;
            var match=i.data?i.data.find(function(d){return d.country_code===cc;}):null;
            html+='<td class="country-comp-val">'+(match?(im.format==='usd'?formatLargeUSD(match.value):match.value.toFixed(1)+'%'):'—')+'</td>';
        });html+='</tr>';
    });
    html+='</tbody></table></div></div>';
    container.innerHTML='<div class="country-ind-cards">'+cards.join('')+'</div>'+html;
}

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',async function(){
    // Load GeoJSON with error handling — show user-visible fallback on failure
    var geoLoadOk=false;
    try{
        var resp=await fetch('data/semplice-zones.geojson');
        if(!resp.ok)throw new Error('HTTP '+resp.status);
        var collection=await resp.json();
        collection.features.forEach(function(f){
            var zoneId=f.properties.zone;
            if(f.geometry.type==='MultiPolygon'){
                GEOJSON[zoneId]=f.geometry.coordinates.map(function(coords){
                    return {type:'Feature',properties:f.properties,geometry:{type:'Polygon',coordinates:coords}};
                });
            }else{
                GEOJSON[zoneId]=[{type:'Feature',properties:f.properties,geometry:f.geometry}];
            }
        });
        geoLoadOk=true;
    }catch(e){
        console.warn('GeoJSON load failed, map zones will not display:',e);
        var mapEl=document.getElementById('leaflet-map');
        if(mapEl){
            var errDiv=document.createElement('div');
            errDiv.style.cssText='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;background:#fff;border:1px solid #E2E5EB;border-radius:10px;padding:1.25rem 1.5rem;text-align:center;max-width:320px;box-shadow:0 4px 16px rgba(0,0,0,.08);';
            errDiv.innerHTML='<p style="margin:0 0 .5rem;font-weight:600;color:#1A1F2E;">Carte indisponible</p><p style="margin:0;font-size:.85rem;color:#5A6178;">Le chargement des frontières a échoué. Vérifiez votre connexion et rechargez la page.</p>';
            mapEl.style.position='relative';
            mapEl.appendChild(errDiv);
        }
    }

    initToggle();
    initLeafletMap();
    // Recalculate Leaflet size after nav-shared.js modifies DOM
    if(leafletMap){
        leafletMap.once('load',function(){leafletMap.invalidateSize();});
        setTimeout(function(){leafletMap.invalidateSize();},500);
    }
    renderZoneCards();
    initScatterFilters();
    initScatterPlot();
    await loadHistory();
    initTimelineToggles();
    renderTimelinePills();
    drawTimeline();
    renderTimelineEvents(selectedTLZone);
    renderTable();
    initTableSort();

    try{
        var ok=await DataLoader.init();
        if(ok)renderCountryGrid();
        else document.querySelector('.country-grid').innerHTML='<p class="loading-fallback-text">Données macro indisponibles actuellement.</p>';
    }catch(e){
        document.querySelector('.country-grid').innerHTML='<p class="loading-fallback-text">Données macro indisponibles actuellement.</p>';
    }
});

// Responsive resize — debounced, includes Leaflet
var resizeTimer;
window.addEventListener('resize',function(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(function(){
        initScatterPlot();
        drawTimeline();
        if(leafletMap)leafletMap.invalidateSize();
    },250);
});

})();
