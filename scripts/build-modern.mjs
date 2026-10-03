// Generates the aurora + bento profile assets.  Run: node scripts/build-modern.mjs
// Output is pure SVG (SMIL animation, system fonts) so it renders inside GitHub's <img>.
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'assets')
mkdirSync(join(out, 'bento'), { recursive: true })
mkdirSync(join(out, 'headers'), { recursive: true })

const SANS = "Inter,'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif"
const MONO = "'JetBrains Mono','SF Mono',Menlo,Consolas,'Liberation Mono',monospace"
const LIGHT = process.argv[2] === 'light'
const SFX = LIGHT ? '-light' : ''
const C = LIGHT
  ? { bg: '#f4f1ff', tile: '#ffffff', ink: '#1e1b4b', violet: '#7c3aed', cyan: '#0e7490', pink: '#be185d', green: '#15803d', amber: '#b45309',
      text: '#1e1b4b', mute: '#4b4a6b', dim: '#6b6a8e', t2: '#2e2b57', t3: '#4b4a6b', badge: '#14532d', dot: '#7c3aed',
      g1: '#6d28d9', g2: '#0e7490', g3: '#be185d', blob: 0.5, gl1: 0.02, gl2: 0, edge1: 0.22, edge2: 0.05, dots: 0.09 }
  : { bg: '#07060f', tile: '#0d0b1c', ink: '#ffffff', violet: '#8b5cf6', cyan: '#22d3ee', pink: '#f472b6', green: '#4ade80', amber: '#fbbf24',
      text: '#f5f3ff', mute: '#a5a3c4', dim: '#6b6a8e', t2: '#e9e5ff', t3: '#b9b6d8', badge: '#d1fae5', dot: '#ffffff',
      g1: '#c4b5fd', g2: '#67e8f9', g3: '#f9a8d4', blob: 1, gl1: 0.09, gl2: 0.025, edge1: 0.28, edge2: 0.06, dots: 0.07 }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" font-family="${SANS}">\n<defs>${defs}</defs>\n${body}\n</svg>\n`
const write = (p, s) => writeFileSync(join(out, p.replace(/\.svg$/, `${SFX}.svg`)), s)

const baseDefs = `
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.violet}"/><stop offset=".55" stop-color="${C.cyan}"/><stop offset="1" stop-color="${C.pink}"/></linearGradient>
<linearGradient id="gt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.g1}"/><stop offset=".5" stop-color="${C.g2}"/><stop offset="1" stop-color="${C.g3}"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.ink}" stop-opacity="${C.gl1}"/><stop offset="1" stop-color="${C.ink}" stop-opacity="${C.gl2}"/></linearGradient>
<linearGradient id="edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.ink}" stop-opacity="${C.edge1}"/><stop offset=".5" stop-color="${C.ink}" stop-opacity="${C.edge2}"/><stop offset="1" stop-color="#ffffff" stop-opacity="${C.edge1}"/></linearGradient>
<filter id="blur60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
<filter id="blur8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="${C.ink}" fill-opacity="${C.dots}"/></pattern>`

// A glass tile. `accent` tints the animated border.
let uid = 0
function tile(x, y, w, h, accent, inner) {
  const id = `b${uid++}`
  return `<g transform="translate(${x} ${y})">
<defs>
<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${accent}" stop-opacity=".95"/><stop offset=".5" stop-color="${accent}" stop-opacity=".08"/><stop offset="1" stop-color="${C.cyan}" stop-opacity=".7"/>
<animateTransform attributeName="gradientTransform" type="rotate" from="0 .5 .5" to="360 .5 .5" dur="9s" repeatCount="indefinite"/>
</linearGradient>
<radialGradient id="${id}r" cx="1" cy="0" r="1"><stop offset="0" stop-color="${accent}" stop-opacity=".22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<clipPath id="${id}c"><rect width="${w}" height="${h}" rx="20"/></clipPath>
</defs>
<rect width="${w}" height="${h}" rx="20" fill="${C.tile}"/>
<g clip-path="url(#${id}c)"><rect width="${w}" height="${h}" fill="url(#${id}r)"/><rect width="${w}" height="${h}" fill="url(#dots)"/></g>
<rect width="${w}" height="${h}" rx="20" fill="url(#glass)"/>
<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="19.25" stroke="url(#${id})" stroke-width="1.5"/>
${inner}
</g>`
}

const label = (x, y, t, color = C.cyan) =>
  `<text x="${x}" y="${y}" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="2.2" fill="${color}">${esc(t)}</text>`

function chips(x, y, items, { size = 12, maxW = Infinity, gap = 8, color = C.text } = {}) {
  let cx = x, cy = y, s = ''
  for (const t of items) {
    const w = Math.round(t.length * size * 0.6 + 22)
    if (cx + w > x + maxW) { cx = x; cy += size + 22 }
    s += `<rect x="${cx}" y="${cy}" width="${w}" height="${size + 14}" rx="${(size + 14) / 2}" fill="${C.ink}" fill-opacity=".06" stroke="${C.ink}" stroke-opacity=".16"/>`
    s += `<text x="${cx + w / 2}" y="${cy + size + 3}" text-anchor="middle" font-family="${MONO}" font-size="${size}" fill="${color}">${esc(t)}</text>`
    cx += w + gap
  }
  return s
}

const wrap = (lines, x, y, size, lh, fill = C.mute, weight = 400) =>
  lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`).join('')

// ───────────────────────────── hero ─────────────────────────────
function hero() {
  const W = 830, H = 360
  const phrases = ['RAG pipelines that answer from your data', 'LLM products on GPT-4o · Claude · Gemini', 'FastAPI · Django · NestJS · Next.js', 'From prompt to production on AWS']
  const per = 4, total = per * phrases.length, cw = 13.2, ty = 258
  const typing = phrases.map((p, i) => {
    const full = Math.ceil(p.length * cw) + 4
    const a = i * per, t1 = a + 1.4, t2 = a + 3.3, t3 = a + 3.7
    const kt = [0, a, t1, t2, t3, total].map((v) => +(v / total).toFixed(4)).join(';')
    const vals = (v) => `0;0;${v};${v};0;0`
    return `<clipPath id="tp${i}"><rect x="64" y="${ty - 24}" height="34" width="0"><animate attributeName="width" values="${vals(full)}" keyTimes="${kt}" dur="${total}s" repeatCount="indefinite"/></rect></clipPath>
<text x="64" y="${ty}" font-family="${MONO}" font-size="22" fill="${C.t2}" clip-path="url(#tp${i})">${esc(p)}</text>
<rect x="64" y="${ty - 22}" width="2.5" height="28" rx="1" fill="${C.cyan}" opacity="0"><animate attributeName="x" values="64;64;${64 + full};${64 + full};64;64" keyTimes="${kt}" dur="${total}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${[0, a, a + 0.05, t3, t3 + 0.05, total].map((v) => +(v / total).toFixed(4)).join(';')}" dur="${total}s" repeatCount="indefinite"/></rect>`
  }).join('\n')

  const blob = (cx, cy, r, color, dx, dy, dur, op) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op * C.blob}" filter="url(#blur60)"><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};${-dx / 2} ${dy * 1.4};0 0" dur="${dur}s" repeatCount="indefinite"/></circle>`

  const body = `
<rect width="${W}" height="${H}" rx="28" fill="${C.bg}"/>
<clipPath id="hc"><rect width="${W}" height="${H}" rx="28"/></clipPath>
<g clip-path="url(#hc)">
${blob(140, 90, 150, C.violet, 140, 50, 14, 0.85)}
${blob(700, 70, 140, C.cyan, -120, 70, 17, 0.55)}
${blob(520, 330, 150, C.pink, -150, -40, 19, 0.55)}
${blob(260, 340, 110, '#4f46e5', 120, -50, 12, 0.6)}
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<rect width="${W}" height="${H}" fill="${C.bg}" opacity=".18"/>
</g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="27.25" stroke="url(#edge)" stroke-width="1.5"/>

<g transform="translate(64 52)">
<rect width="318" height="34" rx="17" fill="${C.ink}" fill-opacity=".07" stroke="${C.ink}" stroke-opacity=".2"/>
<circle cx="19" cy="17" r="4.5" fill="${C.green}"/><circle cx="19" cy="17" r="4.5" fill="${C.green}"><animate attributeName="r" values="4.5;13;4.5" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0;.6" dur="2.2s" repeatCount="indefinite"/></circle>
<text x="36" y="21.5" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1.4" fill="${C.badge}">OPEN TO AI/ML &amp; FULL-STACK ROLES</text>
</g>

<text x="62" y="152" font-size="26" font-weight="500" fill="${C.mute}" letter-spacing="1">Hi, I'm</text>
<text x="62" y="222" font-size="78" font-weight="800" letter-spacing="-2.5" fill="url(#gt)">Rohan Khan
<animate attributeName="opacity" values=".92;1;.92" dur="5s" repeatCount="indefinite"/></text>
${typing}
<text x="64" y="316" font-family="${MONO}" font-size="12.5" letter-spacing="1.2" fill="${C.t3}">AI/ML ENGINEER  ·  FULL-STACK  ·  LAHORE, PK  ·  SOFTWARE ENGINEER @ TECHVERX</text>

<g transform="translate(662 70)" opacity=".95">
<circle cx="52" cy="60" r="86" stroke="url(#g)" stroke-opacity=".5" stroke-dasharray="3 9"><animateTransform attributeName="transform" type="rotate" from="0 52 60" to="360 52 60" dur="40s" repeatCount="indefinite"/></circle>
<circle cx="52" cy="60" r="56" stroke="url(#g)" stroke-opacity=".7" stroke-width="1.5" stroke-dasharray="40 14"><animateTransform attributeName="transform" type="rotate" from="360 52 60" to="0 52 60" dur="24s" repeatCount="indefinite"/></circle>
<circle cx="52" cy="60" r="24" fill="url(#g)" opacity=".9"><animate attributeName="r" values="22;27;22" dur="4s" repeatCount="indefinite"/></circle>
<circle cx="52" cy="60" r="10" fill="${C.dot}" opacity=".9"/>
<g fill="${C.cyan}"><circle cx="52" cy="-26" r="4"/><circle cx="138" cy="60" r="4" fill="${C.pink}"/><circle cx="-34" cy="60" r="4" fill="${C.violet}"/><animateTransform attributeName="transform" type="rotate" from="0 52 60" to="360 52 60" dur="18s" repeatCount="indefinite"/></g>
</g>`
  write('hero.svg', svg(W, H, body, baseDefs))
}

// ───────────────────────────── section headers ─────────────────────────────
function header(n, title, sub) {
  const W = 830, H = 72
  const body = `
<text x="0" y="40" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2.5" fill="${C.cyan}">${n}</text>
<text x="40" y="44" font-size="32" font-weight="800" letter-spacing="-.5" fill="${C.text}">${esc(title)}</text>
<text x="${W}" y="42" text-anchor="end" font-family="${MONO}" font-size="12" fill="${C.dim}">${esc(sub)}</text>
<rect x="0" y="62" width="${W}" height="2" rx="1" fill="${C.ink}" fill-opacity=".1"/>
<rect x="0" y="61" width="150" height="4" rx="2" fill="url(#gt)"><animate attributeName="x" values="0;${W - 150};0" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines=".6 0 .4 1;.6 0 .4 1" keyTimes="0;.5;1"/></rect>`
  write(`headers/${n}.svg`, svg(W, H, body, baseDefs))
}

// ───────────────────────────── bento: about ─────────────────────────────
function about() {
  const W = 830, H = 392
  const metric = (x, y, w, h, big, small, accent, delay) =>
    tile(x, y, w, h, accent, `
<text x="22" y="52" font-size="40" font-weight="800" letter-spacing="-1.5" fill="url(#gt)">${big}</text>
<text x="22" y="76" font-size="12.5" fill="${C.mute}">${esc(small)}</text>
<rect x="22" y="${h - 22}" width="${w - 44}" height="3" rx="1.5" fill="${C.ink}" fill-opacity=".1"/>
<rect x="22" y="${h - 22}" width="0" height="3" rx="1.5" fill="${accent}"><animate attributeName="width" values="0;${w - 44};${w - 44}" keyTimes="0;.35;1" dur="6s" begin="${delay}s" repeatCount="indefinite"/></rect>`)

  const body =
    tile(0, 0, 410, 214, C.violet, `
${label(26, 38, 'ABOUT ME', C.violet)}
<text x="26" y="78" font-size="21" font-weight="700" fill="${C.text}">I build AI-powered web apps</text>
<text x="26" y="104" font-size="21" font-weight="700" fill="url(#gt)">end to end.</text>
${wrap(['From the retrieval pipeline and the LLM prompt to the', 'API, the interface and the cloud it runs on. RAG,', 'semantic search and OCR automation that ship to', 'production, not just to a notebook.'], 26, 140, 13.5, 21)}`) +
    metric(420, 0, 195, 102, '60%', 'less manual data entry (OCR)', C.cyan, 0) +
    metric(625, 0, 205, 102, '80%', 'less manual accounting', C.violet, 0.4) +
    metric(420, 112, 195, 102, '40%', 'lower API latency', C.pink, 0.8) +
    metric(625, 112, 205, 102, '99%+', 'uptime in production', C.green, 1.2) +
    tile(0, 224, 410, 168, C.cyan, `
${label(26, 38, 'NOW', C.cyan)}
<circle cx="${410 - 34}" cy="34" r="4" fill="${C.green}"><animate attributeName="opacity" values="1;.25;1" dur="2s" repeatCount="indefinite"/></circle>
<text x="26" y="74" font-size="21" font-weight="700" fill="${C.text}">Software Engineer</text>
<text x="26" y="98" font-size="14.5" fill="url(#gt)" font-weight="600">Techverx · Jul 2025 – present</text>
${wrap(['Enterprise SaaS APIs, RAG document Q&A and', 'QuickBooks automation.'], 26, 126, 13.5, 20)}`) +
    tile(420, 224, 410, 168, C.pink, `
${label(26, 38, 'BEFORE', C.pink)}
<text x="26" y="72" font-size="16" font-weight="700" fill="${C.text}">GenITeam Solutions</text><text x="26" y="91" font-size="12.5" fill="${C.mute}">Associate Software Engineer · 2024 – 25</text>
<text x="26" y="118" font-size="16" font-weight="700" fill="${C.text}">InvoZone · PureLogics</text><text x="26" y="137" font-size="12.5" fill="${C.mute}">Django intern · Python / data science</text>
<text x="26" y="157" font-size="12" font-family="${MONO}" fill="${C.dim}">BSCS · University of South Asia · 2020–24</text>`)
  write('bento/about.svg', svg(W, H, body, baseDefs))
}

// ───────────────────────────── bento: pipeline ─────────────────────────────
function pipeline() {
  const W = 830, H = 196
  const steps = [
    ['01', 'Data', ['PDFs · DBs', 'APIs · docs'], C.violet],
    ['02', 'Embed', ['chunking · OCR', 'embeddings'], C.violet],
    ['03', 'Retrieve', ['ChromaDB', 'semantic search'], C.cyan],
    ['04', 'Reason', ['GPT-4o · Claude', 'Gemini'], C.cyan],
    ['05', 'Serve', ['FastAPI · Django', 'NestJS · Redis'], C.pink],
    ['06', 'Ship', ['Next.js · React', 'Docker · AWS'], C.pink],
  ]
  const tw = 120, gap = (W - tw * 6) / 5, y = 8, th = 118
  let conn = `<path id="flow" d="M${tw / 2} ${y + th / 2} H${W - tw / 2}" stroke="#a78bfa" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round" opacity=".9"/>`
  let body = ''
  steps.forEach(([n, t, l, col], i) => {
    const x = i * (tw + gap)
    body += tile(x, y, tw, th, col, `
<text x="16" y="30" font-family="${MONO}" font-size="11" font-weight="700" fill="${col}">${n}</text>
<text x="16" y="58" font-size="18" font-weight="800" fill="${C.text}">${t}</text>
${wrap(l, 16, 80, 11, 15, C.mute)}`)
  })
  let dots = ''
  for (let i = 0; i < 3; i++)
    dots += `<circle r="5" fill="${C.dot}" filter="url(#blur8)"><animateMotion dur="5s" begin="-${(i * 1.66).toFixed(2)}s" repeatCount="indefinite" path="M${tw / 2} ${y + th / 2} H${W - tw / 2}"/></circle><circle r="3" fill="${C.dot}"><animateMotion dur="5s" begin="-${(i * 1.66).toFixed(2)}s" repeatCount="indefinite" path="M${tw / 2} ${y + th / 2} H${W - tw / 2}"/></circle>`
  body = conn + dots + body
  // feedback loop
  const lx1 = tw / 2, lx2 = W - tw / 2, ly = y + th + 34
  body += `<path d="M${lx2} ${y + th + 4} V${ly} H${lx1} V${y + th + 4}" stroke="${C.dim}" stroke-width="1.5" stroke-dasharray="4 5" stroke-linejoin="round"/>
<path d="M${lx1 - 4} ${y + th + 12} L${lx1} ${y + th + 4} L${lx1 + 4} ${y + th + 12}" stroke="${C.dim}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="${W / 2 - 150}" y="${ly - 12}" width="300" height="24" rx="12" fill="${C.bg}" stroke="${C.dim}" stroke-opacity=".6"/>
<text x="${W / 2}" y="${ly + 4}" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="1" fill="${C.mute}">evals  ·  user feedback  ·  iterate</text>`
  write('bento/pipeline.svg', svg(W, H, body, baseDefs))
}

// ───────────────────────────── bento: projects ─────────────────────────────
function projectTile(file, vw, vh, p) {
  const body = tile(0, 0, vw, vh, p.accent, `
${label(24, 36, p.tag, p.accent)}
${p.live ? `<g transform="translate(${vw - 84} 20)"><rect width="62" height="24" rx="12" fill="${C.green}" fill-opacity=".14" stroke="${C.green}" stroke-opacity=".5"/><circle cx="14" cy="12" r="3.5" fill="${C.green}"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle><text x="24" y="16.5" font-family="${MONO}" font-size="10.5" font-weight="700" letter-spacing="1" fill="${C.badge}">LIVE</text></g>` : `<text x="${vw - 34}" y="38" font-size="18" fill="${C.dim}">↗</text>`}
<text x="24" y="${p.big ? 82 : 72}" font-size="${p.big ? 32 : 23}" font-weight="800" letter-spacing="-.6" fill="${C.text}">${esc(p.title)}</text>
${wrap(p.desc, 24, p.big ? 112 : 98, p.big ? 14 : 13, p.big ? 22 : 19)}
${chips(24, vh - 54, p.stack, { size: 11.5, maxW: vw - 48 })}`)
  write(`bento/${file}.svg`, svg(vw, vh, body, baseDefs))
}

function projects() {
  projectTile('kheloo', 640, 248, { tag: 'AI SEARCH · WEB APP', title: 'Kheloo', big: true, accent: C.cyan,
    desc: ['Book sports courts across Pakistan. Gemini-powered', 'smart venue search turns plain-language requests', 'into filters, with a floating AI assistant.'], stack: ['Next.js 16', 'NestJS', 'Prisma', 'Gemini'] })
  projectTile('mercury-dasha', 340, 248, { tag: 'AI PLATFORM', title: 'Mercury Dasha', live: true, accent: C.violet,
    desc: ['Generative AI platform for text,', 'image and video — Django', 'microservices behind React.'], stack: ['Django', 'React', 'GenAI'] })
  projectTile('ai-travel', 332, 250, { tag: 'AI · FULL-STACK', title: 'AI Travel Platform', live: true, accent: C.pink,
    desc: ['RAG chatbot that knows every', 'destination, plus WhatsApp booking.'], stack: ['Next.js', 'LangChain', 'RAG'] })
  projectTile('billing-rag', 332, 250, { tag: 'RAG ASSISTANT', title: 'Billing Reports RAG', accent: C.cyan,
    desc: ['Ask billing reports questions in', 'plain English. Vector search plus', 'GPT-4o-mini answers.'], stack: ['FastAPI', 'ChromaDB', 'LangChain'] })
  projectTile('pdf-fraud', 332, 250, { tag: 'MACHINE LEARNING', title: 'PDF Fraud Detector', accent: C.violet,
    desc: ['Flags forged PDFs from metadata,', 'content patterns and structural', 'anomalies, served as a batch API.'], stack: ['FastAPI', 'scikit-learn'] })
  projectTile('pmo-engine', 830, 190, { tag: 'ENTERPRISE · AWS', title: 'PMO Engine (T360)', accent: C.pink,
    desc: ['Org-wide project office platform: 27 NestJS modules, Azure AD SSO,', 'Redis queues on AWS ECS.'], stack: ['NestJS', 'Next.js', 'MongoDB', 'AWS'] })
}

// ───────────────────────────── bento: stack ─────────────────────────────
function stack() {
  const W = 830, H = 330
  const cat = (x, y, w, h, name, accent, items) =>
    tile(x, y, w, h, accent, `${label(24, 36, name, accent)}${chips(24, 56, items, { maxW: w - 48, size: 12.5 })}`)
  const body =
    cat(0, 0, 520, 150, 'AI / ML', C.violet, ['LangChain', 'RAG', 'ChromaDB', 'GPT-4o', 'Claude', 'Gemini', 'TensorFlow', 'scikit-learn', 'OCR']) +
    cat(530, 0, 300, 150, 'BACKEND', C.cyan, ['Python', 'Django REST', 'FastAPI', 'NestJS', 'Node.js']) +
    cat(0, 160, 300, 170, 'FRONTEND', C.pink, ['Next.js', 'React', 'TypeScript', 'Tailwind']) +
    cat(310, 160, 250, 170, 'DATA', C.green, ['PostgreSQL', 'MongoDB', 'Redis', 'Prisma']) +
    cat(570, 160, 260, 170, 'CLOUD & TOOLS', C.amber, ['AWS', 'ECS Fargate', 'S3', 'Docker', 'DigitalOcean', 'Linux', 'Git'])
  write('bento/stack.svg', svg(W, H, body, baseDefs))
}

// ───────────────────────────── contact ─────────────────────────────
function contact() {
  const W = 830, H = 210
  const blob = (cx, cy, r, color, dx, dy, dur, op) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${op * C.blob}" filter="url(#blur60)"><animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};0 0" dur="${dur}s" repeatCount="indefinite"/></circle>`
  const body = `
<rect width="${W}" height="${H}" rx="28" fill="${C.bg}"/>
<clipPath id="cc"><rect width="${W}" height="${H}" rx="28"/></clipPath>
<g clip-path="url(#cc)">${blob(120, 160, 120, C.violet, 160, -40, 13, 0.8)}${blob(720, 40, 120, C.cyan, -150, 60, 16, 0.55)}${blob(430, 230, 110, C.pink, 80, -50, 11, 0.5)}<rect width="${W}" height="${H}" fill="url(#dots)"/></g>
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="27.25" stroke="url(#edge)" stroke-width="1.5"/>
<text x="${W / 2}" y="82" text-anchor="middle" font-size="38" font-weight="800" letter-spacing="-1" fill="url(#gt)">Let's build something intelligent.</text>
<text x="${W / 2}" y="118" text-anchor="middle" font-size="16" fill="${C.t2}">Open to AI/ML and full-stack roles — remote, hybrid or on-site —</text>
<text x="${W / 2}" y="142" text-anchor="middle" font-size="16" fill="${C.t2}">and to product collaborations that put LLMs to real work.</text>
<text x="${W / 2}" y="184" text-anchor="middle" font-family="${MONO}" font-size="12" letter-spacing="2" fill="${C.mute}">DATA IN  →  INTELLIGENCE OUT  →  SHIPPED</text>`
  write('contact.svg', svg(W, H, body, baseDefs))
}

// ───────────────────────────── run ─────────────────────────────
hero()
header('01', 'About', 'who · what · results')
header('02', 'How I build', 'rag → production')
header('03', 'Selected work', 'shipped & shipping')
header('04', 'Toolkit', 'daily drivers')
header('05', 'Activity', 'github · live')
about(); pipeline(); projects(); stack(); contact()
console.log('modern assets written')
