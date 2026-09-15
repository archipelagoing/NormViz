(() => {
'use strict';
const { invNorm, pdf } = window.NormVizStatistics;
const part=document.getElementById('part'), whole=document.getElementById('whole');
const canvas=document.getElementById('curve'), ctx=canvas.getContext('2d');
const pie=document.getElementById('pie');
const example=document.getElementById('walking-example');
const meanInput=document.getElementById('walk-mean'), sdInput=document.getElementById('walk-sd');
const state={pct:NaN,z:NaN,hover:null,pinned:null,plot:null};
const regionNames={left:'Lower tail',center:'Purple middle',right:'Upper tail'};
const regionButtons=[...document.querySelectorAll('[data-region]')];
const presets=[...document.querySelectorAll('[data-percentage]')];


function update(){
  const a=part.valueAsNumber, b=whole.valueAsNumber;
  const validWhole=Number.isFinite(b)&&b>0;
  const validPart=Number.isFinite(a)&&a>=0&&(!validWhole||a<=b);
  const error=document.getElementById('input-error');
  part.setAttribute('aria-invalid', String(!validPart));
  whole.setAttribute('aria-invalid', String(!validWhole));
  error.hidden=validPart&&validWhole;
  if(!error.hidden){
    error.textContent='Enter a positive whole and a part between zero and the whole.';
    for(const id of ['pct','central','zscore','tail','interpretation']) document.getElementById(id).textContent='—';
    document.getElementById('fraction').textContent='Check your inputs';
    canvas.setAttribute('aria-label','Standard normal distribution. Enter valid inputs to shade a central area.');
    state.pct=NaN; state.z=NaN; state.hover=null; state.pinned=null;
    draw(NaN,NaN);
    updatePie(NaN);
    updateExplanation(NaN,NaN);
    syncControls(); updateWalking(); syncHighlights();
    return;
  }
  const pct=a/b*100;
  const z=pct===0?0:-invNorm((1-a/b)/2);
  document.getElementById('pct').textContent=pct.toFixed(2)+'%';
  document.getElementById('fraction').textContent=`${part.value||0} / ${whole.value||0}`;
  document.getElementById('central').textContent=pct.toFixed(2)+'%';
  document.getElementById('zscore').textContent=Number.isFinite(z)?'±'+z.toFixed(3)+'σ':'±∞σ';
  document.getElementById('tail').textContent=((100-pct)/2).toFixed(2)+'%';
  document.getElementById('interpretation').textContent=Number.isFinite(z)?`About ${z.toFixed(2)} standard deviations on each side`:'The entire distribution; no finite boundaries';
  state.pct=pct; state.z=z;
  canvas.setAttribute('aria-label',`${pct.toFixed(2)}% central area of the standard normal distribution; boundary ${Number.isFinite(z)?z.toFixed(3):'infinite'} standard deviations on either side of the mean.`);
  updatePie(pct);
  updateExplanation(pct,z);
  syncControls(); updateWalking(); syncHighlights();
}
function updateExplanation(pct,z){
  const valid=Number.isFinite(pct);
  const tail=valid?(100-pct)/2:0;
  const summary=document.getElementById('reading-summary');
  const boundary=document.getElementById('reading-boundary');
  document.getElementById('strip-left').style.width=tail+'%';
  document.getElementById('strip-center').style.width=(valid?pct:0)+'%';
  document.getElementById('strip-right').style.width=tail+'%';
  if(!valid){
    summary.textContent='Enter a valid part and whole to see your percentage explained here.';
    boundary.textContent='';
    return;
  }
  summary.textContent=`Imagine 100 observations from a normal distribution. On average, about ${pct.toFixed(2)} would fall in the purple middle, with ${tail.toFixed(2)} below it and ${tail.toFixed(2)} above it. The pie combines those two tails into its ${(100-pct).toFixed(2)}% gray remainder.`;
  if(pct===0){
    boundary.textContent='At 0%, the boundaries meet at the average. The interval has no width and contains no area; each half of the bell holds 50%.';
  } else if(pct===100){
    boundary.textContent='At 100%, the purple area includes the entire distribution. A normal curve extends forever in both directions, so its boundaries are infinite. The chart shows only part of that full range.';
  } else {
    boundary.textContent=`To include the middle ${pct.toFixed(2)}%, extend ${z.toFixed(3)} standard deviations below and above the average. That is what ±${z.toFixed(3)}σ means. Increasing the percentage moves the boundaries outward to include more values.`;
  }
}
function updatePie(pct){
  const pie=document.getElementById('pie');
  const valid=Number.isFinite(pct);
  const selected=valid?pct.toFixed(2)+'%':'—';
  const remaining=valid?(100-pct).toFixed(2)+'%':'—';
  pie.style.setProperty('--percentage',valid?pct+'%':'0%');
  // The minute hand gains 5.5 degrees per minute on the hour hand.
  // Solve for a clockwise gap of pct / 100 full turns without rounding angles.
  const sweep=valid?pct*3.6:0;
  const elapsedMinutes=sweep/5.5;
  const hourAngle=elapsedMinutes*.5;
  const seconds=Math.round(elapsedMinutes*60);
  const clockTime=valid?`${Math.floor(seconds/3600)||12}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:'—';
  document.getElementById('clock-time').textContent=clockTime;
  pie.style.setProperty('--hand-angle',(hourAngle+sweep)+'deg');
  pie.style.setProperty('--hour-angle',hourAngle+'deg');
  const tailAngle=hourAngle+sweep+(360-sweep)/2;
  const secondPosition=((tailAngle%360)+360)%360/6;
  pie.style.setProperty('--second-angle',tailAngle+'deg');
  document.getElementById('divider-seconds').textContent=valid&&pct<100?secondPosition.toFixed(2)+' s':'—';
  pie.classList.toggle('is-empty',valid&&pct===0);
  pie.classList.toggle('is-full',valid&&pct===100);
  pie.classList.toggle('is-invalid',!valid);
  pie.setAttribute('aria-label',valid?`${selected} selected, ${remaining} remaining, split into two tails of ${((100-pct)/2).toFixed(2)}% each. Clock equivalent ${clockTime}, with the selected area measured clockwise from the hour hand to the minute hand.`:'Pie chart unavailable. Enter valid inputs.');
  document.getElementById('pie-percent').textContent=selected;
  document.getElementById('pie-selected').textContent=selected;
  document.getElementById('pie-remaining').textContent=remaining;
}
function syncControls(){
  const valid=Number.isFinite(state.pct);
  presets.forEach(button=>button.setAttribute('aria-pressed',String(valid&&Math.abs(Number(button.dataset.percentage)-state.pct)<1e-9)));
}
function choosePercentage(value){
  part.value=String(value); whole.value='100'; update();
}
function walkingParameters(){
  const mean=meanInput.valueAsNumber,sd=sdInput.valueAsNumber;
  return {mean,sd,valid:Number.isFinite(mean)&&Number.isFinite(sd)&&sd>0};
}
function updateWalking(){
  const {mean,sd,valid}=walkingParameters();
  const error=document.getElementById('walk-error');
  meanInput.setAttribute('aria-invalid',String(!Number.isFinite(mean)));
  sdInput.setAttribute('aria-invalid',String(!Number.isFinite(sd)||sd<=0));
  error.hidden=valid;
  error.textContent=valid?'':'Enter a finite average and a positive standard deviation.';
  const result=document.getElementById('walk-result');
  const note=document.getElementById('walk-model-note');
  note.textContent='This is an illustrative normal model, not a prediction of your next walk.';
  if(!valid){result.textContent='';return;}
  if(!Number.isFinite(state.pct)){result.textContent='Choose a valid percentage to see its range in minutes.';return;}
  if(state.pct===100){
    result.textContent='100% spans the entire normal model, from −∞ to +∞ minutes.';
    note.textContent='A normal model extends below zero. Real walking times cannot, so this model is only an approximation.';
    return;
  }
  const low=mean-state.z*sd, high=mean+state.z*sd;
  if(!Number.isFinite(low)||!Number.isFinite(high)){
    result.textContent='These values are too large to display a finite range. Try a smaller average or spread.';return;
  }
  result.textContent=`Middle ${state.pct.toFixed(2)}%: ${low.toFixed(2)}–${high.toFixed(2)} minutes.`;
  if(low<0) note.textContent='This range includes negative minutes, which are not possible for a walk. A normal model is a poor fit for this range.';
}
function regionShare(region){return region==='center'?state.pct:(100-state.pct)/2;}
function syncHighlights(){
  const valid=Number.isFinite(state.pct);
  const active=valid?(state.hover||state.pinned):null;
  const sweep=valid?state.pct*3.6:0;
  const ranges={center:[0,sweep],right:[sweep,(sweep+360)/2],left:[(sweep+360)/2,360]};
  let highlight='transparent';
  if(active){
    const [start,end]=ranges[active];
    highlight=`conic-gradient(from ${sweep/11}deg, transparent 0deg ${start}deg, rgba(255,199,64,.6) ${start}deg ${end}deg, transparent ${end}deg 360deg)`;
  }
  pie.style.setProperty('--region-highlight',highlight);
  regionButtons.forEach(button=>{
    const region=button.dataset.region;
    button.disabled=!valid;
    button.setAttribute('aria-pressed',String(active===region));
    button.setAttribute('aria-label',valid?`${regionNames[region]}, ${regionShare(region).toFixed(2)} percent`:regionNames[region]);
    if(button.id.startsWith('strip-')) button.hidden=!valid||regionShare(region)===0;
  });
  document.getElementById('region-description').textContent=active?`${regionNames[active]}: ${regionShare(active).toFixed(2)}% of the whole. Follow the gold highlight across the bell, pie, and bar.`:'Choose an area to connect the pictures.';
  draw(state.z,state.pct);
}
function setHover(region){if(state.hover!==region){state.hover=region;syncHighlights();}}
function toggleRegion(region){state.pinned=state.pinned===region?null:region;state.hover=null;syncHighlights();}
function bellRegion(event){
  if(!Number.isFinite(state.pct)||!state.plot)return null;
  const rect=canvas.getBoundingClientRect(), {L,R,W,base,T,ymax}=state.plot;
  const xPixel=event.clientX-rect.left,yPixel=event.clientY-rect.top;
  if(xPixel<L||xPixel>W-R||yPixel<T||yPixel>base)return null;
  const x=-3.6+(xPixel-L)/(W-L-R)*7.2;
  if(yPixel<base-pdf(x)/ymax*(base-T))return null;
  return x < -state.z?'left':x>state.z?'right':'center';
}
function pieRegion(event){
  if(!Number.isFinite(state.pct))return null;
  const rect=pie.getBoundingClientRect();
  const x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2;
  if(Math.hypot(x,y)>rect.width/2)return null;
  const angle=(Math.atan2(x,-y)*180/Math.PI+360)%360;
  const sweep=state.pct*3.6;
  const relative=(angle-sweep/11+360)%360;
  return relative<sweep?'center':relative<(sweep+360)/2?'right':'left';
}
function draw(z,pct){
  const chartFont=window.getComputedStyle(document.body).fontFamily;
  const dpr=window.devicePixelRatio||1, rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  const walking=walkingParameters();
  const showMinutes=example.open&&walking.valid;
  const W=rect.width,H=rect.height,L=24,R=24,T=46,B=showMinutes?92:64,base=H-B;
  const xmin=-3.6,xmax=3.6,ymax=.43;
  state.plot={L,R,W,base,T,ymax};
  const X=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R), Y=y=>base-y/ymax*(base-T);
  ctx.clearRect(0,0,W,H);
  function fillArea(lo,hi,color,outline=false){
    if(hi<=lo)return;
    ctx.beginPath();ctx.moveTo(X(lo),base);
    const steps=Math.max(2,Math.ceil((hi-lo)/.02));
    for(let i=0;i<=steps;i++){const x=lo+(hi-lo)*i/steps;ctx.lineTo(X(x),Y(pdf(x)));}
    ctx.lineTo(X(hi),base);ctx.closePath();ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.strokeStyle='#ac7400';ctx.lineWidth=2;ctx.stroke();}
  }
  fillArea(xmin,xmax,'#e2e2e9');
  if(!Number.isNaN(z)){
    const zz=Math.min(z,xmax);
    fillArea(-zz,zz,'rgba(109,93,252,.65)');
    const active=state.hover||state.pinned;
    const ranges={left:[xmin,-zz],center:[-zz,zz],right:[zz,xmax]};
    if(active)fillArea(...ranges[active],'rgba(255,199,64,.6)',true);
  }
  // Reference markers stop at the curve; there are no shaded rectangles.
  [{z:1,c:'#27865a'},{z:2,c:'#b97812'},{z:3,c:'#b54444'}].forEach(ref=>{
    ctx.strokeStyle=ref.c;ctx.lineWidth=1;ctx.setLineDash([3,4]);
    [-ref.z,ref.z].forEach(x=>{ctx.beginPath();ctx.moveTo(X(x),base);ctx.lineTo(X(x),Y(pdf(x)));ctx.stroke();});
  });
  ctx.setLineDash([]);
  ctx.beginPath();
  for(let i=0;i<=360;i++){const x=xmin+(xmax-xmin)*i/360;i===0?ctx.moveTo(X(x),Y(pdf(x))):ctx.lineTo(X(x),Y(pdf(x)));}
  ctx.strokeStyle='#202124';ctx.lineWidth=2.5;ctx.stroke();
  const tapeHeight=showMinutes?70:48;
  ctx.fillStyle='#fff0b8';ctx.fillRect(L,base,W-L-R,tapeHeight);
  ctx.strokeStyle='#b79b50';ctx.lineWidth=1;ctx.strokeRect(L,base,W-L-R,tapeHeight);
  for(let tick=-36;tick<=36;tick++){
    const major=tick%10===0,half=tick%5===0;
    ctx.strokeStyle=major?'#493b1d':'#9d874e';ctx.lineWidth=major?1.5:1;
    ctx.beginPath();ctx.moveTo(X(tick/10),base);ctx.lineTo(X(tick/10),base+(major?19:half?13:7));ctx.stroke();
  }
  ctx.font=`bold 12px ${chartFont}`;ctx.textAlign='center';ctx.fillStyle='#493b1d';
  for(let i=-3;i<=3;i++)ctx.fillText(i===0?'μ':(i>0?'+':'')+i+'σ',X(i),base+36);
  if(showMinutes){
    ctx.font=`10px ${chartFont}`;
    for(let i=-3;i<=3;i++){
      if(W<440&&i%2!==0)continue;
      const value=walking.mean+i*walking.sd;
      ctx.fillText(Number.isFinite(value)?Number(value.toFixed(1)).toString():'—',X(i),base+56,Math.max(24,(W-L-R)/8));
    }
    ctx.fillText('Walking time (minutes)',W/2,H-5);
  }
  const note=document.getElementById('bounds-note');
  note.hidden=Number.isNaN(z)||z<=xmax;
  note.textContent=z===Infinity?'100% includes the whole normal curve. Both boundaries extend infinitely beyond this view.':`The boundaries at ±${z.toFixed(3)}σ extend beyond this view (−3.6σ to +3.6σ). Arrows show where the selected area continues.`;
  if(!Number.isNaN(z)){
    ctx.strokeStyle='#6d5dfc';ctx.lineWidth=2;
    if(z<=xmax){
      [-z,z].forEach(x=>{ctx.beginPath();ctx.moveTo(X(x),base);ctx.lineTo(X(x),Y(pdf(x)));ctx.stroke();});
    }else{
      [-1,1].forEach(side=>{
        const edge=side<0?L:W-R,y=base-14;
        ctx.beginPath();ctx.moveTo(edge-side*22,y);ctx.lineTo(edge,y);
        ctx.moveTo(edge-side*6,y-5);ctx.lineTo(edge,y);ctx.lineTo(edge-side*6,y+5);ctx.stroke();
      });
    }
    ctx.fillStyle='#5b4be0';ctx.font=`bold ${W<440?12:14}px ${chartFont}`;
    const label=z===Infinity?'100% covers the whole distribution':`Middle ${pct.toFixed(2)}% lies within ±${z.toFixed(3)}σ`;
    ctx.fillText(label,W/2,22,W-12);
  }
}
part.addEventListener('input',update);whole.addEventListener('input',update);
presets.forEach(button=>button.addEventListener('click',()=>choosePercentage(button.dataset.percentage)));
[meanInput,sdInput].forEach(input=>input.addEventListener('input',()=>{updateWalking();draw(state.z,state.pct);}));
example.addEventListener('toggle',()=>{updateWalking();draw(state.z,state.pct);});
regionButtons.forEach(button=>{
  const region=button.dataset.region;
  button.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')setHover(region);});
  button.addEventListener('pointerleave',()=>setHover(null));
  button.addEventListener('click',()=>toggleRegion(region));
});
[[canvas,bellRegion],[pie,pieRegion]].forEach(([element,hitTest])=>{
  element.addEventListener('pointermove',event=>{if(event.pointerType!=='touch')setHover(hitTest(event));});
  element.addEventListener('pointerleave',()=>setHover(null));
  element.addEventListener('click',event=>{const region=hitTest(event);if(region)toggleRegion(region);});
});
document.getElementById('clear-highlight').addEventListener('click',()=>{state.hover=null;state.pinned=null;syncHighlights();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){state.hover=null;state.pinned=null;syncHighlights();}});
window.addEventListener('resize',()=>draw(state.z,state.pct));update();
if(document.fonts)document.fonts.ready.then(()=>draw(state.z,state.pct));
})();
