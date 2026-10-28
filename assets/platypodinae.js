import { renderContribute } from './contribute-page.js?v=20261027-1';
import { renderCite } from './cite-page.js?v=20261027-1';
import { renderMethods } from './methods-page.js?v=20261027-1';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app = document.querySelector('#app');
const homeHTML = app.innerHTML;
const metaPromise = fetch('data/site-meta.json').then(r => {if(!r.ok) throw Error('Platypodinae metadata unavailable'); return r.json()});
const aboutPromise = fetch('data/about.json').then(r=> {if(!r.ok) throw Error('About content unavailable'); return r.json()});

async function showHome(){
 app.innerHTML=homeHTML;
 const meta=await metaPromise;
 for(const [id,k] of [['count','provisional_species_count'],['genus-count','provisional_genera_count'],['tribe-count','provisional_tribes_count']]){
   const node=app.querySelector('#'+id);
   if(node) node.textContent=String(meta[k]);
 }
}
async function showData(){
 const m=await metaPromise;
 app.innerHTML='<section class="taxonomy-banner"><div class="eyebrow">Data &amp; coverage</div><h1>Database coverage</h1><p class="subtitle">Provisional working checklist of Chinese Platypodinae. Counts represent taxonomic concepts under review, not published or validated taxon profiles.</p></section><section class="grid"><article class="card third"><div class="eyebrow">Current profiles</div><h2>'+esc(m.provisional_species_count)+'</h2><p>Provisional working species concepts; '+esc(m.published_profile_count)+' approved individual profiles published.</p></article><article class="card third"><div class="eyebrow">Genera represented</div><h2>'+esc(m.provisional_genera_count)+'</h2><p>Provisional genera represented in the working checklist.</p></article><article class="card third"><div class="eyebrow">Tribes represented</div><h2>'+esc(m.provisional_tribes_count)+'</h2><p>Provisional tribes represented in the working checklist.</p></article></section>';
}
async function showBrowse(){const r=await fetch('data/taxa.json');if(!r.ok)throw Error('Index unavailable');const taxa=await r.json();app.innerHTML='<section class="taxonomy-banner"><h1>Published provisional Platypodinae profiles</h1><p class="subtitle">'+esc(taxa.length)+' profiles; occurrence acceptance remains under review.</p></section><section class="grid"><article class="card full"><h2>Species profiles</h2><ul>'+taxa.map(t=>'<li><a href="taxa/'+encodeURIComponent(t.plt)+'/">'+esc(t.scientific_name)+' '+esc(t.authorship)+'</a> — '+esc(t.checklist_status)+'</li>').join('')+'</ul></article></section>';}
async function showAbout(){
 const a=await aboutPromise;
 const sections=(a.sections||[]).map(s=>'<article class="card full"><h2>'+esc(s.heading)+'</h2>'+(s.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+'</article>').join('');
 const refs=(a.foundational_sources||[]).map(r=>'<div class="ref"><strong>'+esc(r.label)+'</strong><br>'+esc(r.citation)+(r.doi?'<br><a href="https://doi.org/'+encodeURIComponent(r.doi)+'" target="_blank" rel="noopener">DOI: '+esc(r.doi)+'</a>':'')+'</div>').join('');
 app.innerHTML='<section class="taxonomy-banner"><div class="eyebrow">About</div><h1>'+esc(a.title)+'</h1><p class="subtitle">'+esc(a.subtitle)+'</p></section><section class="grid">'+sections+'<article class="card full"><h2>Selected foundational sources</h2>'+refs+'</article></section>';
}
async function route(){
 const path=(location.hash.slice(1)||'/').split('?')[0];
 const r=({'/':showHome,'/browse':showBrowse,'/data':showData,'/methods':()=>renderMethods(app),'/contribute':()=>renderContribute(app),'/cite':()=>renderCite(app),'/about':showAbout})[path];
 if(!r){app.innerHTML='<section class="taxonomy-banner"><h1>Page unavailable</h1><p>There is no published Platypodinae profile at this route.</p></section>';return}
 try{await r()}catch(e){console.error(e);app.innerHTML='<p class="notice">This section could not be loaded. Try refreshing this page.</p>'}
}
window.addEventListener('hashchange',route);
route();
