(() => {
'use strict';
const { invNorm, pdf } = window.NormVizStatistics;
const part=document.getElementById('part'), whole=document.getElementById('whole');
const canvas=document.getElementById('curve'), ctx=canvas.getContext('2d');

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
    for(const id of ['pct','central','zscore','tail','closest']) document.getElementById(id).textContent='—';
    document.getElementById('fraction').textContent='Check your inputs';
    canvas.setAttribute('aria-label','Standard normal distribution. Enter valid inputs to shade a central area.');
    draw(NaN,NaN);
    updatePie(NaN);
    updateExplanation(NaN,NaN);
    return;
  }
  const pct=a/b*100;
  const z=pct===0?0:-invNorm((1-a/b)/2);
  document.getElementById('pct').textContent=pct.toFixed(2)+'%';
  document.getElementById('fraction').textContent=`${part.value||0} / ${whole.value||0}`;
  document.getElementById('central').textContent=pct.toFixed(2)+'%';
  document.getElementById('zscore').textContent=Number.isFinite(z)?'±'+z.toFixed(3)+'σ':'±∞σ';
  document.getElementById('tail').textContent=((100-pct)/2).toFixed(2)+'%';
  const refs=[{p:68.27,s:'1σ (68.3%)'},{p:95.45,s:'2σ (95.5%)'},{p:99.73,s:'3σ (99.7%)'}];
  refs.sort((x,y)=>Math.abs(x.p-pct)-Math.abs(y.p-pct));
  document.getElementById('closest').textContent=refs[0].s;
  canvas.setAttribute('aria-label',`${pct.toFixed(2)}% central area of the standard normal distribution; boundary ${Number.isFinite(z)?z.toFixed(3):'infinite'} standard deviations on either side of the mean.`);
  draw(z,pct);
  updatePie(pct);
  updateExplanation(pct,z);
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
  pie.classList.toggle('is-invalid',!valid);
  pie.setAttribute('aria-label',valid?`${selected} selected, ${remaining} remaining`:'Pie chart unavailable. Enter valid inputs.');
  document.getElementById('pie-percent').textContent=selected;
  document.getElementById('pie-selected').textContent=selected;
  document.getElementById('pie-remaining').textContent=remaining;
}
function draw(z,pct){
  const dpr=window.devicePixelRatio||1, rect=canvas.getBoundingClientRect();
  canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
  const W=rect.width,H=rect.height,L=42,R=22,T=25,B=64, base=H-B;
  const xmin=-3.6,xmax=3.6,ymax=.43;
  const X=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R), Y=y=>base-y/ymax*(base-T);
  ctx.clearRect(0,0,W,H);

  // Reference bands behind the user's selected area
  const bands=[{z:3,c:'rgba(214,92,92,.10)'},{z:2,c:'rgba(224,155,45,.12)'},{z:1,c:'rgba(53,163,111,.15)'}];
  bands.forEach(b=>{ctx.fillStyle=b.c;ctx.fillRect(X(-b.z),T,X(b.z)-X(-b.z),base-T);});

  // User area under curve
  if(!Number.isNaN(z)){
    const zz=Math.min(z,3.6); ctx.beginPath(); ctx.moveTo(X(-zz),base);
    for(let x=-zz;x<=zz;x+=.025) ctx.lineTo(X(x),Y(pdf(x)));
    ctx.lineTo(X(zz),Y(pdf(zz)));ctx.lineTo(X(zz),base);ctx.closePath();ctx.fillStyle='rgba(109,93,252,.42)';ctx.fill();
  }

  // curve
  ctx.beginPath();
  for(let x=xmin;x<=xmax;x+=.02){ const xx=X(x),yy=Y(pdf(x)); x===xmin?ctx.moveTo(xx,yy):ctx.lineTo(xx,yy);}
  ctx.strokeStyle='#202124';ctx.lineWidth=2.5;ctx.stroke();

  // axis + sigma markers
  ctx.strokeStyle='#aaa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,base);ctx.lineTo(W-R,base);ctx.stroke();
  ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillStyle='#444';
  for(let i=-3;i<=3;i++){
    ctx.beginPath();ctx.moveTo(X(i),base);ctx.lineTo(X(i),base+7);ctx.strokeStyle='#888';ctx.stroke();
    ctx.fillText(i===0?'μ':(i>0?'+':'')+i+'σ',X(i),base+24);
  }
  // colored reference brackets/labels
  const rows=[{z:1,label:'68.3% • ±1σ',c:'#27865a',y:base+43},{z:2,label:'95.5% • ±2σ',c:'#b97812',y:base+43},{z:3,label:'99.7% • ±3σ',c:'#b54444',y:base+43}];
  rows.forEach((r,idx)=>{
    const y=T+16+idx*22;ctx.strokeStyle=r.c;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(X(-r.z),y);ctx.lineTo(X(r.z),y);ctx.stroke();
    ctx.fillStyle=r.c;ctx.font='12px system-ui';ctx.fillText(r.label,X(0),y-4);
  });
  if(!Number.isNaN(z)){
    const zz=Math.min(z,3.6); ctx.strokeStyle='#6d5dfc';ctx.lineWidth=2;
    [ -zz, zz ].forEach(v=>{ctx.beginPath();ctx.moveTo(X(v),base);ctx.lineTo(X(v),Y(pdf(v)));ctx.stroke();});
    ctx.fillStyle='#5b4be0';ctx.font='bold 14px system-ui';
    ctx.fillText(`${pct.toFixed(2)}% = ±${Number.isFinite(z)?z.toFixed(3):'∞'}σ`,X(0),base-12);
  }
}
part.addEventListener('input',update); whole.addEventListener('input',update);
window.addEventListener('resize',update); update();

})();
