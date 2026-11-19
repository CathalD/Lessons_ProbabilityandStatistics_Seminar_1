(() => {
  'use strict';
  document.querySelector('#load-reference').addEventListener('click',()=>{
    const box=document.querySelector('#reference-results');box.replaceChildren();
    try{
      const book=JSON.parse(localStorage.getItem('probability-seminar-notebook-v2')||'null');
      const refs=JSON.parse(localStorage.getItem('probability-seminar-reference-v2')||'{}');
      if(!book?.labs)throw new Error('No student experiment is saved in this browser yet.');
      for(const kind of ['regular','irregular']){
        const lab=book.labs[kind],pairs=refs[lab.runId]||[];
        const title=document.createElement('h3');title.textContent=kind==='regular'?'Regular dice reference':'Irregular dice reference';box.append(title);
        const available=pairs.filter(p=>Number.isInteger(p.truth));
        if(!available.length){const p=document.createElement('p');p.textContent='No clear simulation reference is available for this run. Use the separately recorded physical reference, if any.';box.append(p);continue;}
        const status=document.createElement('p');status.textContent=lab.locked?'Forecasts have been committed.':'Students have not locked their forecasts for this run.';box.append(status);
        const table=document.createElement('table'),thead=document.createElement('thead'),tr=document.createElement('tr');
        for(const text of ['Training roll','Observed Y','Clear truth S','Error Y − S']){const th=document.createElement('th');th.textContent=text;tr.append(th);}thead.append(tr);table.append(thead);
        const tbody=document.createElement('tbody');
        pairs.forEach((p,i)=>{const row=document.createElement('tr');for(const value of [i+1,p.y,p.truth??'Not recorded',Number.isInteger(p.truth)?p.y-p.truth:'—']){const td=document.createElement('td');td.textContent=String(value);row.append(td);}tbody.append(row);});
        table.append(tbody);const scroll=document.createElement('div');scroll.className='table-scroll';scroll.append(table);box.append(scroll);
      }
    }catch(e){const p=document.createElement('p');p.textContent=e.message;box.append(p);}
  });
})();
