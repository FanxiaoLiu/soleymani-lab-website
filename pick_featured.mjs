// Pick "featured publications" automatically based on impact, and write the
// chosen ids to client/src/data/featured_publications.json. Home.jsx reads
// that file to populate the Featured Publications section.
//
// Eligibility:  paper.year >= currentYear - yearsBack  (default 2)
//
// Score (default metric "score"):
//   score = citationCount * weights.citations
//         + journalImpactFactor * weights.impactFactor
// Other metrics: "citations" (just citationCount) or "impact_factor" (just IF).
//
// Configuration lives in featured.config.json (count, yearsBack, weights,
// metric, denyIds, journalImpactFactors). The IF map starts with sensible
// 2024 defaults for common journals — extend it as the lab publishes in new
// venues. Journals NOT in the map are treated as IF=0 (a warning is printed
// for the top-10 candidates).
//
// Flags:
//   --list         show the ranking and exit; don't write anything
//   --auto         skip the y/n confirmation
//   --dry-run      show what would be written, don't actually write
//   --count <N>    override config.count
//   --years <N>    override config.yearsBack
//   --metric <m>   override config.metric (score | citations | impact_factor)

import fs from 'fs';
import {
  createPrompt,
  confirm,
  readJson,
  writeJson,
  isDryRun,
} from './script-utils.mjs';

const CONFIG_PATH = './featured.config.json';
const PUBS_PATH = './client/src/data/publications.json';
const OUTPUT_PATH = './client/src/data/featured_publications.json';

// --- helpers -----------------------------------------------------------------

function getFlagValue(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ ${CONFIG_PATH} not found.`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (err) {
    console.error(`❌ ${CONFIG_PATH} is not valid JSON: ${err.message}`);
    process.exit(1);
  }
}

function lookupImpactFactor(journal, ifMap) {
  if (!journal) return 0;
  if (ifMap[journal] !== undefined) return ifMap[journal];
  // Case-insensitive fallback.
  const target = journal.trim().toLowerCase();
  for (const key of Object.keys(ifMap)) {
    if (key.trim().toLowerCase() === target) return ifMap[key];
  }
  return 0;
}

function computeScore(pub, config, ifMap) {
  const citations = pub.citationCount || 0;
  const impactFactor = lookupImpactFactor(pub.journal, ifMap);
  const w = config.weights || { citations: 1, impactFactor: 5 };

  switch (config.metric) {
    case 'citations':
      return { score: citations, citations, impactFactor };
    case 'impact_factor':
      return { score: impactFactor, citations, impactFactor };
    case 'score':
    default:
      return {
        score: citations * (w.citations ?? 1) + impactFactor * (w.impactFactor ?? 5),
        citations,
        impactFactor,
      };
  }
}

function fmtRow(rank, marker, scored) {
  const p = scored;
  const idStr = `#${String(p.id).padStart(3)}`;
  const title = (p.title || '').slice(0, 75);
  const meta = `cite=${String(p.citations).padStart(3)}  IF=${p.impactFactor.toFixed(1).padStart(5)}  score=${p.score.toFixed(1).padStart(6)}`;
  return [
    `  ${marker} ${String(rank).padStart(2)}. ${idStr}  ${meta}`,
    `         ${title}`,
    `         ${p.year}, ${p.journal || '?'}`,
  ].join('\n');
}

// --- main --------------------------------------------------------------------

async function main() {
  const dryRun = isDryRun();
  const auto = process.argv.includes('--auto');
  const listOnly = process.argv.includes('--list');

  const config = loadConfig();
  const ifMap = config.journalImpactFactors || {};

  // CLI overrides
  const countOverride = parseInt(getFlagValue('count'), 10);
  const yearsOverride = parseInt(getFlagValue('years'), 10);
  const metricOverride = getFlagValue('metric');
  if (Number.isFinite(countOverride)) config.count = countOverride;
  if (Number.isFinite(yearsOverride)) config.yearsBack = yearsOverride;
  if (metricOverride) config.metric = metricOverride;

  const pubs = readJson(PUBS_PATH, []);
  if (!pubs.length) {
    console.error('❌ No publications. Run "npm run pubs:sync" first.');
    process.exit(1);
  }

  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - (config.yearsBack ?? 2);
  const denyIds = new Set(config.denyIds || []);

  const scored = pubs
    .filter((p) => Number.isFinite(p.year) && p.year >= cutoffYear)
    .filter((p) => !denyIds.has(p.id))
    .map((p) => ({ ...p, ...computeScore(p, config, ifMap) }))
    .sort((a, b) => b.score - a.score || (b.citations || 0) - (a.citations || 0));

  console.log('=== Featured Publications Picker ===\n');
  console.log(`Eligible papers (${cutoffYear}–${currentYear}, deny-list applied): ${scored.length}`);
  console.log(`Metric:    ${config.metric}`);
  console.log(`Will pick: top ${config.count}`);
  if (config.metric === 'score' || config.metric === undefined) {
    const w = config.weights || {};
    console.log(`Weights:   citations × ${w.citations ?? 1}  +  IF × ${w.impactFactor ?? 5}`);
  }
  console.log('');

  if (scored.length === 0) {
    console.error('❌ No eligible papers in the selected window.');
    process.exit(1);
  }

  // Show top 10 with selection markers.
  const showN = Math.min(10, scored.length);
  console.log(`Top ${showN} candidates  (★ = selected):\n`);
  scored.slice(0, showN).forEach((p, i) => {
    const marker = i < config.count ? '★' : ' ';
    console.log(fmtRow(i + 1, marker, p));
    console.log('');
  });

  // Warn about journals with IF=0 in the top selections (likely missing
  // from the impact-factor map).
  const missingIF = scored
    .slice(0, config.count)
    .filter((p) => p.impactFactor === 0 && p.journal && !['ECS Meeting Abstracts', 'Journal', 'bioRxiv', 'arXiv', 'medRxiv'].includes(p.journal));
  if (missingIF.length) {
    console.log('⚠️  These selected journals are not in journalImpactFactors:');
    missingIF.forEach((p) => console.log(`     - "${p.journal}"`));
    console.log('   Edit featured.config.json to add their IF values.\n');
  }

  if (listOnly) {
    console.log('[--list] Not writing anything.');
    return;
  }

  const ids = scored.slice(0, config.count).map((p) => p.id);
  const output = {
    ids,
    computedAt: new Date().toISOString(),
    metric: config.metric,
    cutoffYear,
    weights: config.weights,
  };

  if (!auto && !dryRun) {
    const rl = createPrompt();
    const ok = await confirm(rl, `Write these ${ids.length} as featured?`, true);
    rl.close();
    if (!ok) {
      console.log('❌ Cancelled. No changes made.');
      return;
    }
  }

  if (dryRun) {
    console.log('[dry-run] Would write:');
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  writeJson(OUTPUT_PATH, output);
  console.log(`✅ Wrote ${OUTPUT_PATH}`);
  console.log('   Featured ids:', ids.join(', '));
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
