/* semplice-radar.js — Radar interactif SEMPLICE (expertise.html)
   Extrait du HTML inline — Canvas responsive + resize handler */

(function(){
    var DIMS=SEMPLICE_DIM_LABELS;
    var OPP_DIMS=SEMPLICE_OPP_LABELS;
    var DIM_SHORT=SEMPLICE_DIM_SHORT;
    var ZONES=SEMPLICE_ZONES;
    var active=ZONES.map(function(z){return z.id==='ukraine'||z.id==='tamil'||z.id==='arctique';});
    var viewMode='risk';
    var canvas=document.getElementById('semplice-radar');
    var ctx=canvas.getContext('2d');
    var tooltip=document.getElementById('radar-tooltip');
    var hoverDim=-1;

    // Responsive dimensions — recalculated on resize
    var W,H,cx,cy,R,dpr;

    function sizeCanvas(){
        var container=canvas.parentElement;
        var maxW=Math.min(container.clientWidth-48,500);
        dpr=window.devicePixelRatio||1;
        W=H=Math.max(280,maxW);
        canvas.width=W*dpr;
        canvas.height=H*dpr;
        canvas.style.width=W+'px';
        canvas.style.height=H+'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
        cx=W/2;cy=H/2;
        R=Math.min(W,H)/2-30;
    }

    function riskLevelColor(c){return c>=5.5?'#DC2626':c>=4?'#f59e0b':c>=2.5?'#C8955A':'#006650';}
    function oppLevelColor(c){return c>=5?'#006650':c>=3.5?'#33B894':c>=2?'#C8955A':'#DC2626';}
    function currentDims(){return viewMode==='opp'?OPP_DIMS:DIMS;}

    function angleFor(i){return(Math.PI*2*i/8)-Math.PI/2;}

    function pointFor(i,val){
        var a=angleFor(i);
        var r=R*(val/7);
        return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};
    }

    function drawPolygon(z,scores,fillAlpha,strokeColor,lineW){
        ctx.beginPath();
        for(var i=0;i<8;i++){
            var p=pointFor(i,scores[i]);
            i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);
        }
        ctx.closePath();
        ctx.fillStyle=fillAlpha;
        ctx.fill();
        ctx.strokeStyle=strokeColor;
        ctx.lineWidth=lineW;
        ctx.stroke();
        for(var i=0;i<8;i++){
            var p=pointFor(i,scores[i]);
            ctx.beginPath();
            ctx.arc(p.x,p.y,hoverDim===i?5:3,0,Math.PI*2);
            ctx.fillStyle=strokeColor;
            ctx.fill();
            if(hoverDim===i){ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();}
        }
    }

    function draw(){
        ctx.clearRect(0,0,W,H);
        // Grid rings
        for(var ring=1;ring<=7;ring++){
            ctx.beginPath();
            for(var i=0;i<8;i++){
                var a=angleFor(i);var r=R*(ring/7);
                var px=cx+r*Math.cos(a),py=cy+r*Math.sin(a);
                i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
            }
            ctx.closePath();
            ctx.strokeStyle=ring===7?'#D1D5DE':'#E2E5EB';
            ctx.lineWidth=ring===7?1:0.5;
            ctx.stroke();
        }
        // Axes
        for(var i=0;i<8;i++){
            var a=angleFor(i);
            ctx.beginPath();ctx.moveTo(cx,cy);
            ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
            ctx.strokeStyle='#E2E5EB';ctx.lineWidth=0.5;ctx.stroke();
        }
        // Axis labels
        for(var i=0;i<8;i++){
            var a=angleFor(i);var lr=R+18;
            var lx=cx+lr*Math.cos(a),ly=cy+lr*Math.sin(a);
            ctx.font=(hoverDim===i?'bold 13px':'600 11px')+' JetBrains Mono,monospace';
            ctx.fillStyle=hoverDim===i?(viewMode==='opp'?'#33B894':'#006650'):'#1A1F2E';
            ctx.textAlign='center';ctx.textBaseline='middle';
            ctx.fillText(DIM_SHORT[i],lx,ly);
        }
        // Ring labels
        for(var ring=1;ring<=7;ring++){
            var ry=cy-R*(ring/7);
            ctx.font='9px JetBrains Mono,monospace';ctx.fillStyle='#5A6178';
            ctx.textAlign='left';ctx.textBaseline='middle';
            ctx.fillText(ring,cx+4,ry+1);
        }
        // Zone polygons
        ZONES.forEach(function(z,zi){
            if(!active[zi])return;
            if(viewMode==='risk'){
                drawPolygon(z,z.scores,z.fill,z.color,2);
            }else if(viewMode==='opp'){
                if(z.opp) drawPolygon(z,z.opp,z.fill,z.color,2);
            }else{
                ctx.setLineDash([4,3]);
                drawPolygon(z,z.scores,'rgba(220,38,38,0.05)','rgba(220,38,38,0.5)',1.5);
                ctx.setLineDash([]);
                if(z.opp) drawPolygon(z,z.opp,z.fill,z.color,2);
            }
        });
        // Hover highlight axis
        if(hoverDim>=0){
            var a=angleFor(hoverDim);
            ctx.beginPath();ctx.moveTo(cx,cy);
            ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
            ctx.strokeStyle='rgba(0,102,80,0.3)';ctx.lineWidth=2;ctx.stroke();
        }
        // Mode indicator
        var modeLabel=viewMode==='risk'?'RISQUE':viewMode==='opp'?'OPPORTUNITÉ':'COMBINÉ';
        var modeColor=viewMode==='risk'?'#DC2626':viewMode==='opp'?'#006650':'#C8955A';
        ctx.font='bold 9px Inter,sans-serif';ctx.fillStyle=modeColor;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(modeLabel,cx,cy);
    }

    function buildModeToggle(){
        var container=document.getElementById('radar-mode');
        container.innerHTML='';
        var modes=[
            {key:'risk',label:'Risque',icon:'\u26A0'},
            {key:'opp',label:'Opportunité',icon:'\u2197'},
            {key:'combined',label:'Combiné',icon:'\u2194'}
        ];
        modes.forEach(function(m){
            var btn=document.createElement('button');
            btn.textContent=m.icon+' '+m.label;
            var isActive=viewMode===m.key;
            btn.style.cssText='padding:0.45rem 1rem;font-size:0.78rem;font-weight:600;cursor:pointer;border:none;transition:all 0.2s;'+(isActive?'background:#006650;color:white;':'background:white;color:#5A6178;');
            btn.addEventListener('click',function(){
                viewMode=m.key;
                buildModeToggle();buildLegend();draw();
            });
            container.appendChild(btn);
        });
    }

    function buildControls(){
        var c=document.getElementById('radar-controls');
        c.innerHTML='';
        ZONES.forEach(function(z,i){
            var btn=document.createElement('button');
            btn.textContent=z.name;
            btn.style.cssText='padding:0.35rem 0.75rem;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.2s;border:2px solid '+z.color+';'+(active[i]?'background:'+z.color+';color:white;':'background:white;color:'+z.color+';');
            btn.addEventListener('click',function(){
                active[i]=!active[i];
                buildControls();buildLegend();draw();
            });
            c.appendChild(btn);
        });
        var allActive=active.every(function(a){return a;});
        var allBtn=document.createElement('button');
        allBtn.textContent=allActive?'Aucun':'Tous';
        allBtn.style.cssText='padding:0.35rem 0.75rem;border-radius:6px;font-size:0.78rem;font-weight:500;cursor:pointer;border:1px solid #E2E5EB;background:#F7F8FA;color:#5A6178;transition:all 0.2s;';
        allBtn.addEventListener('click',function(){
            var newState=!allActive;
            for(var j=0;j<active.length;j++)active[j]=newState;
            buildControls();buildLegend();draw();
        });
        c.appendChild(allBtn);
    }

    function buildLegend(){
        var leg=document.getElementById('radar-legend');
        leg.innerHTML='';
        ZONES.forEach(function(z,i){
            if(!active[i])return;
            var d=document.createElement('a');
            d.href=z.href;
            d.style.cssText='display:flex;align-items:center;gap:0.75rem;text-decoration:none;padding:0.5rem;border-radius:8px;transition:background 0.2s;';
            d.addEventListener('mouseenter',function(){d.style.background='#F7F8FA';});
            d.addEventListener('mouseleave',function(){d.style.background='transparent';});
            var dot=document.createElement('span');
            dot.style.cssText='width:14px;height:14px;border-radius:50%;flex-shrink:0;background:'+z.color+';';
            var info=document.createElement('div');
            if(viewMode==='risk'){
                info.innerHTML='<strong style="font-size:0.85rem;color:#1A1F2E;">'+z.name+'</strong><span style="display:block;font-family:JetBrains Mono,monospace;font-size:0.8rem;color:'+riskLevelColor(z.composite)+';font-weight:600;">'+z.composite.toFixed(1)+'/7 — '+z.level+'</span>';
            }else if(viewMode==='opp'){
                var oppStr=z.oppComposite!=null?(oppLevelColor(z.oppComposite)+';font-weight:600;">'+z.oppComposite.toFixed(1)+'/7 — '+z.oppLevel):('#5A6178;font-style:italic;">Données indisponibles');
                info.innerHTML='<strong style="font-size:0.85rem;color:#1A1F2E;">'+z.name+'</strong><span style="display:block;font-family:JetBrains Mono,monospace;font-size:0.8rem;color:'+oppStr+'</span>';
            }else{
                var oppPart=z.oppComposite!=null?('<span style="color:'+oppLevelColor(z.oppComposite)+';font-weight:600;">O '+z.oppComposite.toFixed(1)+'</span>'):('<span style="color:#5A6178;">O —</span>');
                info.innerHTML='<strong style="font-size:0.85rem;color:#1A1F2E;">'+z.name+'</strong><span style="display:block;font-family:JetBrains Mono,monospace;font-size:0.75rem;"><span style="color:'+riskLevelColor(z.composite)+';font-weight:600;">R '+z.composite.toFixed(1)+'</span> <span style="color:#E2E5EB;">/</span> '+oppPart+'</span>';
            }
            d.appendChild(dot);d.appendChild(info);leg.appendChild(d);
        });
        if(active.filter(function(a){return a;}).length===0){
            var empty=document.createElement('p');
            empty.style.cssText='font-size:0.8rem;color:#5A6178;font-style:italic;';
            empty.textContent='Sélectionnez une zone ci-dessus.';
            leg.appendChild(empty);
        }
    }

    // Mouse interaction
    canvas.addEventListener('mousemove',function(e){
        var rect=canvas.getBoundingClientRect();
        var scaleX=W/rect.width;
        var mx=(e.clientX-rect.left)*scaleX;
        var my=(e.clientY-rect.top)*scaleX;
        var angle=Math.atan2(my-cy,mx-cx);
        var dist=Math.sqrt((mx-cx)*(mx-cx)+(my-cy)*(my-cy));
        if(dist>R+30){
            if(hoverDim>=0){hoverDim=-1;draw();tooltip.style.display='none';}
            return;
        }
        var best=-1,bestDist=999;
        for(var i=0;i<8;i++){
            var a=angleFor(i);
            var da=Math.abs(Math.atan2(Math.sin(angle-a),Math.cos(angle-a)));
            if(da<bestDist){bestDist=da;best=i;}
        }
        if(best!==hoverDim){
            hoverDim=best;
            draw();
            var dims=currentDims();
            var lines=[];
            lines.push('<strong style="color:#33B894;">'+dims[best]+' ('+DIM_SHORT[best]+')</strong>');
            ZONES.forEach(function(z,zi){
                if(!active[zi])return;
                if(viewMode==='risk'){
                    lines.push('<span style="color:'+z.color+';">\u25CF</span> '+z.name+': <strong>'+z.scores[best]+'/7</strong>');
                }else if(viewMode==='opp'){
                    lines.push('<span style="color:'+z.color+';">\u25CF</span> '+z.name+': <strong>'+(z.opp?z.opp[best]+'/7':'—')+'</strong>');
                }else{
                    lines.push('<span style="color:'+z.color+';">\u25CF</span> '+z.name+': <span style="color:#DC2626;">R'+z.scores[best]+'</span> / <span style="color:#006650;">O'+(z.opp?z.opp[best]:'—')+'</span>');
                }
            });
            if(viewMode==='combined'){
                lines[0]='<strong style="color:#33B894;">'+DIMS[best]+'</strong> <span style="color:#5A6178;">/</span> <strong style="color:#C8955A;">'+OPP_DIMS[best]+'</strong> <span style="color:#5A6178;">('+DIM_SHORT[best]+')</span>';
            }
            tooltip.innerHTML=lines.join('<br>');
            tooltip.style.display='block';
        }
        var tx=e.clientX-canvas.closest('div').getBoundingClientRect().left+12;
        var ty=e.clientY-canvas.closest('div').getBoundingClientRect().top-10;
        tooltip.style.left=tx+'px';
        tooltip.style.top=ty+'px';
    });

    canvas.addEventListener('mouseleave',function(){
        hoverDim=-1;draw();tooltip.style.display='none';
    });

    // Init + resize
    sizeCanvas();
    buildModeToggle();
    buildControls();
    buildLegend();
    draw();

    var radarResizeTimer;
    window.addEventListener('resize',function(){
        clearTimeout(radarResizeTimer);
        radarResizeTimer=setTimeout(function(){sizeCanvas();draw();},200);
    });
})();
