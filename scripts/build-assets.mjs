// Generates the static animated SVGs used by README.md.
// Run: node scripts/build-assets.mjs   (Node 18+, needs network for font subsets)
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, STACKS, fontCollector, wrap } from './lib.mjs';

const out = (p, svg) => { mkdirSync(p.split('/').slice(0, -1).join('/'), { recursive: true }); writeFileSync(p, svg); console.log('wrote', p, (svg.length / 1024).toFixed(1) + 'KB'); };

/* ------------------------------------------------------------------ headers */
const HEADERS = [
  ['about', '01', 'About'],
  ['flow', '02', 'How I build'],
  ['work', '03', 'Selected work'],
  ['toolkit', '04', 'Toolkit'],
  ['activity', '05', 'Activity'],
  ['connect', '06', 'Connect'],
];

async function header(t, num, title) {
  const f = fontCollector();
  const n = f.use('mono', num);
  const label = f.use('serif', title);
  const textW = 26 + title.length * 15; // rough serif italic advance at 38px
  const lineX = 70 + textW;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="72" viewBox="0 0 960 72" role="img" aria-label="${num} ${title}">
<style>${await f.css()}
.n{font:500 13px ${STACKS.mono};fill:${t.cyan};letter-spacing:.18em}
.t{font:italic 400 40px ${STACKS.serif};fill:${t.text}}
.dot{animation:run 5s cubic-bezier(.6,0,.4,1) infinite}
@keyframes run{0%{transform:translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateX(${(940 - lineX).toFixed(0)}px);opacity:0}}
</style>
<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${t.violet}" stop-opacity=".8"/><stop offset=".5" stop-color="${t.cyan}" stop-opacity=".45"/><stop offset="1" stop-color="${t.cyan}" stop-opacity="0"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${t.cyan}"/><stop offset="1" stop-color="${t.cyan}" stop-opacity="0"/></radialGradient></defs>
<text class="n" x="2" y="44">${n}</text>
<text class="t" x="44" y="50">${label}</text>
<rect x="${lineX.toFixed(0)}" y="38.5" width="${(940 - lineX).toFixed(0)}" height="1" fill="url(#g)"/>
<g class="dot"><circle cx="${lineX.toFixed(0)}" cy="39" r="7" fill="url(#glow)" opacity=".7"/><circle cx="${lineX.toFixed(0)}" cy="39" r="2" fill="${t.core}"/></g>
</svg>`;
}

/* ----------------------------------------------------------------- pipeline */
const STAGES = [
  ['01', 'Data', ['PDFs · databases', 'APIs · scraped docs']],
  ['02', 'Embed', ['chunking · OCR', 'embedding models']],
  ['03', 'Retrieve', ['ChromaDB vectors', 'semantic search']],
  ['04', 'Reason', ['GPT-4o · Claude', 'Gemini · prompts']],
  ['05', 'Serve', ['FastAPI · Django', 'NestJS · queues']],
  ['06', 'Ship', ['Next.js · React', 'Docker · AWS']],
];

async function pipeline(t) {
  const f = fontCollector();
  const W = 960, nodeW = 130, gap = 24, x0 = (W - (6 * nodeW + 5 * gap)) / 2, y = 78, h = 104, cy = y + h / 2;
  const kicker = f.use('mono', 'RAG TO PRODUCTION · THE PIPELINE BEHIND MY AI WEB APPS');
  const loopLabel = f.use('mono', 'evals  ·  user feedback  ·  iterate');
  let nodes = '', links = '';
  STAGES.forEach(([num, title, sub], i) => {
    const x = x0 + i * (nodeW + gap);
    const hot = i === 3;
    nodes += `<g transform="translate(${x} ${y})">
  <rect width="${nodeW}" height="${h}" rx="14" fill="${t.panel}" stroke="${hot ? 'url(#hot)' : t.line}" stroke-width="${hot ? 1.5 : 1}"/>
  ${hot ? `<rect class="pulse" x="-6" y="-6" width="${nodeW + 12}" height="${h + 12}" rx="18" fill="none" stroke="${t.violet}" stroke-width="1"/>` : ''}
  <text class="num" x="16" y="26">${f.use('mono', num)}</text>
  <text class="ttl" x="15" y="58">${f.use('serif', title)}</text>
  <text class="sub" x="16" y="78">${f.use('sans', sub[0])}</text>
  <text class="sub" x="16" y="93">${f.use('sans', sub[1])}</text>
</g>`;
    if (i < 5) {
      const ax = x + nodeW + 2, bx = x + nodeW + gap - 2;
      links += `<path id="l${i}" d="M${ax} ${cy} L${bx} ${cy}" class="flow"/>
<circle r="2.6" fill="${t.cyan}"><animateMotion dur="1.4s" begin="-${(1.4 - i * 0.28).toFixed(2)}s" repeatCount="indefinite"><mpath href="#l${i}"/></animateMotion></circle>`;
    }
  });
  const lx = x0 + 5 * (nodeW + gap) + nodeW / 2, fx = x0 + nodeW / 2, by = y + h + 2;
  const loop = `M${lx} ${by} C${lx} ${by + 92}, ${fx} ${by + 92}, ${fx} ${by}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="300" viewBox="0 0 ${W} 300" role="img" aria-label="Pipeline: data, embed, retrieve, reason, serve, ship — with an evaluation feedback loop">
<style>${await f.css()}
.k{font:500 12px ${STACKS.mono};fill:${t.muted};letter-spacing:.2em}
.num{font:500 11px ${STACKS.mono};fill:${t.cyan};letter-spacing:.12em}
.ttl{font:italic 400 30px ${STACKS.serif};fill:${t.text}}
.sub{font:400 11.5px ${STACKS.sans};fill:${t.body}}
.loopt{font:400 11.5px ${STACKS.mono};fill:${t.warm};letter-spacing:.06em}
.flow{stroke:${t.indigo};stroke-width:1.2;stroke-dasharray:3 5;fill:none;animation:dash 1s linear infinite}
.loop{stroke:url(#loopg);stroke-width:1.2;stroke-dasharray:2 6;fill:none;animation:dash 1.2s linear infinite}
@keyframes dash{to{stroke-dashoffset:-16}}
.pulse{animation:pulse 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes pulse{0%,100%{opacity:.05}50%{opacity:.55}}
</style>
<defs>
<linearGradient id="hot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.violet}"/><stop offset="1" stop-color="${t.cyan}"/></linearGradient>
<linearGradient id="loopg" x1="1" x2="0"><stop offset="0" stop-color="${t.cyan}"/><stop offset=".5" stop-color="${t.warm}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient>
<radialGradient id="bgGlow" cx=".52" cy=".45" r=".6"><stop offset="0" stop-color="${t.glow}"/><stop offset="1" stop-color="${t.bg}"/></radialGradient>
</defs>
<rect width="${W}" height="300" rx="18" fill="url(#bgGlow)"/>
<rect x=".5" y=".5" width="${W - 1}" height="299" rx="18" fill="none" stroke="${t.line}"/>
<text class="k" x="${x0}" y="46">${kicker}</text>
${links}
${nodes}
<path id="loop" d="${loop}" class="loop"/>
<circle r="3" fill="${t.warm}"><animateMotion dur="4s" repeatCount="indefinite"><mpath href="#loop"/></animateMotion></circle>
<circle r="2" fill="${t.warm}" opacity=".6"><animateMotion dur="4s" begin="2s" repeatCount="indefinite"><mpath href="#loop"/></animateMotion></circle>
<rect x="${W / 2 - 150}" y="${by + 58}" width="300" height="24" rx="12" fill="${t.bg}"/>
<text class="loopt" x="${W / 2}" y="${by + 74}" text-anchor="middle">${loopLabel}</text>
</svg>`;
}

/* -------------------------------------------------------------------- cards */
const PROJECTS = [
  { slug: 'mercury-dasha', tag: 'AI PLATFORM', live: true, title: 'Mercury Dasha',
    desc: 'Generative AI platform for text, image and video — Django microservices behind a React front end.',
    stack: ['Django', 'React', 'Microservices', 'GenAI'] },
  { slug: 'ai-travel', tag: 'AI · FULL-STACK', live: true, title: 'AI Travel Platform',
    desc: 'Travel site with a RAG chatbot that knows every destination, plus WhatsApp booking. Live in production.',
    stack: ['Next.js', 'LangChain', 'RAG', 'WhatsApp API'] },
  { slug: 'billing-rag', tag: 'RAG ASSISTANT', title: 'Billing Reports RAG',
    desc: 'Ask enterprise billing reports questions in plain English. Ingestion, vector search and GPT-4o-mini answers.',
    stack: ['FastAPI', 'LangChain', 'ChromaDB', 'Streamlit'] },
  { slug: 'kheloo', tag: 'AI SEARCH · WEB APP', title: 'Kheloo',
    desc: 'Book sports courts across Pakistan. Gemini-powered smart venue search turns plain requests into filters.',
    stack: ['Next.js 16', 'NestJS', 'Prisma', 'Gemini'] },
  { slug: 'pdf-fraud', tag: 'MACHINE LEARNING', title: 'PDF Fraud Detector',
    desc: 'Flags forged PDFs by analysing metadata, content patterns and structural anomalies, served as a batch API.',
    stack: ['FastAPI', 'scikit-learn', 'Python'] },
  { slug: 'pmo-engine', tag: 'ENTERPRISE · AWS', title: 'PMO Engine (T360)',
    desc: 'Org-wide project office platform: 27 NestJS modules, Azure AD SSO, Redis queues on AWS ECS.',
    stack: ['NestJS', 'Next.js', 'MongoDB', 'AWS'] },
];

async function card(t, p, i) {
  const f = fontCollector();
  const W = 470, H = 200;
  const lines = wrap(p.desc, 58);
  const accent = i % 2 ? t.violet : t.cyan;
  let cx = 24, chips = '';
  for (const s of p.stack) {
    const w = s.length * 7 + 20;
    chips += `<rect x="${cx}" y="${H - 44}" width="${w}" height="22" rx="11" fill="none" stroke="${t.line}"/><text class="chip" x="${cx + w / 2}" y="${H - 29}" text-anchor="middle">${f.use('mono', s)}</text>`;
    cx += w + 8;
  }
  const border = `M24 0.75 H${W - 24} A23.25 23.25 0 0 1 ${W - 0.75} 24 V${H - 24} A23.25 23.25 0 0 1 ${W - 24} ${H - 0.75} H24 A23.25 23.25 0 0 1 0.75 ${H - 24} V24 A23.25 23.25 0 0 1 24 0.75 Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${p.title}: ${p.desc}">
<style>${await f.css()}
.tag{font:500 11px ${STACKS.mono};fill:${accent};letter-spacing:.18em}
.live{font:500 11px ${STACKS.mono};fill:${t.green};letter-spacing:.14em}
.ttl{font:400 32px ${STACKS.serif};fill:${t.text}}
.d{font:400 13.5px ${STACKS.sans};fill:${t.body}}
.chip{font:400 11px ${STACKS.mono};fill:${t.chip}}
.arrow{font:400 20px ${STACKS.sans};fill:${t.muted}}
.beat{animation:beat 1.8s ease-in-out infinite}
@keyframes beat{0%,100%{opacity:1}50%{opacity:.25}}
</style>
<defs>
<radialGradient id="bg" cx="1" cy="0" r=".9"><stop offset="0" stop-color="${accent}" stop-opacity=".12"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
</defs>
<path d="${border}" fill="${t.panel}" stroke="${t.line}" stroke-width="1.5"/>
<path d="${border}" fill="url(#bg)"/>
<path id="edge" d="${border}" fill="none"/>
<g><circle r="16" fill="url(#glow)" opacity=".55"/><circle r="1.8" fill="${t.core}"/><animateMotion dur="9s" begin="${(-i * 1.4).toFixed(1)}s" repeatCount="indefinite"><mpath href="#edge"/></animateMotion></g>
<text class="tag" x="24" y="36">${f.use('mono', p.tag)}</text>
${p.live ? `<circle class="beat" cx="${W - 92}" cy="32" r="3.5" fill="${t.green}"/><text class="live" x="${W - 82}" y="36">${f.use('mono', 'LIVE')}</text>` : ''}
<text class="arrow" x="${W - 38}" y="38">${f.use('sans', '↗')}</text>
<text class="ttl" x="23" y="78">${f.use('serif', p.title)}</text>
${lines.map((l, k) => `<text class="d" x="24" y="${106 + k * 20}">${f.use('sans', l)}</text>`).join('\n')}
${chips}
</svg>`;
}

/* ------------------------------------------------------------------ toolkit */
const TOOLKIT = [
  ['AI / ML', 'cyan', ['LangChain', 'RAG pipelines', 'ChromaDB', 'GPT · Claude · Gemini', 'Sentence Transformers', 'TensorFlow', 'scikit-learn', 'Pandas · NumPy', 'OCR automation']],
  ['Backend', 'violet', ['Python', 'Django · DRF', 'FastAPI', 'NestJS', 'Node.js · Express', 'TypeScript', 'PASETO · JWT · SSO']],
  ['Frontend', 'indigo', ['Next.js', 'React', 'Tailwind CSS', 'shadcn/ui', 'Streamlit']],
  ['Data', 'warm', ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Prisma', 'Firebase']],
  ['Cloud', 'green', ['AWS · S3 · ECS', 'CloudWatch', 'DigitalOcean', 'Docker · Compose', 'Bull queues', 'Git']],
];

async function toolkit(t) {
  const f = fontCollector();
  const W = 960, colW = (W - 48) / 5, rows = Math.max(...TOOLKIT.map((c) => c[2].length));
  const H = 96 + (rows - 1) * 27 + 34;
  let cols = '';
  TOOLKIT.forEach(([name, color, items], i) => {
    const x = 24 + i * colW;
    cols += `<g transform="translate(${x} 0)">
<circle class="tw" style="animation-delay:${i * 0.4}s" cx="22" cy="46" r="4" fill="${t[color]}"/>
<text class="h" x="34" y="50">${f.use('mono', name.toUpperCase())}</text>
<rect x="18" y="66" width="${colW - 36}" height="1" fill="${t.line}"/>
${items.map((it, k) => `<text class="i" x="18" y="${96 + k * 27}">${f.use('sans', it)}</text>`).join('')}
</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Toolkit: ${TOOLKIT.map((c) => c[0] + ': ' + c[2].join(', ')).join('; ')}">
<style>${await f.css()}
.h{font:500 12px ${STACKS.mono};fill:${t.text};letter-spacing:.18em}
.i{font:400 14px ${STACKS.sans};fill:${t.body}}
.tw{animation:tw 2.4s ease-in-out infinite}
@keyframes tw{0%,100%{opacity:1}50%{opacity:.3}}
</style>
<rect width="${W}" height="${H}" rx="18" fill="${t.panel}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.line}"/>
${cols}
</svg>`;
}

/* --------------------------------------------------------------- experience */
const ROLES = [
  ['2023', 'PureLogics', 'Python Intern', 'Data science bootcamp: Pandas, NumPy, visualisation'],
  ['2024', 'InvoZone', 'Django Developer Intern', 'DRF APIs and PostgreSQL query tuning'],
  ['2024 – 25', 'GenITeam', 'Associate Software Engineer', 'RAG document Q&A, OCR automation, 3D render APIs'],
  ['2025 – NOW', 'Techverx', 'Software Engineer', 'Enterprise SaaS, RAG pipelines and AWS platforms'],
];

async function experience(t) {
  const f = fontCollector();
  const W = 960, H = 246, x0 = 40, colW = (W - 2 * x0) / ROLES.length, ly = 84;
  const kickL = f.use('mono', 'EXPERIENCE');
  const kickR = f.use('mono', 'BSCS · UNIVERSITY OF SOUTH ASIA · 2020 – 24');
  let cols = '';
  ROLES.forEach(([when, company, role, detail], i) => {
    const x = x0 + i * colW, now = i === ROLES.length - 1;
    const lines = wrap(detail, 30);
    cols += `<g transform="translate(${x} 0)">
${now ? `<circle class="ping" cx="6" cy="${ly}" r="6" fill="none" stroke="${t.cyan}"/>` : ''}
<circle cx="6" cy="${ly}" r="${now ? 5 : 4}" fill="${now ? t.cyan : t.panel}" stroke="${now ? t.cyan : t.violet}" stroke-width="1.5"/>
<text class="yr${now ? ' now' : ''}" x="0" y="${ly + 34}">${f.use('mono', when)}</text>
<text class="co" x="-1" y="${ly + 68}">${f.use('serif', company)}</text>
<text class="ro" x="0" y="${ly + 90}">${f.use('sans', role)}</text>
${lines.map((l, k) => `<text class="de" x="0" y="${ly + 112 + k * 17}">${f.use('sans', l)}</text>`).join('')}
</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Experience: ${ROLES.map((r) => `${r[0]} ${r[2]} at ${r[1]}`).join('; ')}. BSCS, University of South Asia, 2020–2024.">
<style>${await f.css()}
.k{font:500 11px ${STACKS.mono};fill:${t.muted};letter-spacing:.2em}
.yr{font:500 11px ${STACKS.mono};fill:${t.muted};letter-spacing:.14em}
.now{fill:${t.cyan}}
.co{font:400 30px ${STACKS.serif};fill:${t.text}}
.ro{font:500 13px ${STACKS.sans};fill:${t.text}}
.de{font:400 12.5px ${STACKS.sans};fill:${t.body}}
.flow{stroke-dasharray:4 6;animation:dash 1.2s linear infinite}
@keyframes dash{to{stroke-dashoffset:-20}}
.ping{animation:ping 2s ease-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes ping{0%{transform:scale(.8);opacity:.9}100%{transform:scale(2.8);opacity:0}}
</style>
<defs><linearGradient id="tl" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x0 + 3 * colW}" y2="0"><stop offset="0" stop-color="${t.violet}" stop-opacity=".25"/><stop offset="1" stop-color="${t.cyan}"/></linearGradient></defs>
<rect width="${W}" height="${H}" rx="18" fill="${t.panel}"/>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.line}"/>
<text class="k" x="${x0}" y="44">${kickL}</text>
<text class="k" x="${W - x0}" y="44" text-anchor="end">${kickR}</text>
<path class="flow" d="M${x0 + 6} ${ly} H${x0 + 3 * colW + 6}" stroke="url(#tl)" stroke-width="1.5" fill="none"/>
${cols}
</svg>`;
}

for (const [mode, t] of Object.entries(THEMES)) {
  for (const [slug, num, title] of HEADERS) out(`assets/headers/${slug}-${mode}.svg`, await header(t, num, title));
  out(`assets/pipeline-${mode}.svg`, await pipeline(t));
  for (const [i, p] of PROJECTS.entries()) out(`assets/cards/${p.slug}-${mode}.svg`, await card(t, p, i));
  out(`assets/toolkit-${mode}.svg`, await toolkit(t));
  out(`assets/experience-${mode}.svg`, await experience(t));
}
