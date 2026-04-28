import fs from 'fs';
import fetch from 'node-fetch';
import { backup, isDryRun } from './script-utils.mjs';

// --- CONFIGURATION -----------------------------------------------------------
// Author IDs, deny-list and min-year filter live in pubs.config.json so adding
// a new lab member doesn't require editing this script.

const CONFIG_PATH = './pubs.config.json';
const JSON_FILE_PATH = './client/src/data/publications.json';
const PLACEHOLDER_IMG = 'https://placehold.co/200x200/7A003C/white?text=Paper';

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`❌ ${CONFIG_PATH} not found. See pubs.config.json.example.`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (err) {
    console.error(`❌ ${CONFIG_PATH} is not valid JSON: ${err.message}`);
    process.exit(1);
  }
}

async function fetchPapers() {
  const dryRun = isDryRun();
  const { authorIds, denyTitles = [], minYear = null } = loadConfig();

  if (!Array.isArray(authorIds) || authorIds.length === 0) {
    console.error('❌ No authorIds configured in pubs.config.json.');
    process.exit(1);
  }

  if (dryRun) console.log('💧 Dry-run mode: no files will be written.\n');
  console.log(`Fetching papers for ${authorIds.length} author profile(s)…`);
  if (minYear) console.log(`  Filter: only papers from ${minYear} onward.`);
  if (denyTitles.length) console.log(`  Deny-list: ${denyTitles.length} title(s) will be excluded.`);

  const denySet = new Set(denyTitles.map((t) => t.trim().toLowerCase()));

  const fetchPromises = authorIds.map(async (id) => {
    const url = `https://api.semanticscholar.org/graph/v1/author/${id}/papers?fields=title,year,authors,venue,url,citationCount,publicationDate,externalIds&limit=500`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`  ⚠️  Author ${id}: HTTP ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.warn(`  ⚠️  Author ${id}: ${err.message}`);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  const rawPapers = results.flat();
  console.log(`Fetched ${rawPapers.length} raw paper records.`);

  // Load existing data so we can preserve custom paper images.
  let existingPapers = [];
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      existingPapers = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf-8'));
    }
  } catch {
    /* ignore — treat as fresh sync */
  }

  const uniquePapersMap = new Map();
  let denyFiltered = 0;
  let yearFiltered = 0;

  rawPapers.forEach((paper) => {
    if (!paper.title) return;
    const normalizedTitle = paper.title.trim().toLowerCase();

    if (denySet.has(normalizedTitle)) {
      denyFiltered++;
      return;
    }
    if (minYear && paper.year && paper.year < minYear) {
      yearFiltered++;
      return;
    }
    if (uniquePapersMap.has(normalizedTitle)) return;

    // Defensive: existingMatch.image might be missing.
    const existingMatch = existingPapers.find(
      (p) => p.title && p.title.toLowerCase() === normalizedTitle
    );
    const imageToUse =
      existingMatch && existingMatch.image && !existingMatch.image.includes('placehold.co')
        ? existingMatch.image
        : PLACEHOLDER_IMG;

    const doiLink =
      paper.externalIds && paper.externalIds.DOI
        ? `https://doi.org/${paper.externalIds.DOI}`
        : paper.url;

    const pubDate = paper.publicationDate || `${paper.year}-01-01`;

    const authorNames = (paper.authors || []).map((a) => a.name).filter(Boolean);
    const authorString =
      authorNames.slice(0, 5).join(', ') + (authorNames.length > 5 ? '...' : '');

    uniquePapersMap.set(normalizedTitle, {
      title: paper.title,
      authors: authorString,
      journal: paper.venue || 'Journal',
      year: paper.year,
      date: pubDate,
      image: imageToUse,
      link: doiLink,
      citationCount: paper.citationCount,
    });
  });

  let finalPapers = Array.from(uniquePapersMap.values());
  finalPapers.sort((a, b) => new Date(b.date) - new Date(a.date));
  finalPapers = finalPapers.map((paper, index) => ({ id: index + 1, ...paper }));

  console.log(`\n  ${finalPapers.length} unique papers after dedup.`);
  if (denyFiltered) console.log(`  ${denyFiltered} filtered by denyTitles.`);
  if (yearFiltered) console.log(`  ${yearFiltered} filtered by minYear=${minYear}.`);

  if (dryRun) {
    console.log(`\n[dry-run] Would write ${finalPapers.length} papers to ${JSON_FILE_PATH}.`);
    return;
  }

  backup(JSON_FILE_PATH);
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(finalPapers, null, 2));
  console.log(
    `\n✅ Saved ${finalPapers.length} papers (sorted by date, linked to DOI). Backup at ${JSON_FILE_PATH}.bak`
  );
}

fetchPapers().catch((error) => {
  console.error('❌ Error fetching papers:', error);
  process.exit(1);
});
