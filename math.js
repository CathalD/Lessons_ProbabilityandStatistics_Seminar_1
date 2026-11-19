(function (root) {
  'use strict';
  function distribution(dice) {
    let counts = new Map([[0, 1]]), outcomes = 1;
    for (const faces of dice) {
      const next = new Map();
      for (const [sum, n] of counts) for (const face of faces) next.set(sum + face, (next.get(sum + face) || 0) + n);
      counts = next; outcomes *= faces.length;
    }
    return { counts, outcomes, pmf: new Map([...counts].sort((a,b) => a[0]-b[0]).map(([x,n]) => [x,n/outcomes])) };
  }
  function empirical(values) {
    const counts = new Map();
    for (const y of values) counts.set(y, (counts.get(y) || 0) + 1);
    return { counts, n: values.length, pmf: new Map([...counts].sort((a,b) => a[0]-b[0]).map(([x,n]) => [x,n / values.length])) };
  }
  const cdf = (pmf, x) => [...pmf].reduce((s,[k,p]) => s + (k <= x ? p : 0), 0);
  const interval = (pmf, a, b) => [...pmf].reduce((s,[k,p]) => s + (a <= k && k <= b ? p : 0), 0);
  function binomial(n, p) {
    if (!(p>=0 && p<=1) || !Number.isInteger(n) || n<0) throw new Error('Invalid binomial parameters');
    const result = [];
    for (let k=0;k<=n;k++) {
      let choose=1;for(let i=1;i<=k;i++)choose=choose*(n-i+1)/i;
      result.push(choose * p**k * (1-p)**(n-k));
    }
    return result;
  }
  const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
  const roll = (dice, random=Math.random) => dice.map(f => f[Math.floor(random()*f.length)]);
  function erf(x) {
    const sign = x<0?-1:1, a=Math.abs(x), t=1/(1+.3275911*a);
    return sign*(1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-a*a));
  }
  const normalCDF=(x,mu=0,sigma=1) => .5*(1+erf((x-mu)/(sigma*Math.SQRT2)));
  const normalPDF=(x,mu=0,sigma=1) => Math.exp(-.5*((x-mu)/sigma)**2)/(sigma*Math.sqrt(2*Math.PI));
  const api = { distribution, empirical, cdf, interval, binomial, mean, roll, normalCDF, normalPDF };
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.ProbabilityMath=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
