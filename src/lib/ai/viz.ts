/**
 * Deterministic, self-contained SVG visualizations derived from paper text.
 * No external libraries — the SVGs are stored in ai_assets.content and
 * rendered inline on the article page after editorial approval.
 */

export interface VizItem {
  title: string;
  description: string;
  svg: string;
}

const STOPWORDS = new Set(
  `a about above after again against all also among an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own paper research same she should so some study such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with you your yours yourself however thus may might within using used use based results result findings finding analysis data section table figure et al pp vol journal university press new york also whether three two one first second author authors article`.split(
    /\s+/
  )
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zÀ-ɏ' -]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

function topTerms(text: string, keywords: string[], n: number): { term: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const w of tokenize(text)) counts.set(w, (counts.get(w) || 0) + 1);
  // Author keywords get priority placement if present in text
  const kwTerms = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 2)
    .map((k) => ({ term: k, count: countOccurrences(text.toLowerCase(), k) }))
    .filter((k) => k.count > 0);
  const singles = [...counts.entries()]
    .filter(([t]) => !kwTerms.some((k) => k.term.includes(t)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term, count]) => ({ term, count }));
  return [...kwTerms, ...singles]
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function countOccurrences(hay: string, needle: string): number {
  let count = 0;
  let idx = hay.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = hay.indexOf(needle, idx + needle.length);
  }
  return count;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONT = `font-family="Georgia, serif"`;
const SANS = `font-family="system-ui, sans-serif"`;
const COLORS = ["#2e6da3", "#2a9d8f", "#e9973a", "#1d466e", "#79b8a8", "#b0661a", "#4b8abd", "#21867a"];

/** Horizontal bar chart of the most frequent terms. */
function termBarChart(terms: { term: string; count: number }[], paperTitle: string): VizItem {
  const rows = terms.slice(0, 10);
  const max = Math.max(...rows.map((r) => r.count), 1);
  const barH = 26;
  const gap = 8;
  const labelW = 170;
  const chartW = 320;
  const height = rows.length * (barH + gap) + 40;
  const bars = rows
    .map((r, i) => {
      const w = Math.max(4, (r.count / max) * chartW);
      const y = 24 + i * (barH + gap);
      return `
  <text x="${labelW - 8}" y="${y + barH / 2 + 4}" text-anchor="end" ${SANS} font-size="12" fill="#374151">${esc(r.term)}</text>
  <rect x="${labelW}" y="${y}" width="${w}" height="${barH}" rx="3" fill="${COLORS[i % 2]}" opacity="0.9"/>
  <text x="${labelW + w + 6}" y="${y + barH / 2 + 4}" ${SANS} font-size="11" fill="#6b7280">${r.count}</text>`;
    })
    .join("");
  return {
    title: "Most frequent key terms",
    description: `Term frequency across the full text of “${paperTitle}”.`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${labelW + chartW + 60} ${height}" role="img" aria-label="Bar chart of the most frequent key terms in the article">
  <title>Most frequent key terms</title>
  <text x="0" y="14" ${SANS} font-size="12" font-weight="600" fill="#1a3a5c">Term frequency</text>${bars}
</svg>`,
  };
}

/** Circular co-occurrence network of key terms. */
function cooccurrenceNetwork(text: string, terms: { term: string; count: number }[], paperTitle: string): VizItem {
  const nodes = terms.slice(0, 10);
  const paragraphs = text.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z])/).filter((p) => p.length > 80);
  const edges: { a: number; b: number; w: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let w = 0;
      for (const p of paragraphs) {
        const lower = p.toLowerCase();
        if (lower.includes(nodes[i].term) && lower.includes(nodes[j].term)) w++;
      }
      if (w > 0) edges.push({ a: i, b: j, w });
    }
  }
  const maxW = Math.max(...edges.map((e) => e.w), 1);
  const maxCount = Math.max(...nodes.map((n) => n.count), 1);
  const cx = 260;
  const cy = 220;
  const R = 150;
  const pos = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  const edgeSvg = edges
    .map(
      (e) =>
        `  <line x1="${pos[e.a].x.toFixed(1)}" y1="${pos[e.a].y.toFixed(1)}" x2="${pos[e.b].x.toFixed(1)}" y2="${pos[e.b].y.toFixed(1)}" stroke="#82b1d6" stroke-width="${(0.5 + (e.w / maxW) * 3.5).toFixed(1)}" opacity="${(0.25 + 0.5 * (e.w / maxW)).toFixed(2)}"/>`
    )
    .join("\n");
  const nodeSvg = nodes
    .map((n, i) => {
      const r = 8 + (n.count / maxCount) * 14;
      const labelY = pos[i].y < cy ? pos[i].y - r - 6 : pos[i].y + r + 14;
      return `  <circle cx="${pos[i].x.toFixed(1)}" cy="${pos[i].y.toFixed(1)}" r="${r.toFixed(1)}" fill="${COLORS[i % COLORS.length]}" opacity="0.85"/>
  <text x="${pos[i].x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" ${SANS} font-size="11.5" fill="#26313d">${esc(n.term)}</text>`;
    })
    .join("\n");
  return {
    title: "Keyword co-occurrence network",
    description: `Key terms that appear together in the same passages of “${paperTitle}”. Node size reflects frequency; edge thickness reflects how often terms co-occur.`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 440" role="img" aria-label="Network diagram of co-occurring key terms">
  <title>Keyword co-occurrence network</title>
${edgeSvg}
${nodeSvg}
</svg>`,
  };
}

/** Timeline of cited works by year (from 4-digit years in the reference list / text). */
function citationTrend(text: string, paperTitle: string): VizItem | null {
  const years = (text.match(/\((?:19|20)\d{2}[a-z]?[),;]/g) || [])
    .map((m) => Number(m.slice(1, 5)))
    .filter((y) => y >= 1970 && y <= 2026);
  if (years.length < 8) return null;
  const counts = new Map<number, number>();
  for (const y of years) counts.set(y, (counts.get(y) || 0) + 1);
  const min = Math.min(...counts.keys());
  const max = Math.max(...counts.keys());
  if (max - min < 4) return null;
  const span = max - min;
  const maxCount = Math.max(...counts.values());
  const W = 480;
  const H = 220;
  const padL = 34;
  const padB = 30;
  const points: string[] = [];
  const bars: string[] = [];
  for (let y = min; y <= max; y++) {
    const c = counts.get(y) || 0;
    const x = padL + ((y - min) / span) * (W - padL - 16);
    const h = (c / maxCount) * (H - padB - 24);
    bars.push(
      `  <rect x="${(x - 3).toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="6" height="${h.toFixed(1)}" fill="#2a9d8f" opacity="0.75" rx="1.5"/>`
    );
    points.push(`${x.toFixed(1)},${(H - padB - h).toFixed(1)}`);
  }
  const ticks = [min, Math.round(min + span / 2), max]
    .map(
      (y) =>
        `  <text x="${(padL + ((y - min) / span) * (W - padL - 16)).toFixed(1)}" y="${H - 10}" text-anchor="middle" ${SANS} font-size="11" fill="#6b7280">${y}</text>`
    )
    .join("\n");
  return {
    title: "Cited literature by year",
    description: `Distribution of publication years cited in “${paperTitle}” (in-text citations detected automatically).`,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart of cited literature by publication year">
  <title>Cited literature by year</title>
  <text x="0" y="14" ${SANS} font-size="12" font-weight="600" fill="#1a3a5c">Citations per year</text>
  <line x1="${padL}" y1="${H - padB}" x2="${W - 10}" y2="${H - padB}" stroke="#d1d5db"/>
${bars.join("\n")}
  <polyline points="${points.join(" ")}" fill="none" stroke="#1d466e" stroke-width="1.5" opacity="0.7"/>
${ticks}
</svg>`,
  };
}

export function buildVisualizations(
  paperTitle: string,
  text: string,
  keywords: string[]
): VizItem[] {
  const terms = topTerms(text, keywords, 12);
  const items: VizItem[] = [];
  if (terms.length >= 4) {
    items.push(cooccurrenceNetwork(text, terms, paperTitle));
    items.push(termBarChart(terms, paperTitle));
  }
  const trend = citationTrend(text, paperTitle);
  if (trend) items.push(trend);
  if (items.length === 0) {
    throw new Error("Not enough extractable text to build visualizations");
  }
  return items;
}
