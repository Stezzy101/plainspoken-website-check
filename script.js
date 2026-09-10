const form = document.getElementById('auditForm');
const input = document.getElementById('urlInput');
const loading = document.getElementById('loading');
const results = document.getElementById('results');

let latestAudit = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = input.value.trim();

  if (!url) return;

  results.classList.add('hidden');
  loading.classList.remove('hidden');

  try {

    const response = await fetch('/api/analyse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        'Could not analyse this website.'
      );
    }

    latestAudit = data;

    document.getElementById('siteName').textContent =
      cleanSiteName(data.siteName || getSiteName(url));

    document.getElementById('score').textContent =
      data.score;

    const rating = getRating(data.score);

    document.getElementById('scoreRating').textContent =
      rating.label;

    document.getElementById('summaryText').textContent =
      getSummary(data.score, data.issues);

    document.getElementById('strengthsList').innerHTML =
      data.strengths
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');

    document.getElementById('issuesList').innerHTML =
      data.issues
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');

    document.getElementById('headlineAdvice').textContent =
      data.headlineAdvice;

    document.getElementById('ctaAdvice').textContent =
      data.ctaAdvice;

    document.getElementById('biggestOpportunity').textContent =
      data.opportunity;

    renderTopFixes(data.issues || []);

    renderStructure(data.structure || []);

    loading.classList.add('hidden');
    results.classList.remove('hidden');

    results.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });

  } catch (error) {

    loading.classList.add('hidden');

    alert(
      error.message ||
      'Something went wrong.'
    );
  }
});

function getRating(score) {

  if (score >= 85) {
    return {
      label:'Excellent'
    };
  }

  if (score >= 70) {
    return {
      label:'Strong'
    };
  }

  if (score >= 55) {
    return {
      label:'Needs work'
    };
  }

  return {
    label:'Unclear'
  };
}

function getSummary(score, issues = []) {

  if (score >= 85) {
    return 'A very strong foundation. The biggest gains now come from refinement rather than a complete rethink.';
  }

  if (score >= 70) {
    return 'The homepage is doing many things well, but a few clarity improvements could make the customer journey much sharper.';
  }

  if (score >= 55) {
    return 'There is a workable foundation, but visitors may still need to think too hard about what the business offers or what to do next.';
  }

  return 'The homepage needs a clearer message, stronger structure and a more obvious next step for visitors.';
}

function renderTopFixes(issues) {

  const container =
    document.getElementById('topFixes');

  const topThree =
    issues.slice(0,3);

  if (!topThree.length) {
    container.innerHTML =
      `<div class="fix">
        <span class="fix-number">01</span>
        <p>
          Keep refining clarity and specificity.
        </p>
      </div>`;

    return;
  }

  container.innerHTML =
    topThree
      .map((item,index) => `
        <div class="fix">

          <span class="fix-number">
            ${String(index + 1).padStart(2,'0')}
          </span>

          <p>
            ${escapeHtml(item)}
          </p>

        </div>
      `)
      .join('');
}

function renderStructure(structure) {

  const container =
    document.getElementById('structure');

  container.innerHTML =
    structure
      .map((item,index) => `
        <div class="step">

          <div class="step-num">
            ${String(index + 1).padStart(2,'0')}
          </div>

          <h4>
            ${escapeHtml(item.title)}
          </h4>

          <p>
            ${escapeHtml(item.description)}
          </p>

        </div>
      `)
      .join('');
}

function cleanSiteName(name) {

  if (!name) return 'Website';

  let cleaned =
    String(name)
      .replace(/\s*[|–—-]\s*.+$/,'')
      .trim();

  if (cleaned.length > 45) {
    cleaned =
      cleaned.slice(0,45) + '…';
  }

  return cleaned;
}

function getSiteName(url) {

  try {

    const normalised =
      url.startsWith('http')
        ? url
        : 'https://' + url;

    return new URL(normalised)
      .hostname
      .replace('www.','');

  } catch {

    return 'Website';
  }
}

function escapeHtml(text) {

  return String(text ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

document
  .getElementById('resetBtn')
  .addEventListener('click', () => {

    results.classList.add('hidden');

    input.value = '';

    latestAudit = null;

    window.scrollTo({
      top:0,
      behavior:'smooth'
    });
  });

document
  .getElementById('copyBtn')
  .addEventListener('click', async () => {

    if (!latestAudit) return;

    const site =
      document.getElementById('siteName').textContent;

    const score =
      latestAudit.score;

    const rating =
      getRating(score).label;

    const summary =
      getSummary(score, latestAudit.issues);

    const strengths =
      latestAudit.strengths
        .map(item => `• ${item}`)
        .join('\n');

    const issues =
      latestAudit.issues
        .map(item => `• ${item}`)
        .join('\n');

    const text = `
PLAIN SPOKEN WEBSITE REVIEW

${site}

CLARITY SCORE
${score}/100 — ${rating}

QUICK READ
${summary}

WHAT'S WORKING
${strengths}

TOP FIXES
${issues}

MAIN HEADING
${latestAudit.headlineAdvice}

PRIMARY ACTION
${latestAudit.ctaAdvice}

BIGGEST OPPORTUNITY
${latestAudit.opportunity}

PLAIN SPOKEN
Clear websites for small businesses.
    `.trim();

    try {

      await navigator.clipboard
        .writeText(text);

      const button =
        document.getElementById('copyBtn');

      const old =
        button.textContent;

      button.textContent =
        'Audit copied';

      setTimeout(() => {
        button.textContent = old;
      },1400);

    } catch {

      alert(
        'Could not copy the audit.'
      );
    }
  });

document
  .getElementById('conceptBtn')
  .addEventListener('click', () => {

    if (!latestAudit) return;

    const business =
      document.getElementById('siteName').textContent;

    const headline =
      createConceptHeadline(
        business,
        latestAudit
      );

    const cta =
      createConceptCTA(
        latestAudit
      );

    const sections = [
      {
        label:'Hero',
        title:headline,
        copy:
          'A short supporting sentence should immediately explain what the business offers, who it is for and why someone should choose it.'
      },
      {
        label:'Primary action',
        title:cta,
        copy:
          'Make this the most obvious next step on the page and repeat it throughout the homepage.'
      },
      {
        label:'Services',
        title:'Make the offer easy to understand.',
        copy:
          'Show the main services or products in simple language so visitors can quickly find what they need.'
      },
      {
        label:'Proof',
        title:'Give people a reason to trust you.',
        copy:
          'Add reviews, results, credentials, experience or other proof close to the top of the page.'
      },
      {
        label:'About',
        title:'Explain why this business is different.',
        copy:
          'Keep this specific and human. Avoid vague claims and focus on what customers genuinely value.'
      },
      {
        label:'Final action',
        title:cta,
        copy:
          'Finish the page with one clear invitation to take the next step.'
      }
    ];

    document
      .getElementById('conceptBusinessName')
      .textContent = business;

    document
      .getElementById('previewBrand')
      .textContent = business.toUpperCase();

    document
      .getElementById('previewHeadline')
      .textContent = headline;

    document
      .getElementById('previewSubhead')
      .textContent =
        latestAudit.suggestedSubhead ||
        'A simple introduction to what this business offers, who it is for and what to do next.';

    document
      .getElementById('previewCTA')
      .textContent = cta;

    document
      .getElementById('previewFinalCTA')
      .textContent = cta;

    document
      .getElementById('previewFinalHeading')
      .textContent =
        `Ready to choose ${business}?`;

    const serviceNames =
      latestAudit.services && latestAudit.services.length
        ? latestAudit.services.slice(0, 3)
        : ['Core service', 'Popular service', 'Signature service'];

    document
      .getElementById('previewServices')
      .innerHTML =
        serviceNames
          .map((service, index) => `
            <div class="preview-service-card">

              <span>
                ${String(index + 1).padStart(2,'0')}
              </span>

              <h4>
                ${escapeHtml(service)}
              </h4>

              <p>
                Keep this description short, specific and focused on what the customer gets.
              </p>

            </div>
          `)
          .join('');

    document
      .getElementById('previewAbout')
      .textContent =
        `Use this section to explain what makes ${business} different — experience, approach, atmosphere, results or the way clients are looked after.`;

    document
      .getElementById('homepageConcept')
      .classList.remove('hidden');

    document
      .getElementById('homepageConcept')
      .scrollIntoView({
        behavior:'smooth',
        block:'start'
      });
  });

function createConceptHeadline(
  business,
  audit
) {

  if (audit.suggestedHeadline) {
    return audit.suggestedHeadline;
  }

  return `${business} — make the value clear from the first screen.`;
}

function createConceptCTA(
  audit
) {

  if (audit.suggestedCTA) {
    return audit.suggestedCTA;
  }

  return 'Get started';
}

const desktopPreviewBtn =
  document.getElementById('desktopPreviewBtn');

const mobilePreviewBtn =
  document.getElementById('mobilePreviewBtn');

const sitePreview =
  document.querySelector('.site-preview');

desktopPreviewBtn.addEventListener('click', () => {
  sitePreview.classList.remove('mobile-mode');

  desktopPreviewBtn.classList.add('active');
  mobilePreviewBtn.classList.remove('active');
});

mobilePreviewBtn.addEventListener('click', () => {
  sitePreview.classList.add('mobile-mode');

  mobilePreviewBtn.classList.add('active');
  desktopPreviewBtn.classList.remove('active');
});


document
  .getElementById('downloadBtn')
  .addEventListener('click', () => {

    if (!latestAudit) return;

    const business =
      document.getElementById('siteName').textContent;

    const rating =
      getRating(latestAudit.score).label;

    const summary =
      getSummary(
        latestAudit.score,
        latestAudit.issues
      );

    const strengths =
      (latestAudit.strengths || [])
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('');

    const issues =
      (latestAudit.issues || [])
        .slice(0, 3)
        .map((item, index) => `
          <div class="priority">
            <span>0${index + 1}</span>
            <p>${escapeHtml(item)}</p>
          </div>
        `)
        .join('');

    const services =
      latestAudit.services &&
      latestAudit.services.length
        ? latestAudit.services.join(' · ')
        : 'Not clearly detected';

    const structure =
      (latestAudit.structure || [])
        .map((item, index) => `
          <div class="structure-item">
            <span>0${index + 1}</span>
            <div>
              <h4>${escapeHtml(item.title)}</h4>
              <p>${escapeHtml(item.description)}</p>
            </div>
          </div>
        `)
        .join('');

    const report = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<title>Plainspoken — ${escapeHtml(business)} Website Review</title>

<style>

@page{
  size:A4;
  margin:16mm;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  background:#f3efe7;
  color:#171717;
  font-family:Arial, Helvetica, sans-serif;
}

.report{
  max-width:900px;
  margin:0 auto;
  background:#f3efe7;
  padding:45px;
}

.brand{
  display:inline-block;
  border:1px solid #171717;
  padding:7px 10px;
  font-size:10px;
  font-weight:700;
  letter-spacing:.18em;
  margin-bottom:45px;
}

.eyebrow{
  font-size:10px;
  font-weight:700;
  letter-spacing:.17em;
  margin-bottom:10px;
}

.top{
  display:flex;
  justify-content:space-between;
  gap:30px;
  align-items:flex-end;
  margin-bottom:28px;
}

h1{
  font-family:Georgia, serif;
  font-size:48px;
  font-weight:normal;
  margin:0;
}

.score{
  background:#1f1f1d;
  color:white;
  min-width:210px;
  padding:20px 22px;
}

.score small{
  display:block;
  text-transform:uppercase;
  letter-spacing:.12em;
  font-size:9px;
  margin-bottom:8px;
}

.score strong{
  font-family:Georgia, serif;
  font-size:32px;
}

.score .rating{
  display:block;
  font-family:Georgia, serif;
  font-size:17px;
  margin-top:4px;
}

.quick{
  background:#a64a32;
  color:white;
  padding:30px;
  margin-bottom:18px;
}

.quick h2{
  font-family:Georgia, serif;
  font-weight:normal;
  font-size:30px;
  line-height:1.25;
  margin:8px 0 0;
}

.section{
  background:#fbfaf7;
  border:1px solid #d9d1c4;
  padding:28px;
  margin-bottom:18px;
}

.section h2{
  font-family:Georgia, serif;
  font-weight:normal;
  font-size:28px;
  margin:7px 0 22px;
}

.priority-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
}

.priority{
  border-top:1px solid #d9d1c4;
  padding-top:15px;
}

.priority span,
.structure-item > span{
  font-size:10px;
  color:#a64a32;
  font-weight:700;
}

.priority p{
  font-size:13px;
  line-height:1.55;
  margin:9px 0 0;
}

.two{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:18px;
}

ul{
  padding-left:18px;
  margin:0;
}

li{
  font-size:13px;
  line-height:1.6;
  margin-bottom:8px;
}

.direction{
  border-top:1px solid #d9d1c4;
  padding:15px 0;
}

.direction:first-of-type{
  margin-top:8px;
}

.direction small{
  font-size:9px;
  letter-spacing:.13em;
  color:#6f6b63;
  text-transform:uppercase;
}

.direction p{
  margin:7px 0 0;
  font-size:14px;
  line-height:1.5;
}

.meta{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px;
  margin-bottom:18px;
}

.meta-box{
  background:#fbfaf7;
  border:1px solid #d9d1c4;
  padding:18px;
}

.meta-box small{
  display:block;
  font-size:9px;
  letter-spacing:.12em;
  color:#6f6b63;
  margin-bottom:7px;
}

.meta-box strong{
  font-family:Georgia, serif;
  font-weight:normal;
  font-size:17px;
}

.structure-item{
  display:grid;
  grid-template-columns:35px 1fr;
  gap:10px;
  border-top:1px solid #d9d1c4;
  padding:14px 0;
}

.structure-item h4{
  font-family:Georgia, serif;
  font-size:17px;
  margin:0 0 5px;
  font-weight:normal;
}

.structure-item p{
  font-size:12px;
  line-height:1.5;
  margin:0;
  color:#5e5a53;
}

.footer{
  margin-top:35px;
  padding-top:18px;
  border-top:1px solid #d9d1c4;
  font-size:10px;
  letter-spacing:.08em;
  color:#6f6b63;
}

.print-note{
  text-align:center;
  padding:15px;
}

.print-note button{
  background:#171717;
  color:white;
  border:0;
  padding:14px 20px;
  cursor:pointer;
}

@media print{

  body{
    background:white;
  }

  .report{
    padding:0;
  }

  .print-note{
    display:none;
  }

  .section,
  .quick,
  .meta-box,
  .score{
    break-inside:avoid;
  }
}

</style>
</head>

<body>

<div class="print-note">
  <button onclick="window.print()">
    Save as PDF
  </button>
</div>

<div class="report">

  <div class="brand">
    PLAIN SPOKEN
  </div>

  <div class="top">

    <div>
      <div class="eyebrow">
        WEBSITE REVIEW
      </div>

      <h1>
        ${escapeHtml(business)}
      </h1>
    </div>

    <div class="score">

      <small>
        Clarity score
      </small>

      <strong>
        ${latestAudit.score}/100
      </strong>

      <span class="rating">
        ${escapeHtml(rating)}
      </span>

    </div>

  </div>

  <section class="quick">

    <div class="eyebrow">
      QUICK READ
    </div>

    <h2>
      ${escapeHtml(summary)}
    </h2>

  </section>

  <section class="section">

    <div class="eyebrow">
      PRIORITY
    </div>

    <h2>
      The first 3 things to fix
    </h2>

    <div class="priority-grid">
      ${issues}
    </div>

  </section>

  <div class="meta">

    <div class="meta-box">
      <small>BUSINESS TYPE</small>
      <strong>
        ${escapeHtml(latestAudit.businessType || 'Small business')}
      </strong>
    </div>

    <div class="meta-box">
      <small>LOCATION</small>
      <strong>
        ${escapeHtml(latestAudit.location || 'Not detected')}
      </strong>
    </div>

    <div class="meta-box">
      <small>KEY SERVICES</small>
      <strong>
        ${escapeHtml(services)}
      </strong>
    </div>

  </div>

  <div class="two">

    <section class="section">

      <div class="eyebrow">
        WHAT'S WORKING
      </div>

      <h2>
        Strengths
      </h2>

      <ul>
        ${strengths}
      </ul>

    </section>

    <section class="section">

      <div class="eyebrow">
        BIGGEST OPPORTUNITY
      </div>

      <h2>
        Where to start
      </h2>

      <p>
        ${escapeHtml(latestAudit.opportunity)}
      </p>

    </section>

  </div>

  <section class="section">

    <div class="eyebrow">
      PLAIN SPOKEN DIRECTION
    </div>

    <h2>
      A clearer homepage approach
    </h2>

    <div class="direction">
      <small>Suggested headline</small>

      <p>
        ${escapeHtml(
          latestAudit.suggestedHeadline ||
          latestAudit.headlineAdvice
        )}
      </p>
    </div>

    <div class="direction">
      <small>Supporting copy</small>

      <p>
        ${escapeHtml(
          latestAudit.suggestedSubhead || ''
        )}
      </p>
    </div>

    <div class="direction">
      <small>Primary action</small>

      <p>
        ${escapeHtml(
          latestAudit.suggestedCTA ||
          latestAudit.ctaAdvice
        )}
      </p>
    </div>

  </section>

  <section class="section">

    <div class="eyebrow">
      RECOMMENDED HOMEPAGE
    </div>

    <h2>
      Keep the journey simple.
    </h2>

    ${structure}

  </section>

  <div class="footer">
    PLAIN SPOKEN · CLEAR WEBSITES FOR SMALL BUSINESSES
  </div>

</div>

<script>
  setTimeout(() => {
    window.print();
  }, 500);
</script>

</body>
</html>
`;

    const win =
      window.open('', '_blank');

    if (!win) {
      alert(
        'Please allow pop-ups so Plainspoken can create your PDF.'
      );
      return;
    }

    win.document.open();
    win.document.write(report);
    win.document.close();
  });
