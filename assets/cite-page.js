const DATABASE_URL='https://dongyiyi.github.io/china-platypodinae-database-site/';

export function renderCite(app){
  app.innerHTML=`
<section class="taxonomy-banner">
  <div class="eyebrow">Citation</div>
  <h1>Cite this resource</h1>
  <p class="subtitle">Guidance for citing the database, individual taxon profiles, and the underlying published evidence.</p>
</section>
<section class="grid cite-page">
  <article class="card full">
    <h2>How to cite this database</h2>
    <div class="citation-box"><strong>Dong, Y. 2026.</strong> <em>China Platypodinae Database.</em> <a href="${DATABASE_URL}" target="_blank" rel="noopener">${DATABASE_URL}</a>. Accessed [date].</div>
  </article>

  <article class="card full">
    <h2>What should I cite?</h2>
    <div class="citation-guide">
      <div><h3>Database or checklist use</h3><p>If you use the database as a compiled checklist, structured dataset, or general taxonomic resource, cite the database.</p></div>
      <div><h3>Individual taxon profile</h3><p>Once a taxon profile has been approved and published, cite the database together with its stable PLT and permanent profile URL.</p></div>
      <div><h3>Specific evidence</h3><p>If you use a particular taxonomic, nomenclatural, distribution, host, or occurrence statement, cite the database together with the underlying original source or sources listed in that profile.</p></div>
    </div>
  </article>

  <article class="card full">
    <h2>Citing an individual taxon profile</h2>
    <p>Future published taxon profiles will be anchored to stable <strong>PLT identifiers</strong>. No individual PLT profiles have been released yet; when available, these IDs will remain persistent even if taxonomic interpretations change.</p>
    <p>After the profile is published, a profile citation should include the database citation, its PLT, the verified profile URL, and the access date.</p>
    <div class="citation-example"><strong>Example format</strong><br>Dong, Y. 2026. <em>China Platypodinae Database.</em> Taxon profile: PLT_XXXX. [profile URL]. Accessed [date].</div>
  </article>

  <article class="card full">
    <h2>Source attribution</h2>
    <p>This database is a curated synthesis of published evidence and does not replace the original literature. Once published, individual taxon profiles will retain references for taxonomic acts, nomenclatural history, distribution records, host records, and other source-backed statements.</p>
    <p>When a scientific conclusion or factual statement depends on a particular publication, cite that original publication in addition to the database. This preserves attribution to the authors who generated or published the underlying evidence and allows readers to verify the source directly.</p>
  </article>
</section>`;
}

