(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./math.js'):root.ProbabilityMath;
  const die=[1,2,3,4,5,6],low=[0,0,1,1,2,2],high=[7,7,8,8,9,9];
  const sum=a=>a.reduce((s,x)=>s+x,0);
  const mean=a=>a.length?sum(a)/a.length:null;
  const variance=a=>a.length>1?sum(a.map(x=>(x-mean(a))**2))/(a.length-1):null;
  function covariance(rows){if(rows.length<2)return null;const x=mean(rows.map(r=>r.x)),y=mean(rows.map(r=>r.y));return sum(rows.map(r=>(r.x-x)*(r.y-y)))/(rows.length-1);}
  function correlation(rows){const v=variance(rows.map(r=>r.x)),w=variance(rows.map(r=>r.y));return v>0&&w>0?covariance(rows)/Math.sqrt(v*w):null;}
  const noise=[[-1,.15],[0,.7],[1,.15]];
  function measured(pmf,{min=-Infinity,max=Infinity,noisy=true}={}){
    const out=new Map();for(const [x,p] of pmf)for(const [e,q] of noisy?noise:[[0,1]]){const y=Math.max(min,Math.min(max,x+e));out.set(y,(out.get(y)||0)+p*q);}return new Map([...out].sort((a,b)=>a[0]-b[0]));
  }
  function sampleDie(f=die,rng=Math.random){return f[Math.floor(rng()*f.length)];}
  function read(truth,noisy=true,rng=Math.random){const r=rng();return truth+(noisy?(r<.15?-1:r<.85?0:1):0);}
  function trial(kind,noisy=true,rng=Math.random){
    let x,y,k=null,truths=null;
    if(kind==='random'){k=1+Math.floor(rng()*3);x=k;y=sum(Array.from({length:k},()=>sampleDie(die,rng)));return {x,y:read(y,noisy,rng),truth:y,k};}
    if(kind==='independent'){x=sampleDie(die,rng)+sampleDie(die,rng);y=sampleDie(die,rng)+sampleDie(die,rng);}
    if(kind==='shared'){const c=sampleDie(die,rng);x=c+sampleDie(die,rng);y=c+sampleDie(die,rng);}
    if(kind==='fixed'){k=Math.floor(rng()*3);let a=[1,2],b=[5,6];if(k===2)[a,b]=[b,a];if(k===1){const i=Math.floor(rng()*2),j=Math.floor(rng()*2);[a[i],b[j]]=[b[j],a[i]];}x=sum(a);y=sum(b);}
    if(kind==='ordinary'){k=Math.floor(rng()*3);x=sampleDie(die,rng)+sampleDie(die,rng);y=sampleDie(die,rng)+sampleDie(die,rng);}
    if(kind==='types'){k=Math.floor(rng()*3);x=sum(Array.from({length:2},(_,i)=>sampleDie(i<k?high:low,rng)));y=sum(Array.from({length:2},(_,i)=>sampleDie(i<k?low:high,rng)));}
    if(kind==='spatial'){const z=Array.from({length:7},()=>sampleDie(die,rng));truths=Array.from({length:5},(_,i)=>sum(z.slice(i,i+3)));const sites=truths.map(t=>read(t,noisy,rng));return {x:sites[1],y:sites[2],truth:truths[2],truthX:truths[1],sites,truths};}
    if(!Number.isFinite(x)||!Number.isFinite(y))throw Error('Unknown experiment');
    return {x:read(x,noisy,rng),y:read(y,noisy,rng),truth:y,truthX:x,k};
  }
  function randomTheory(noisy=false){return [1,2,3].map(n=>{const p=M.distribution(Array.from({length:n},()=>die)).pmf;return noisy?measured(p):p;});}
  function marginal(pmfs){const out=new Map();for(const p of pmfs)for(const [x,q] of p)out.set(x,(out.get(x)||0)+q/pmfs.length);return new Map([...out].sort((a,b)=>a[0]-b[0]));}
  function band(x,kind){if(kind==='random')return x-1;return kind==='types'||kind==='spatial'?(x<=8?0:x<=12?1:2):(x<=5?0:x<=8?1:2);}
  const threshold=kind=>kind==='random'||kind==='types'?10:kind==='spatial'?11:9;
  function estimate(rows,kind){return {overall:rows.length?mean(rows.map(r=>+(r.y>=threshold(kind)))):null,groups:[0,1,2].map(b=>{const r=rows.filter(v=>band(v.x,kind)===b);return {n:r.length,q:r.length?mean(r.map(v=>+(v.y>=threshold(kind)))):null};})};}
  function brier(probabilities,outcomes){if(!outcomes.length||probabilities.length!==outcomes.length)return null;if(probabilities.some(q=>!Number.isFinite(q)||q<0||q>1))throw Error('Invalid probability');return mean(probabilities.map((q,i)=>(q-outcomes[i])**2));}
  function scores(validation,locked,kind){const o=validation.map(r=>+(r.y>=threshold(kind)));return {overall:brier(validation.map(()=>locked.overall),o),conditional:brier(validation.map(r=>locked.groups[band(r.x,kind)]),o)};}
  function spatialCov(h){return (35/12)*Math.max(3-Math.abs(h),0);}
  function parseRows(text,kind){const lines=text.trim().split(/\n|;/).filter(x=>x.trim());if(!lines.length)throw Error('Enter at least one row.');return lines.map(line=>{const t=line.trim().split(/[\s,]+/);const len=kind==='spatial'?5:2;if(t.length!==len||t.some(x=>!/^[-+]?\d+$/.test(x)))throw Error(`Each row needs ${len} whole numbers.`);const a=t.map(Number);if(a.some(x=>x< -10||x>40))throw Error('Observed values must be between −10 and 40.');if(kind==='random'&&![1,2,3].includes(a[0]))throw Error('The controller N must be 1, 2 or 3.');return kind==='spatial'?{x:a[1],y:a[2],sites:a}:{x:a[0],y:a[1]};});}
  const api={die,low,high,mean,variance,covariance,correlation,measured,trial,read,randomTheory,marginal,band,threshold,estimate,brier,scores,spatialCov,parseRows};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Dependence=api;
})(typeof globalThis!=='undefined'?globalThis:this);
