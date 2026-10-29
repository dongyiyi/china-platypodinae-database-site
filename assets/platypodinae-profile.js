import {sortTaxonomicHistory} from './taxonomic-history-sort.mjs';
const app=document.querySelector('#app');
const SITE_ROOT='/china-platypodinae-database-site/';
const taxonUrl=id=>SITE_ROOT+'taxa/'+encodeURIComponent(id)+'/';
async function getJSON(path){const r=await fetch(SITE_ROOT+path.replace(/^\//,''),{cache:'no-store'});if(!r.ok)throw new Error('Could not load '+path);return r.json();}
async function rankData(){return {genera:{},tribes:{}};}
function rankCN(){return '';}
function esc(s){return String(s||'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));}
function publicSourceText(text){
  return String(text||'')
    .replace(/\bCO2015\b/g,'黄复生等 (2015)')
    .replace(/\bEF1984\b/g,'殷蕙芬等 (1984)')
    .replace(/\bJ2026_\d+\b/g,'')
    .replace(/\bBackbone Taxon ID\s*\d+\b/gi,'')
    .replace(/\b(?:Imported|Current accepted) name usage\s*;?/gi,'')
    .replace(/\s+([,.;:])/g,'$1')
    .replace(/\s{2,}/g,' ')
    .trim();
}
function isHigherTaxonName(value){return /^[A-Z][A-Za-z-]*(?:aceae|idae|inae|ini)$/i.test(String(value||'').trim());}
function sci(name){
  const value=String(name||'').trim();
  if(isHigherTaxonName(value)) return esc(value);
  const lower=value.toLowerCase();
  if(lower.endsWith(' spp.')) return '<span class="scientific">'+esc(value.slice(0,-5))+'</span> spp.';
  if(lower.endsWith(' sp.')) return '<span class="scientific">'+esc(value.slice(0,-4))+'</span> sp.';
  return '<span class="scientific">'+esc(value)+'</span>';
}
function knownScientificNames(t){
  const names=new Set();
  const add=v=>{v=String(v||'').trim();if(v)names.add(v);};
  add(t.scientific_name);add(t.genus);
  (t.hosts||[]).forEach(h=>{add(h.scientific_name);add(String(h.scientific_name||'').split(' ')[0]);});
  (t.taxonomic_history||[]).forEach(x=>{add(x.name);add(String(x.name||'').split(' ')[0]);});
  return [...names].filter(Boolean).sort((a,b)=>b.length-a.length);
}
function scientificText(text,t){
  let chunks=[{text:publicSourceText(text),html:false}];
  for(const name of knownScientificNames(t)){
    const next=[];
    for(const chunk of chunks){
      if(chunk.html){next.push(chunk);continue;}
      const parts=chunk.text.split(name);
      parts.forEach((part,i)=>{if(part)next.push({text:part,html:false});if(i<parts.length-1)next.push({text:sci(name),html:true});});
    }
    chunks=next;
  }
  const genera=[...new Set([t.genus,...(t.hosts||[]).map(h=>String(h.scientific_name||'').split(' ')[0]),...(t.taxonomic_history||[]).map(x=>String(x.name||'').split(' ')[0])].filter(Boolean))];
  for(const genus of genera){
    const next=[];
    const pattern=new RegExp('\\b'+genus+'\\s+[a-z][a-z-]+\\b','g');
    for(const chunk of chunks){
      if(chunk.html){next.push(chunk);continue;}
      let last=0,m;
      while((m=pattern.exec(chunk.text))!==null){if(m.index>last)next.push({text:chunk.text.slice(last,m.index),html:false});next.push({text:sci(m[0]),html:true});last=m.index+m[0].length;}
      if(last<chunk.text.length)next.push({text:chunk.text.slice(last),html:false});
    }
    chunks=next;
  }
  return chunks.map(x=>x.html?x.text:esc(x.text)).join('');
}

function rankHTML(latin,cn,italic=false){return (italic?sci(latin):esc(latin))+(cn?' <span class="higher-taxon-cn" lang="zh-Hans">'+esc(cn)+'</span>':'');}

let backToTopScrollBound=false;
function updateBackToTop(){
  const button=document.querySelector('.back-to-top');
  if(button)button.classList.toggle('visible',window.scrollY>300);
}
function showBackToTop(targetId){
  const previous=document.querySelector('.back-to-top');
  if(previous)previous.remove();
  const button=document.createElement('button');
  button.type='button';
  button.className='back-to-top';
  button.setAttribute('aria-label','Back to top');
  button.innerHTML='<span aria-hidden="true">↑</span> Back to top';
  button.addEventListener('click',()=>{
    const top=targetId?document.getElementById(targetId):null;
    if(top)top.scrollIntoView({behavior:'smooth',block:'start'});
    else window.scrollTo({top:0,behavior:'smooth'});
  });
  document.body.appendChild(button);
  if(!backToTopScrollBound){
    window.addEventListener('scroll',updateBackToTop,{passive:true});
    backToTopScrollBound=true;
  }
  updateBackToTop();
}


async function taxon(vsn){if(!vsn){app.innerHTML='<p class="notice">Missing PLT.</p>';return;}try{const [t,taxa,names]=await Promise.all([getJSON('data/species/'+encodeURIComponent(vsn)+'.json'),getJSON('data/taxa.json'),rankData()]);const siteEntry=taxa.find(x=>x.plt===vsn);if(siteEntry?.recommended_chinese_name){t.chinese_name=siteEntry.chinese_name;t.recommended_chinese_name=siteEntry.recommended_chinese_name;t.former_chinese_names=siteEntry.former_chinese_names||[];}const idx=taxa.findIndex(x=>x.plt===vsn);t.vsn=t.plt;const prev=idx>0?taxa[idx-1]:null;const next=idx>=0&&idx<taxa.length-1?taxa[idx+1]:null;const isReviewed=String(t.review_status||'').toLowerCase()==='reviewed';const distLabel=t.distribution?.review_status==='Accepted'?'Distribution:':(isReviewed?'Current reviewed distribution:':'Distribution:');const distSummary=(t.distribution?.summary||'').trim()||'No distribution records available.';const occ=Object.entries(t.china_occurrence||{}).map(([k,v])=>'<li class="'+(v==='Present'?'present':'')+'">'+esc(k)+' — '+esc(v)+'</li>').join('');const hosts=(t.hosts||[]).map(h=>'<li>'+sci(h.scientific_name)+(h.reported_from?' ('+esc(h.reported_from)+')':'')+(h.reference_ids?.length?' <span class="host-ref-placeholder" data-refs="'+esc(h.reference_ids.join(','))+'"></span>':'')+(h.association?' — '+esc(h.association):'')+'</li>').join('');const refMap=Object.fromEntries((t.references||[]).filter(r=>r.id).map(r=>[r.id,r]));const hostNoteRefs=[...new Set([...(t.host_note_reference_ids||[]),...(t.references||[]).filter(r=>t.host_note&&(t.host_note.includes(r.label)||t.host_note.includes(String(r.label||'').slice(0,-1)+':'))).map(r=>r.id)])];const refLinks=ids=>(ids||[]).map(id=>refMap[id]).filter(Boolean).map(r=>'<button type="button" class="inline-ref ref-jump" data-ref-jump="'+esc(r.id)+'">'+esc(r.label||r.citation)+'</button>').join('; ');const distClaims=(t.distribution?.claims||[]).map(c=>'<li><strong>'+esc(c.region)+'</strong>: <span class="claim-ref-placeholder" data-refs="'+esc((c.reference_ids||[]).join(','))+'"></span>'+(c.note?' — '+scientificText(c.note,t):'')+'</li>').join('');const hist=sortTaxonomicHistory(t.taxonomic_history).map(x=>'<div class="evidence"><strong>'+esc(x.year)+' — '+esc(x.event)+'</strong><br>'+sci(x.name)+' '+esc(x.authorship||'')+'<p>'+scientificText(x.note||'',t)+'</p>'+(x.reference_ids?.length?'<p class="event-sources"><span>Source'+(x.reference_ids.length>1?'s':'')+':</span> '+refLinks(x.reference_ids)+'</p>':'')+'</div>').join('');const formerNames=Array.isArray(t.former_chinese_names)?t.former_chinese_names.filter(Boolean):[];
const statusBadges='<span class="pill">'+esc(t.checklist_status)+'</span>'+(t.review_status?'<span class="pill">'+esc(t.review_status)+'</span>':'')+(t.invasive_status==='Invasive'?'<span class="pill pill-invasive" title="Invasive species">Invasive</span>':'');
const commonNameHeader=t.recommended_chinese_name
  ?'<div class="primary-line"><span class="name-label">中文名</span><strong class="rec-name">'+esc(t.recommended_chinese_name)+'</strong>'+statusBadges+'</div>'+(formerNames.length?'<div class="former-line"><span class="former-label">曾用／其他中文名</span><span class="former-names">'+formerNames.map(esc).join('<span class="separator">·</span>')+'</span></div>':'')
  :'<div class="meta"><span>'+(t.chinese_name?esc(t.chinese_name):'Chinese name not assigned')+'</span>'+statusBadges+'</div>';
const commonNameOverview=t.recommended_chinese_name
  ?'<dt>Chinese name</dt><dd><strong>'+esc(t.recommended_chinese_name)+'</strong></dd>'+(formerNames.length?'<dt>Former / alternative names</dt><dd>'+formerNames.map(esc).join('；')+'</dd>':'')
  :'<dt>Chinese name</dt><dd>'+(t.chinese_name?esc(t.chinese_name):'Not assigned')+'</dd>';
const higherTaxonCN=(t.higher_taxon_chinese_names?.approved_for_display===true||(t.plt==='PLT_3401'&&t.higher_taxon_chinese_names?.pilot_preview_authorized===true))?t.higher_taxon_chinese_names:null;const genusCN=rankCN(names,'genera',t.genus)||String(higherTaxonCN?.genus||'').trim();const tribeCN=rankCN(names,'tribes',t.tribe)||String(higherTaxonCN?.tribe||'').trim();
const refs=(t.references||[]).map(r=>'<div class="ref"'+(r.id?' id="ref-'+esc(r.id)+'"':'')+'><strong>'+scientificText(r.citation,t)+'</strong>'+(r.role?.length?'<br><small class="ref-role">Used for: '+esc(r.role.join(', '))+'</small>':'')+(r.doi?'<br><a href="https://doi.org/'+esc(r.doi)+'" target="_blank" rel="noopener">DOI: '+esc(r.doi)+'</a>':'')+'</div>').join('');app.innerHTML='<section class="taxonomy-banner" id="profile-top"><div class="eyebrow taxon-breadcrumb"><a href="'+SITE_ROOT+'#/browse?subfamily='+encodeURIComponent(t.subfamily)+'">'+esc(t.subfamily)+'</a><span>·</span><a href="'+SITE_ROOT+'#/browse?tribe='+encodeURIComponent(t.tribe)+'">'+esc(t.tribe)+'</a><span>·</span><span>'+esc(t.plt)+'</span></div><h1>'+sci(t.scientific_name)+' '+esc(t.authorship)+'</h1>'+commonNameHeader+'</section><div class="profile-layout"><aside class="profile-sidebar"><div class="sidebar-title">On this page</div><button data-jump="overview">Overview</button><button data-jump="distribution">Distribution</button><button data-jump="hosts">Hosts</button><button data-jump="taxonomy">Taxonomy & nomenclature</button><button data-jump="resources">Data resources</button><button data-jump="review">Review</button><button data-jump="references">References</button><a class="sidebar-issue" target="_blank" rel="noopener" href="https://github.com/dongyiyi/china-platypodinae-database-site/issues/new?title='+encodeURIComponent('Record issue: '+t.plt+' — '+t.scientific_name)+'&body='+encodeURIComponent('Taxon: '+t.plt+' — '+t.scientific_name+'\n\nPlease describe the issue, missing source, or suggested correction:\n')+'">Report an issue with this record</a></aside><section class="grid profile-content"><article class="card" id="overview"><h2>At a glance</h2><dl class="kv"><dt>Accepted name</dt><dd>'+sci(t.scientific_name)+' '+esc(t.authorship)+'</dd>'+commonNameOverview+'<dt>Subfamily</dt><dd>'+esc(t.subfamily)+'</dd>'+'<dt>Genus</dt><dd>'+rankHTML(t.genus,genusCN,true)+'</dd>'+'<dt>Tribe</dt><dd>'+esc(t.tribe)+(tribeCN?' <span class="higher-taxon-cn" lang="zh-Hans">'+esc(tribeCN)+'</span>':'')+'</dd></dl></article><article class="card"><h2>China occurrence</h2><ul class="status-list">'+occ+'</ul></article><article class="card full" id="distribution"><h2>Distribution</h2><p><strong>'+esc(distLabel)+'</strong> '+(distClaims?'':esc(distSummary))+'</p>'+(t.distribution?.narrative?'<p>'+scientificText(t.distribution.narrative,t)+'</p>':'')+(distClaims?'<ul class="evidence-claims">'+distClaims+'</ul>':'')+(t.distribution?.reference_ids?.length&&!distClaims?'<p class="event-sources"><span>Source:</span> '+refLinks(t.distribution.reference_ids)+'</p>':'')+'</article><article class="card full" id="hosts"><h2>Hosts</h2><ul>'+hosts+'</ul><p>'+scientificText(t.host_note,t)+(hostNoteRefs.length?' <span class="note-sources">'+refLinks(hostNoteRefs)+'</span>':'')+'</p>'+(Array.isArray(t.hosts)&&t.hosts.some(h=>h.reference_ids?.length)&&!t.hosts.every(h=>h.reference_ids?.length)?'<p class="event-sources"><span>Sources:</span> '+refLinks([...new Set(t.hosts.flatMap(h=>h.reference_ids||[]))])+'</p>':'')+(Array.isArray(t.hosts)&&t.hosts.some(h=>h.name_reference_ids?.length)?'<p class="event-sources"><span>Host-name source:</span> '+refLinks([...new Set(t.hosts.flatMap(h=>h.name_reference_ids||[]))])+'</p>':'')+'</article><article class="card full" id="taxonomy"><h2>Taxonomy and nomenclature</h2><p>'+scientificText(t.taxonomy_summary,t)+'</p>'+(t.taxonomy_reference_ids?.length?'<p class="taxonomy-sources"><strong>Taxonomic sources:</strong> '+refLinks(t.taxonomy_reference_ids)+'</p>':'')+hist+'<p class="notice">'+scientificText(t.nomenclature_note,t)+(t.nomenclature_note_reference_ids?.length?'<br><span class="note-sources">Sources: '+refLinks(t.nomenclature_note_reference_ids)+'</span>':'')+'</p></article><article class="card full" id="resources"><details class="resource-disclosure"><summary><span><strong>Data resources</strong><small>Images, specimens, molecular data, and symbionts</small></span></summary><div class="resource-body"><p class="resource-note">These resource categories are being integrated progressively. Select a category to view the records currently linked to this taxon.</p><div class="resource-tabs" role="tablist" aria-label="Data resource categories"><button type="button" class="resource-tab" data-resource="images" role="tab" aria-selected="false">Images</button><button type="button" class="resource-tab" data-resource="specimens" role="tab" aria-selected="false">Specimens</button><button type="button" class="resource-tab" data-resource="molecular" role="tab" aria-selected="false">Molecular data</button><button type="button" class="resource-tab" data-resource="symbionts" role="tab" aria-selected="false">Symbionts</button></div><div class="resource-panel" aria-live="polite"><span class="resource-placeholder">Select a resource category.</span></div></div></details></article><article class="card full" id="review"><h2>Review status</h2><dl class="kv"><dt>Last reviewed</dt><dd>'+esc(t.provenance?.last_reviewed||'In review')+'</dd></dl><p class="review-note">This date records the most recent content review for this taxon. It is not a page-view timestamp.</p></article><article class="card full" id="references"><h2>References</h2>'+refs+'</article><nav class="profile-pager" aria-label="Taxon navigation"><a class="pager-button'+(!prev?' disabled':'')+'" '+(prev?'href="'+SITE_ROOT+'taxa/'+encodeURIComponent(prev.plt)+'/"':'aria-disabled="true"')+'>&larr; Previous taxon</a><a class="pager-button" href="'+SITE_ROOT+'#/browse">Back to browse</a><a class="pager-button'+(!next?' disabled':'')+'" '+(next?'href="'+SITE_ROOT+'taxa/'+encodeURIComponent(next.plt)+'/"':'aria-disabled="true"')+'>Next taxon &rarr;</a></nav></section></div>';document.querySelectorAll('.profile-sidebar [data-jump]').forEach(btn=>btn.addEventListener('click',()=>{const el=document.getElementById(btn.dataset.jump);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}));showBackToTop('profile-top');document.querySelectorAll('.host-ref-placeholder,.claim-ref-placeholder').forEach(el=>{el.innerHTML=refLinks((el.dataset.refs||'').split(',').filter(Boolean));});document.querySelectorAll('.ref-jump').forEach(btn=>btn.addEventListener('click',()=>{const el=document.getElementById('ref-'+btn.dataset.refJump);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});}));const resourceValues={images:t.resources?.images||'No image records are linked yet.',specimens:t.resources?.specimens||'No specimen records are linked yet.',molecular:t.resources?.molecular||'No molecular records are linked yet.',symbionts:t.resources?.symbionts||'No symbiont-association records are linked yet.'};const resourcePanel=document.querySelector('.resource-panel');document.querySelectorAll('.resource-tab').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.resource-tab').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-selected','false');});btn.classList.add('active');btn.setAttribute('aria-selected','true');resourcePanel.innerHTML='<p>'+scientificText(resourceValues[btn.dataset.resource],t)+'</p>';}));}catch(e){app.innerHTML='<p class="notice">Profile not found for <code>'+esc(vsn)+'</code>.</p>';}}

const hit=location.pathname.match(/\/taxa\/(PLT_\d{6})\/?$/);
if(hit) taxon(hit[1]); else app.innerHTML='<p class="notice">Invalid Platypodinae profile URL.</p>';

// Common footer for all permanent species profiles, using the shared site template.
const commonFooter="<footer class=\"site-footer\"><div class=\"footer-left\">Website designed and developed by Yiyi Dong. Platypodinae remains provisionally scoped pending scientific QA.</div><div class=\"footer-meta\"><div>Feedback and corrections welcome. · Last updated: 28 October 2026</div><div>Taxonomic content maintained by Yiyi Dong.</div></div></footer>";
const profileFooter=document.querySelector('footer.site-footer');
if(profileFooter)profileFooter.outerHTML=commonFooter;
