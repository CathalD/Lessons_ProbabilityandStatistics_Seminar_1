(() => {
  'use strict';
  const M=window.ProbabilityMath, $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const STORAGE='probability-seminar-notebook-v2';
  const REFERENCE_STORAGE='probability-seminar-reference-v2';
  const regularDice=Array.from({length:3},()=>[1,2,3,4,5,6]);
  // Teaching preset. Equal face probabilities; labels are intentionally absent from the student UI.
  const irregularDice=[[0,0,0,1,8,9],[0,1,1,1,2,9],[0,0,2,2,8,9]];
  const cfg={regular:{name:'Regular dice',dice:regularDice,min:3,max:18,intervals:[[3,8],[9,12],[13,18]]},irregular:{name:'Irregular dice',dice:irregularDice,min:0,max:27,intervals:[[0,8],[9,17],[18,27]]}};
  function freshLab(kind) { return {runId:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),mode:'simulation',observations:[],lastReading:null,showComputed:false,pmfMax:.3,strokes:{pmf:[],cdf:[]},functions:{pmf:'',cdf:''},description:'',reasoning:'',reflection:'',intervals:cfg[kind].intervals.map(([a,b])=>({a,b,q:''})),locked:null,validation:[]}; }
  let notebook={version:2,notes:{},labs:{regular:freshLab('regular'),irregular:freshLab('irregular')}};
  const pending={regular:null,irregular:null};
  let references={};
  try{const raw=JSON.parse(localStorage.getItem(REFERENCE_STORAGE)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))references=raw;}catch(e){}
  let frequencyValues=[],toastTimer,saveTimer;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=x=>Number(x).toLocaleString(undefined,{maximumFractionDigits:3});
  const percent=x=>(100*x).toLocaleString(undefined,{maximumFractionDigits:1})+'%';

  function sanitizeLab(raw,kind) {
    const s=freshLab(kind), c=cfg[kind];
    if(!raw||typeof raw!=='object')return s;
    if(typeof raw.runId==='string'&&/^[a-zA-Z0-9-]{1,100}$/.test(raw.runId))s.runId=raw.runId;
    s.mode=raw.mode==='physical'?'physical':'simulation';
    s.observations=Array.isArray(raw.observations)?raw.observations.filter(Number.isInteger).filter(x=>x>=-10&&x<=40).slice(0,10000):[];
    s.lastReading=Number.isInteger(raw.lastReading)?raw.lastReading:null;
    s.showComputed=Boolean(raw.showComputed);
    s.pmfMax=[.2,.3,.5,1].includes(Number(raw.pmfMax))?Number(raw.pmfMax):.3;
    for(const k of ['description','reasoning','reflection'])s[k]=typeof raw[k]==='string'?raw[k].slice(0,20000):'';
    for(const k of ['pmf','cdf']) {
      s.functions[k]=typeof raw.functions?.[k]==='string'?raw.functions[k].slice(0,20000):'';
      if(Array.isArray(raw.strokes?.[k]))s.strokes[k]=raw.strokes[k].slice(0,1000).map(st=>Array.isArray(st)?st.filter(p=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)).slice(0,10000):[]);
    }
    if(Array.isArray(raw.intervals)&&raw.intervals.length===3)s.intervals=raw.intervals.map((r,i)=>({a:r.a===''?'':Number.isInteger(Number(r.a))?Number(r.a):s.intervals[i].a,b:r.b===''?'':Number.isInteger(Number(r.b))?Number(r.b):s.intervals[i].b,q:typeof r.q==='number'||typeof r.q==='string'?String(r.q).slice(0,20):''}));
    const locked=raw.locked;
    if(locked&&Array.isArray(locked.intervals)&&locked.intervals.length===3&&locked.intervals.every(r=>Number.isInteger(r.a)&&Number.isInteger(r.b)&&r.a>=c.min&&r.b<=c.max&&r.a<=r.b&&Number.isFinite(r.q)&&r.q>=0&&r.q<=1)) {
      s.locked={intervals:locked.intervals.map(r=>({a:r.a,b:r.b,q:r.q})),n:s.observations.length,at:typeof locked.at==='string'?locked.at:'',reasoning:typeof locked.reasoning==='string'?locked.reasoning:''};
      s.intervals=s.locked.intervals.map(r=>({...r,q:String(r.q)}));
      s.validation=Array.isArray(raw.validation)?raw.validation.filter(Number.isInteger).filter(x=>x>=c.min&&x<=c.max).slice(0,10):[];
    }
    return s;
  }
  function loadNotebook(raw) {
    if(!raw||raw.version!==2||!raw.labs)throw new Error('Choose a notebook exported from this lesson.');
    return {version:2,notes:Object.fromEntries(Object.entries(raw.notes||{}).filter(([k,v])=>typeof k==='string'&&typeof v==='string').map(([k,v])=>[k,v.slice(0,20000)])),labs:{regular:sanitizeLab(raw.labs.regular,'regular'),irregular:sanitizeLab(raw.labs.irregular,'irregular')}};
  }
  try {const saved=localStorage.getItem(STORAGE);if(saved)notebook=loadNotebook(JSON.parse(saved));}catch(e){/* A blocked store or old notebook does not prevent using the lesson. */}
  function persistNow() {
      try{localStorage.setItem(STORAGE,JSON.stringify(notebook));$('#save-status').textContent='Saved in this browser. Export to keep a copy.';}
      catch(e){$('#save-status').textContent='Browser saving is unavailable. Use Save notebook to keep your work.';}
      try{localStorage.setItem(REFERENCE_STORAGE,JSON.stringify(references));}catch(e){}
  }
  function save() {
    clearTimeout(saveTimer);saveTimer=setTimeout(persistNow,180);
  }
  window.addEventListener('pagehide',persistNow);
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
  function confirmAction(text,onConfirm){
    const dialog=document.createElement('dialog');dialog.className='confirm-dialog';dialog.setAttribute('aria-label','Replace saved work');
    const title=document.createElement('h3');title.textContent='Keep or replace your work';
    const description=document.createElement('p');description.textContent=text;
    const controls=document.createElement('div');controls.className='controls';
    const cancel=document.createElement('button');cancel.className='quiet';cancel.textContent='Keep current work';cancel.onclick=()=>dialog.close();
    const replace=document.createElement('button');replace.textContent='Replace work';replace.onclick=()=>{dialog.close();onConfirm();};
    controls.append(cancel,replace);dialog.append(title,description,controls);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  }
  function message(kind,text,error=false){const node=$(`#${kind}-message`);node.textContent=text;node.classList.toggle('error',error);}

  // SVG plots share scales and include equivalent value tables in the notebooks.
  function chart(pmf,{min,max,title='',cdf=false,counts=false,highlight=null,observed=null,height=290}={}) {
    const width=620,L=55,R=18,T=25,B=46,W=width-L-R,H=height-T-B;
    const entries=[...pmf]; min??=Math.min(...entries.map(e=>e[0]),0);max??=Math.max(...entries.map(e=>e[0]),6);
    const domain=max-min+1, peak=Math.max(counts?1:.1,...entries.map(e=>e[1]));
    const target=Math.min(counts?Infinity:1,peak*1.12),rawStep=target/4,power=10**Math.floor(Math.log10(rawStep));
    const stepSize=counts?Math.max(1,Math.ceil(rawStep)):[1,2,2.5,5,10].map(v=>v*power).find(v=>v>=rawStep);
    const ymax=cdf?1:Math.ceil(target/stepSize)*stepSize;
    const X=x=>L+(x-min+.5)/domain*W,Y=y=>T+H-y/ymax*H;
    let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>`;
    for(let i=0;i<=4;i++){const y=ymax*i/4;svg+=`<line x1="${L}" x2="${width-R}" y1="${Y(y)}" y2="${Y(y)}" stroke="#dfe8ec"/><text x="${L-9}" y="${Y(y)+5}" text-anchor="end" fill="#52636b" font-size="14">${counts?number(y):number(y)}</text>`;}
    const step=Math.max(1,Math.ceil(domain/15));
    for(let x=min;x<=max;x++){
      const p=pmf.get(x)||0, chosen=highlight&&x>=highlight[0]&&x<=highlight[1],color=chosen?'#087e78':'#7fa8bf';
      if(!cdf)svg+=`<rect x="${X(x)-W/domain*.35}" y="${Y(p)}" width="${W/domain*.7}" height="${Math.max(0,Y(0)-Y(p))}" fill="${observed===x?'#c45b35':color}"><title>${x}: ${number(p)}</title></rect>`;
      if((x-min)%step===0||x===max)svg+=`<text x="${X(x)}" y="${height-21}" text-anchor="middle" fill="#52636b" font-size="14">${x}</text>`;
    }
    if(cdf){
      let path=`M ${L} ${Y(0)} L ${X(min)} ${Y(0)}`;
      for(let x=min;x<=max;x++){path+=` L ${X(x)} ${Y(M.cdf(pmf,x))} L ${x===max?width-R:X(x+1)} ${Y(M.cdf(pmf,x))}`;}
      svg+=`<path d="${path}" fill="none" stroke="#185b80" stroke-width="3"/>`;
      for(let x=min;x<=max;x++)if(pmf.get(x))svg+=`<circle cx="${X(x)}" cy="${Y(M.cdf(pmf,x))}" r="3.2" fill="#185b80"/>`;
    }
    svg+=`<line x1="${L}" x2="${width-R}" y1="${Y(0)}" y2="${Y(0)}" stroke="#52636b"/><text x="${width/2}" y="${height-2}" text-anchor="middle" fill="#52636b" font-size="14">${counts?'Outcome':'Value'}</text></svg>`;
    return svg;
  }
  function renderFrequency(){
    const e=M.empirical(frequencyValues),isCount=$('#frequency-axis').value==='count';
    $('#frequency-chart').innerHTML=chart(isCount?e.counts:e.pmf,{min:1,max:6,title:isCount?'Counts of single die outcomes':'Relative frequencies of single die outcomes',counts:isCount});
    $('#frequency-caption').textContent=frequencyValues.length?`${frequencyValues.length} rolls. Count from 2 to 4: ${frequencyValues.filter(x=>x>=2&&x<=4).length}. Estimated probability: ${percent(M.interval(e.pmf,2,4))}.`:'No rolls yet. Make a prediction, then collect data.';
  }
  $('#sample-one').onclick=()=>{frequencyValues.push(M.roll([[1,2,3,4,5,6]])[0]);renderFrequency();};
  $('#sample-thirty').onclick=()=>{for(let i=0;i<30;i++)frequencyValues.push(M.roll([[1,2,3,4,5,6]])[0]);renderFrequency();};
  $('#reset-one').onclick=()=>{frequencyValues=[];renderFrequency();};$('#frequency-axis').onchange=renderFrequency;
  function renderSums(){
    const n=Number($('#dice-count').value),d=M.distribution(regularDice.slice(0,n)),a=Number($('#sum-low').value),b=Number($('#sum-high').value);
    $('#outcome-summary').textContent=`${n} ${n===1?'die':'dice'} · ${d.outcomes} ordered face combinations · ${6*n-n+1} possible totals from ${n} to ${6*n}`;
    $('#sum-pmf').innerHTML=chart(d.pmf,{min:n,max:6*n,title:`Mass function for the sum of ${n} dice`,highlight:[a,b]});
    $('#sum-cdf').innerHTML=chart(d.pmf,{min:n-1,max:6*n+1,title:`CDF for the sum of ${n} dice`,cdf:true});
    $('#interval-result').textContent=Number.isInteger(a)&&Number.isInteger(b)&&a<=b?`P(${a} ≤ S ≤ ${b}) = F(${b}) − F(${a-1}) = ${number(M.cdf(d.pmf,b))} − ${number(M.cdf(d.pmf,a-1))} = ${percent(M.interval(d.pmf,a,b))}. Endpoints are included.`:'Choose integer endpoints with the start at or below the end.';
  }
  for(const id of ['dice-count','sum-low','sum-high'])$('#'+id).addEventListener('input',renderSums);
  function renderNormal(){
    const mu=Number($('#normal-mean').value),sd=Number($('#normal-sd').value),a=Number($('#normal-low').value),b=Number($('#normal-high').value),L=55,R=18,T=20,B=42,W=830,H=295,w=W-L-R,h=H-T-B;
    const X=x=>L+(x+6)/12*w,Y=y=>H-B-y/1.1*h,pts=Array.from({length:361},(_,i)=>-6+i/30);
    let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Normal density with selected interval shaded"><title>Normal density; area between a and b is probability</title>`;
    for(let i=0;i<=4;i++){let v=i*.25;svg+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e1e9ed"/><text x="${L-9}" y="${Y(v)+5}" font-size="14" text-anchor="end" fill="#52636b">${v}</text>`;}
    const selected=pts.filter(x=>x>=a&&x<=b);
    if(a<=b&&selected.length)svg+=`<path d="M ${X(selected[0])} ${Y(0)} ${selected.map(x=>`L ${X(x)} ${Y(M.normalPDF(x,mu,sd))}`).join(' ')} L ${X(selected.at(-1))} ${Y(0)} Z" fill="#087e782f"/>`;
    svg+=`<path d="${pts.map((x,i)=>`${i?'L':'M'} ${X(x)} ${Y(M.normalPDF(x,mu,sd))}`).join(' ')}" fill="none" stroke="#185b80" stroke-width="3"/>`;
    for(let x=-6;x<=6;x++)svg+=`<text x="${X(x)}" y="${H-18}" font-size="14" text-anchor="middle" fill="#52636b">${x}</text>`;
    svg+='<text x="415" y="293" text-anchor="middle" font-size="14" fill="#52636b">Measurement x</text></svg>';
    $('#normal-chart').innerHTML=svg;$('#normal-caption').textContent=a<=b?`μ = ${number(mu)}, σ = ${number(sd)}. P(${a} ≤ X ≤ ${b}) ≈ ${percent(M.normalCDF(b,mu,sd)-M.normalCDF(a,mu,sd))}. Vertical axis: density.`:'The start of the interval must be at or below the end.';
  }
  for(const id of ['normal-mean','normal-sd','normal-low','normal-high'])$('#'+id).oninput=renderNormal;

  function labHTML(kind) {
    const s=notebook.labs[kind],c=cfg[kind];
    return `<div class="lab-header"><label>Data source <select id="${kind}-mode" ${s.observations.length||s.locked?'disabled':''}><option value="simulation" ${s.mode==='simulation'?'selected':''}>Simulation</option><option value="physical" ${s.mode==='physical'?'selected':''}>Physical dice</option></select></label><span class="lab-state">${s.locked?s.validation.length===10?'Validation complete':'Predictions locked':'Collecting observations'}</span><button class="quiet small" data-action="reset" data-kind="${kind}">New experiment</button></div>
      <div class="phase-title"><span>Observe</span><h3>Collect fuzzy measurements</h3></div>
      <p>Record the <strong>sum of three dice</strong> for each fresh roll. Aim for at least 30 measurements or pool comparable data from your group. Keep the dice and viewing conditions fixed. Add only readings from the selected data source.</p>
      ${s.mode==='simulation'?`<div class="measurement-box"><canvas id="${kind}-sensor" class="sensor-visual" width="360" height="310" aria-label="Translucent cup illustration. Read the reported measurement alongside it."></canvas><div><p>A simulated instrument reports a noisy total. This is synthetic measurement data, not a direct reading of the true faces.</p><div id="${kind}-reading" class="reading">${s.lastReading===null?'—':s.lastReading}<small>Observed total y</small></div><div class="controls sim-controls"><button data-action="sample" data-kind="${kind}" ${s.locked?'disabled':''}>Take one reading</button><button class="secondary" data-action="sample-batch" data-kind="${kind}" ${s.locked?'disabled':''}>Add 20 readings</button></div></div></div>`:`<p>Use a translucent cup and the same three physical dice. Enter your estimated totals. The instructor keeps clear reference values separate.</p>`}
      <div class="data-entry"><label for="${kind}-observations">Add measured totals, separated by spaces or commas<input id="${kind}-observations" inputmode="numeric" placeholder="e.g. ${kind==='regular'?'9, 12, 11, 8':'4, 12, 7, 10'}" ${s.locked?'disabled':''}></label><button data-action="add-observations" data-kind="${kind}" ${s.locked?'disabled':''}>Record measurements</button><button class="quiet" data-action="undo-observation" data-kind="${kind}" ${s.locked||!s.observations.length?'disabled':''}>Undo last</button></div>
      <div class="stats-line training-stats"><span><strong>${s.observations.length}</strong> measurements</span><span>Mean reading <strong>${s.observations.length?number(M.mean(s.observations)):'—'}</strong></span><span>${s.observations.length?'Range of readings '+Math.min(...s.observations)+'–'+Math.max(...s.observations):'No observations yet'}</span></div>
      <div class="observation-list" aria-label="Most recent measurements">${s.observations.slice(-20).map(x=>`<span>${x}</span>`).join('')}</div>
      <details><summary>Frequency table for your measurements</summary><div id="${kind}-frequency-table">${frequencyTable(s.observations)}</div></details>
      <div class="phase-title"><span>Model</span><h3>Make your own plots and functions</h3></div><p>Sketch the empirical mass function and CDF before opening the computed comparison. Label both axes. Choose the mass-function scale before drawing; the CDF runs from 0 to 1 and has steps.</p>
      <div class="notebook"><div class="sketch-pair">${['pmf','cdf'].map(type=>`<div class="sketch-panel"><h3>${type==='pmf'?'Your estimated mass function p̂ᵧ(y)':'Your empirical CDF F̂ᵧ(x)'}</h3>${type==='pmf'?`<label class="scale-label">Vertical axis maximum <select data-scale="${kind}">${[.2,.3,.5,1].map(v=>`<option value="${v}" ${s.pmfMax===v?'selected':''}>${v}</option>`).join('')}</select></label>`:'<p class="scale-label">Vertical axis maximum: 1</p>'}<canvas id="${kind}-${type}-sketch" class="sketch" width="780" height="480" aria-label="Drawing grid for your ${type==='pmf'?'mass function':'CDF'}. A text alternative follows."></canvas><div class="sketch-tools"><span>Draw with a pointer or touch.</span><button class="quiet small" data-action="clear-sketch" data-kind="${kind}" data-type="${type}">Clear drawing</button></div></div>`).join('')}</div>
      <div class="function-pair"><label>Write p̂ᵧ(y), your estimated mass function<textarea data-lab-field="function-pmf" data-kind="${kind}" rows="4" placeholder="Define the function from your counts. State the domain.">${esc(s.functions.pmf)}</textarea></label><label>Write F̂ᵧ(x), your empirical CDF<textarea data-lab-field="function-cdf" data-kind="${kind}" rows="4" placeholder="Write how the mass accumulates up to x.">${esc(s.functions.cdf)}</textarea></label></div>
      <label class="field-label">Describe your plots, or use this as an alternative to drawing<textarea data-lab-field="description" data-kind="${kind}" rows="3" placeholder="State the axes, shape, any peaks or gaps, and CDF steps.">${esc(s.description)}</textarea></label></div>
      <details><summary>Formula hints</summary><p>p̂ᵧ(y) = n(y)/N. F̂ᵧ(x) = (number of readings at or below x)/N. For integer readings, P̂(a ≤ Y ≤ b) = F̂ᵧ(b) − F̂ᵧ(a − 1).</p><p>These describe the observed variable Y. If you use them to predict the true total S, write down what you assume about measurement error.</p></details>
      <button class="secondary" data-action="toggle-computed" data-kind="${kind}" ${!s.observations.length?'disabled':''}>${s.showComputed?'Hide computed comparison':'Compare with computed plots'}</button><div id="${kind}-computed" ${s.showComputed?'':'hidden'}>${computedPlots(kind)}</div>
      <div class="phase-title"><span>Predict</span><h3>Choose intervals before the next ten rolls</h3></div><p>The opaque cup holds a fresh roll of these same three dice. Use your fuzzy observations to estimate the chance that its true total falls in each chosen interval. Endpoints are included.</p>
      <div class="table-scroll"><table class="prediction-table"><thead><tr><th>Event</th><th>From a</th><th>To b</th><th>Predicted probability q</th><th>Expected in 10</th></tr></thead><tbody>${s.intervals.map((r,i)=>`<tr><td>${i+1}</td><td><input aria-label="Interval ${i+1} start for ${c.name}" data-interval="${i}" data-property="a" data-kind="${kind}" type="number" min="${c.min}" max="${c.max}" value="${r.a}" ${s.locked?'disabled':''}></td><td><input aria-label="Interval ${i+1} end for ${c.name}" data-interval="${i}" data-property="b" data-kind="${kind}" type="number" min="${c.min}" max="${c.max}" value="${r.b}" ${s.locked?'disabled':''}></td><td><input class="probability-input" aria-label="Interval ${i+1} probability for ${c.name}" data-interval="${i}" data-property="q" data-kind="${kind}" type="number" min="0" max="1" step="0.001" placeholder="0 to 1" value="${esc(r.q)}" ${s.locked?'disabled':''}></td><td class="number" id="${kind}-expected-${i}">${r.q!==''&&Number.isFinite(Number(r.q))?number(10*Number(r.q)):'—'}</td></tr>`).join('')}</tbody></table></div>
      <p class="chart-caption">Choose intervals within ${c.min}–${c.max}. They may overlap. Probabilities only need to sum to 1 when the events form a complete, non-overlapping partition.</p>
      <button class="quiet" data-action="estimate-probabilities" data-kind="${kind}" ${s.locked||!s.observations.length?'disabled':''}>Calculate interval frequencies from my data</button>
      <label class="field-label">Explain how your model makes these predictions<textarea data-lab-field="reasoning" data-kind="${kind}" rows="3" ${s.locked?'disabled':''} placeholder="Show the frequency or CDF calculation. Explain the assumption connecting fuzzy readings to true totals.">${esc(s.reasoning)}</textarea></label>
      <div class="controls"><button data-action="lock" data-kind="${kind}" ${s.locked?'disabled':''}>${s.locked?'Predictions locked':'Lock predictions for ten new rolls'}</button></div>
      <div class="phase-title"><span>Test</span><h3>Ten opaque-cup validation rolls</h3></div><p>Check outcomes only after predictions are locked. Enter the revealed <strong>true totals</strong>, not more fuzzy estimates. Keep these ten results separate from your training data.</p>
      <div class="validation-progress" aria-label="${s.validation.length} of ten validation rolls complete">${Array.from({length:10},(_,i)=>`<span class="${i<s.validation.length?'done':''}"></span>`).join('')}</div>
      <div class="validation-controls">${s.mode==='simulation'?`<div class="controls"><button data-action="opaque-roll" data-kind="${kind}" ${!s.locked||s.validation.length===10?'disabled':''}>Roll under opaque cup</button><button class="secondary" data-action="opaque-reveal" data-kind="${kind}" disabled>Reveal and record</button><span id="${kind}-opaque-status" class="chart-caption">${s.validation.length} of 10 recorded</span></div>`:`<div class="data-entry"><label for="${kind}-validation">Revealed totals from fresh physical rolls<input id="${kind}-validation" inputmode="numeric" placeholder="Enter up to ${10-s.validation.length} totals" ${!s.locked||s.validation.length===10?'disabled':''}></label><button data-action="add-validation" data-kind="${kind}" ${!s.locked||s.validation.length===10?'disabled':''}>Record validation totals</button></div>`}</div>
      <div id="${kind}-results">${resultsHTML(kind)}</div>
      <label class="field-label">What did your test show?<textarea data-lab-field="reflection" data-kind="${kind}" rows="4" placeholder="Compare expected and observed counts. Consider sampling variation, measurement error, sample size and whether the dice process changed.">${esc(s.reflection)}</textarea></label>
      <div id="${kind}-message" class="lab-message" role="status" aria-live="polite"></div>`;
  }
  function frequencyTable(values){
    if(!values.length)return '<p>No readings recorded.</p>';
    const e=M.empirical(values);return `<div class="table-scroll"><table><thead><tr><th>Reading y</th><th>Count n(y)</th><th>Relative frequency p̂ᵧ(y)</th><th>Cumulative F̂ᵧ(y)</th></tr></thead><tbody>${[...e.counts].sort((a,b)=>a[0]-b[0]).map(([y,n])=>`<tr><td>${y}</td><td>${n}</td><td>${n}/${e.n} = ${number(n/e.n)}</td><td>${number(M.cdf(e.pmf,y))}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function computedPlots(kind){
    const s=notebook.labs[kind];if(!s.observations.length)return '';
    const e=M.empirical(s.observations),min=Math.min(cfg[kind].min,...s.observations),max=Math.max(cfg[kind].max,...s.observations);
    return `<div class="chart-pair"><figure><figcaption>Computed empirical mass function of Y</figcaption>${chart(e.pmf,{min,max,title:'Empirical mass function of fuzzy measurements'})}</figure><figure><figcaption>Computed empirical CDF of Y</figcaption>${chart(e.pmf,{min:min-1,max:max+1,title:'Empirical CDF of fuzzy measurements',cdf:true})}</figure></div><p class="chart-caption">This checks your calculation, not the hidden true distribution. Compare with your own drawing and function.</p>`;
  }
  function resultsHTML(kind){
    const s=notebook.labs[kind];if(!s.locked)return '<p class="result-empty">Collect observations, construct your model and lock your predictions first.</p>';
    const n=s.validation.length;if(!n)return '<p class="result-empty">Your predictions are fixed. Roll and check ten new outcomes.</p>';
    return `<p class="${n===10?'completed':'chart-caption'}">${n===10?'All ten validation rolls complete.':`${n} of 10 validation rolls recorded.`} True totals: ${s.validation.join(', ')}.</p><div class="table-scroll"><table><thead><tr><th>Locked event</th><th>q</th><th>Expected in ${n}</th><th>Observed in ${n}</th><th>Observed proportion</th></tr></thead><tbody>${s.locked.intervals.map(r=>{const count=s.validation.filter(x=>x>=r.a&&x<=r.b).length;return `<tr><td>${r.a} ≤ S ≤ ${r.b}</td><td>${number(r.q)}</td><td>${number(n*r.q)}</td><td>${count}</td><td>${number(count/n)}</td></tr>`;}).join('')}</tbody></table></div>
      ${n===10?`<h3>How much variation can ten rolls produce?</h3><p>Even a correct fixed probability does not predict an exact count. Under independent trials with event probability q, K follows a binomial distribution with n = 10. This reference treats your estimated q as fixed; it omits uncertainty in that estimate and in the measurement process.</p><label>Inspect event <select data-binomial="${kind}">${s.locked.intervals.map((r,i)=>`<option value="${i}">${r.a} ≤ S ≤ ${r.b}</option>`).join('')}</select></label><div id="${kind}-binomial" class="chart">${binomialChart(kind,0)}</div><p class="chart-caption">Orange marks the observed count. Ten trials are a small test; a mismatch alone does not identify its cause.</p>`:''}`;
  }
  function binomialChart(kind,i){const s=notebook.labs[kind],r=s.locked.intervals[i],k=s.validation.filter(x=>x>=r.a&&x<=r.b).length;return chart(new Map(M.binomial(10,r.q).map((p,k)=>[k,p])),{min:0,max:10,title:`Binomial reference for ten rolls with probability ${r.q}. Observed count ${k} is highlighted.`,observed:k});}
  function mountLab(kind){
    $(`#${kind}-workspace`).innerHTML=labHTML(kind);
    for(const type of ['pmf','cdf'])setupSketch(kind,type);
    if(notebook.labs[kind].mode==='simulation')drawSensor(kind);
    $(`#${kind}-mode`).onchange=e=>{notebook.labs[kind].mode=e.target.value;save();mountLab(kind);};
  }

  function drawSensor(kind){
    const canvas=$(`#${kind}-sensor`);if(!canvas)return;const ctx=canvas.getContext('2d'),y=notebook.labs[kind].lastReading;
    ctx.clearRect(0,0,360,310);ctx.fillStyle='#f2f6f8';ctx.fillRect(0,0,360,310);
    ctx.fillStyle='#dce9ef';ctx.beginPath();ctx.moveTo(90,35);ctx.lineTo(270,35);ctx.lineTo(310,270);ctx.lineTo(50,270);ctx.closePath();ctx.fill();ctx.strokeStyle='#b6cbd6';ctx.lineWidth=3;ctx.stroke();
    ctx.save();ctx.filter='blur(8px)';ctx.fillStyle='#627e8b';ctx.font='70px Georgia';ctx.textAlign='center';ctx.fillText(y===null?'?':String(y),180,185);ctx.restore();
    ctx.strokeStyle='#ffffffaa';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(108,50);ctx.lineTo(80,245);ctx.stroke();
  }
  function setupSketch(kind,type){
    const canvas=$(`#${kind}-${type}-sketch`),ctx=canvas.getContext('2d');let drawing=false,stroke;
    const redraw=()=>{
      const {width:w,height:h}=canvas,L=65,R=20,T=30,B=55;ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
      ctx.lineWidth=1;ctx.strokeStyle='#e1e9ed';
      for(let i=0;i<=10;i++){let x=L+i*(w-L-R)/10,y=T+i*(h-T-B)/10;ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,h-B);ctx.stroke();ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke();}
      ctx.strokeStyle='#677e8a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,h-B);ctx.lineTo(w-R,h-B);ctx.stroke();
      ctx.fillStyle='#52636b';ctx.font='20px system-ui';ctx.textAlign='right';const top=type==='pmf'?notebook.labs[kind].pmfMax:1;ctx.fillText(String(top),L-12,T+7);ctx.fillText(number(top/2),L-12,T+(h-T-B)/2+7);ctx.fillText('0',L-12,h-B+7);
      ctx.textAlign='center';ctx.fillText('Observed reading y',w/2,h-10);ctx.fillText(String(Math.min(cfg[kind].min,...notebook.labs[kind].observations)),L,h-B+30);ctx.fillText(String(Math.max(cfg[kind].max,...notebook.labs[kind].observations)),w-R,h-B+30);
      ctx.save();ctx.translate(21,h/2);ctx.rotate(-Math.PI/2);ctx.fillText(type==='pmf'?'Relative frequency':'Cumulative proportion',0,0);ctx.restore();
      ctx.strokeStyle='#185b80';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';
      for(const st of notebook.labs[kind].strokes[type]){if(!st.length)continue;ctx.beginPath();st.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p[0]*w,p[1]*h));if(st.length===1){ctx.lineTo(st[0][0]*w+.1,st[0][1]*h+.1);}ctx.stroke();}
    };
    canvas.redraw=redraw;redraw();
    const point=e=>{const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
    canvas.onpointerdown=e=>{if(e.button!==0&&e.pointerType==='mouse')return;drawing=true;canvas.setPointerCapture(e.pointerId);stroke=[point(e)];notebook.labs[kind].strokes[type].push(stroke);redraw();};
    canvas.onpointermove=e=>{if(!drawing)return;stroke.push(point(e));redraw();};
    canvas.onpointerup=canvas.onpointercancel=()=>{if(drawing){drawing=false;save();}};
  }
  function measuredRoll(kind){const truth=M.roll(cfg[kind].dice).reduce((a,b)=>a+b,0),r=Math.random(),error=r<.15?-1:r>.85?1:0;return {truth,y:Math.min(cfg[kind].max,Math.max(cfg[kind].min,truth+error))};}
  function parseNumbers(value){
    const tokens=value.trim().split(/[\s,;]+/).filter(Boolean);
    if(!tokens.length)throw new Error('Enter at least one total.');
    if(tokens.some(t=>!/^[-+]?\d+$/.test(t)))throw new Error('Use whole-number totals separated by spaces, commas or semicolons.');
    return tokens.map(Number);
  }
  function addObservations(kind,values,truths=[]){
    const s=notebook.labs[kind];if(s.locked)throw new Error('Training data are frozen for this validation run.');
    if(values.some(x=>x< -10||x>40))throw new Error('For this three-dice worksheet, enter measured totals from −10 to 40.');
    if(s.observations.length+values.length>10000)throw new Error('This notebook supports up to 10,000 training readings per experiment.');
    if(!Array.isArray(references[s.runId]))references[s.runId]=s.observations.map(y=>({y,truth:null}));
    references[s.runId].push(...values.map((y,i)=>({y,truth:Number.isInteger(truths[i])?truths[i]:null})));
    s.observations.push(...values);s.lastReading=values.at(-1);save();mountLab(kind);message(kind,`${values.length} ${values.length===1?'measurement':'measurements'} recorded. Clear reference values remain withheld.`);
  }
  function getIntervals(kind){
    const s=notebook.labs[kind],c=cfg[kind];
    const rows=s.intervals.map((r,i)=>{
      const a=Number(r.a),b=Number(r.b),q=Number(r.q);
      if(r.a===''||r.b===''||!Number.isInteger(a)||!Number.isInteger(b)||a<c.min||b>c.max||a>b)throw new Error(`Event ${i+1}: choose integer endpoints within ${c.min}–${c.max}, with the start at or below the end.`);
      if(r.q===''||!Number.isFinite(q)||q<0||q>1)throw new Error(`Event ${i+1}: enter a probability from 0 to 1.`);
      return {a,b,q};
    });
    const partition=Array.from({length:c.max-c.min+1},(_,i)=>i+c.min).every(x=>rows.filter(r=>x>=r.a&&x<=r.b).length===1);
    if(partition&&Math.abs(rows.reduce((sum,r)=>sum+r.q,0)-1)>.005)throw new Error('These intervals partition the possible true totals. Their probabilities must sum to 1 (allowing rounding).');
    for(let i=0;i<rows.length;i++)for(let j=0;j<rows.length;j++)if(i!==j&&rows[i].a>=rows[j].a&&rows[i].b<=rows[j].b&&rows[i].q>rows[j].q+.005)throw new Error('An interval contained inside another interval cannot have a larger probability.');
    return rows;
  }
  function addValidation(kind,values){
    const s=notebook.labs[kind],c=cfg[kind];if(!s.locked)throw new Error('Lock the predictions first.');
    if(values.length+s.validation.length>10)throw new Error(`Only ${10-s.validation.length} validation rolls remain.`);
    if(values.some(x=>x<c.min||x>c.max))throw new Error(`A revealed true total must be within ${c.min}–${c.max}.`);
    s.validation.push(...values);save();mountLab(kind);message(kind,s.validation.length===10?'All ten test outcomes are recorded. Compare the counts and explain any differences.':`${s.validation.length} of ten test outcomes recorded.`);
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    const kind=button.dataset.kind,s=notebook.labs[kind],action=button.dataset.action;
    try{
      if(action==='sample'){const r=measuredRoll(kind);addObservations(kind,[r.y],[r.truth]);}
      if(action==='sample-batch'){const rows=Array.from({length:20},()=>measuredRoll(kind));addObservations(kind,rows.map(r=>r.y),rows.map(r=>r.truth));}
      if(action==='add-observations')addObservations(kind,parseNumbers($(`#${kind}-observations`).value));
      if(action==='undo-observation'&&!s.locked){s.observations.pop();if(Array.isArray(references[s.runId]))references[s.runId].pop();s.lastReading=s.observations.at(-1)??null;save();mountLab(kind);}
      if(action==='clear-sketch'){s.strokes[button.dataset.type]=[];$(`#${kind}-${button.dataset.type}-sketch`).redraw();save();}
      if(action==='toggle-computed'){s.showComputed=!s.showComputed;save();const box=$(`#${kind}-computed`);box.hidden=!s.showComputed;box.innerHTML=computedPlots(kind);button.textContent=s.showComputed?'Hide computed comparison':'Compare with computed plots';}
      if(action==='estimate-probabilities'){
        const e=M.empirical(s.observations);
        s.intervals.forEach(r=>r.q=String(Math.round(M.interval(e.pmf,Number(r.a),Number(r.b))*1000)/1000));save();mountLab(kind);message(kind,'Interval frequencies calculated for the observed readings Y. Explain why they may or may not predict true totals S.');
      }
      if(action==='lock'){
        if(s.observations.length<5)throw new Error('Collect at least five observations first; aim for 30 or more in the seminar.');
        const rows=getIntervals(kind);s.locked={intervals:rows,n:s.observations.length,at:new Date().toISOString(),reasoning:s.reasoning};pending[kind]=null;save();mountLab(kind);message(kind,`Predictions locked using ${s.observations.length} training readings. Now test ten independent rolls.`);
      }
      if(action==='opaque-roll'){
        if(!s.locked||s.validation.length>=10)return;
        pending[kind]=M.roll(cfg[kind].dice).reduce((a,b)=>a+b,0);button.disabled=true;
        $(`[data-action="opaque-reveal"][data-kind="${kind}"]`).disabled=false;$(`#${kind}-opaque-status`).textContent='A fresh roll is covered. Its outcome is not yet observed.';
      }
      if(action==='opaque-reveal'){
        if(pending[kind]===null)return;const value=pending[kind];pending[kind]=null;addValidation(kind,[value]);
      }
      if(action==='add-validation')addValidation(kind,parseNumbers($(`#${kind}-validation`).value));
      if(action==='reset'){
        const reset=()=>{delete references[s.runId];notebook.labs[kind]=freshLab(kind);pending[kind]=null;save();mountLab(kind);message(kind,'A new experiment is ready.');};
        if(s.observations.length||s.locked)confirmAction('Start this experiment again? Export your notebook first if you want to keep the current data, drawings and predictions.',reset);else reset();
      }
    }catch(e){message(kind,e.message,true);}
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el.dataset.note){notebook.notes[el.dataset.note]=el.value;save();}
    if(el.dataset.labField){const s=notebook.labs[el.dataset.kind],field=el.dataset.labField;if(field.startsWith('function-'))s.functions[field.slice(9)]=el.value;else s[field]=el.value;save();}
    if(el.dataset.interval!==undefined){const s=notebook.labs[el.dataset.kind];if(s.locked)return;const r=s.intervals[Number(el.dataset.interval)];r[el.dataset.property]=el.value;if(el.dataset.property==='q')$(`#${el.dataset.kind}-expected-${el.dataset.interval}`).textContent=el.value!==''&&Number.isFinite(Number(el.value))?number(10*Number(el.value)):'—';save();}
  });
  document.addEventListener('change',event=>{const el=event.target;if(el.dataset.binomial){$(`#${el.dataset.binomial}-binomial`).innerHTML=binomialChart(el.dataset.binomial,Number(el.value));}if(el.dataset.scale){notebook.labs[el.dataset.scale].pmfMax=Number(el.value);$(`#${el.dataset.scale}-pmf-sketch`).redraw();save();}});
  $('#export-work').onclick=()=>{
    const blob=new Blob([JSON.stringify(notebook,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='probability-seminar-notebook.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Notebook exported with measurements, drawings, locked forecasts and validation outcomes.');
  };
  $('#import-work').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>15_000_000)throw new Error('This notebook file is too large.');
      const imported=loadNotebook(JSON.parse(await file.text()));
      const hasWork=Object.values(notebook.labs).some(s=>s.observations.length||s.locked)||Object.values(notebook.notes).some(Boolean);
      const apply=()=>{notebook=imported;pending.regular=pending.irregular=null;save();mountLab('regular');mountLab('irregular');restoreNotes();toast('Notebook loaded.');};
      if(hasWork)confirmAction('Replace the current browser notebook with this saved notebook? Export the current work first if you want to keep it.',apply);else apply();
    }catch(e){toast(e.message);}finally{event.target.value='';}
  };
  $('#print-work').onclick=()=>window.print();
  function restoreNotes(){$$('[data-note]').forEach(el=>el.value=notebook.notes[el.dataset.note]||'');}
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){$$('.sidebar nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));}},{rootMargin:'-10% 0px -65% 0px'});
  $$('main>section').forEach(el=>observer.observe(el));
  renderFrequency();renderSums();renderNormal();mountLab('regular');mountLab('irregular');restoreNotes();
})();
