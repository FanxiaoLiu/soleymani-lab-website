import fs from 'fs';
import fetch from 'node-fetch';
import { backup, isDryRun } from './script-utils.mjs';

// --- CONFIGURATION -----------------------------------------------------------
// Author IDs, deny-list and min-year filter live in pubs.config.json so adding
// a new lab member doesn't require editing this script.

const CONFIG_PATH = './pubs.config.json';
const JSON_FILE_PATH = './client/src/data/publications.json';
const TEAM_PATH = './client/src/data/team.json';
const ALUMNI_PATH = './client/src/data/alumni.json';
const PLACEHOLDER_IMG = 'https://placehold.co/200x200/7A003C/white?text=Paper';

// --- Lab-author filtering ----------------------------------------------------
// Semantic Scholar's profile system is imperfect — there is at least one OTHER
// "Leyla Soleymani" out there whose papers occasionally get merged into our
// PI's profiles. We defend against that by requiring every imported paper to
// have at least N authors that match the McMaster lab roster (PI + members +
// alumni). This catches contamination by foreign name-collision and is robust
// to S2's profile-merging mistakes.

function normalizeNameTokens(name) {
  if (!name) return [];
  const cleaned = name
    .replace(/\(([^)]+)\)/g, ' ')                 // strip "(Nickname)"
    .replace(/\b(Dr|Prof|Professor|Mr|Mrs|Ms|Mx)\.?\s+/gi, '') // strip titles
    .replace(/[.,]/g, ' ')                        // dots/commas → space
    .replace(/[-‐‐-―]/g, ' ')           // any hyphen → space
    .toLowerCase()
    .trim();
  return cleaned.split(/\s+/).filter(Boolean);
}

// True iff two author names plausibly refer to the same person:
//   last name matches AND first name (or initial) matches.
function nameMatches(a, b) {
  const aT = normalizeNameTokens(a);
  const bT = normalizeNameTokens(b);
  if (aT.length === 0 || bT.length === 0) return false;
  if (aT[aT.length - 1] !== bT[bT.length - 1]) return false; // last name
  const aF = aT[0], bF = bT[0];
  if (aF === bF) return true;
  if (aF.length === 1 && aF === bF[0]) return true; // "L." vs "Leyla"
  if (bF.length === 1 && bF === aF[0]) return true;
  return false;
}

function loadLabAuthorPool(additional = []) {
  const pool = [...additional];
  try {
    if (fs.existsSync(TEAM_PATH)) {
      const team = JSON.parse(fs.readFileSync(TEAM_PATH, 'utf-8'));
      pool.push(...team.map((p) => p.name).filter(Boolean));
    }
  } catch (err) {
    console.warn(`  ⚠️  Couldn't read team.json for the author filter: ${err.message}`);
  }
  try {
    if (fs.existsSync(ALUMNI_PATH)) {
      const alumni = JSON.parse(fs.readFileSync(ALUMNI_PATH, 'utf-8'));
      pool.push(...alumni.map((p) => p.name).filter(Boolean));
    }
  } catch (err) {
    console.warn(`  ⚠️  Couldn't read alumni.json for the author filter: ${err.message}`);
  }
  return pool;
}

// Count how many of `paperAuthors` (S2 author objects) match somebody in
// `labPool` (array of full names).
function countLabAuthorOverlap(paperAuthors, labPool) {
  let count = 0;
  for (const a of paperAuthors || []) {
    const an = (a && a.name) || '';
    if (!an) continue;
    if (labPool.some((ln) => nameMatches(an, ln))) count++;
  }
  return count;
}

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

// Pull the DOI suffix out of a "https://doi.org/..." URL, lowercased.
// Returns null if the link doesn't look like a DOI.
function extractDoi(link) {
  if (!link) return null;
  const m = link.match(/doi\.org\/(.+?)(?:[?#]|$)/i);
  return m ? m[1].toLowerCase() : null;
}

function normalizeTitle(t) {
  return (t || '').trim().toLowerCase();
}

async function fetchPapers() {
  const dryRun = isDryRun();
  const config = loadConfig();
  const { authorIds, denyTitles = [], minYear = null } = config;
  const authorFilterCfg = config.authorFilter || {};
  const filterEnabled = authorFilterCfg.enabled !== false;
  const minLabAuthors = Number.isFinite(authorFilterCfg.minLabAuthors)
    ? authorFilterCfg.minLabAuthors
    : 2;
  const additionalLabAuthors = authorFilterCfg.additionalLabAuthors || [];
  const denyAuthorList = authorFilterCfg.denyAuthors || [];

  if (!Array.isArray(authorIds) || authorIds.length === 0) {
    console.error('❌ No authorIds configured in pubs.config.json.');
    process.exit(1);
  }

  if (dryRun) console.log('💧 Dry-run mode: no files will be written.\n');
  console.log(`Fetching papers for ${authorIds.length} author profile(s)…`);
  if (minYear) console.log(`  Filter: only papers from ${minYear} onward.`);
  if (denyTitles.length) console.log(`  Deny-list: ${denyTitles.length} title(s) will be excluded.`);

  let labPool = [];
  if (filterEnabled) {
    labPool = loadLabAuthorPool(additionalLabAuthors);
    console.log(
      `  Author filter: paper must include ≥${minLabAuthors} author(s) from the lab roster (${labPool.length} known names).`
    );
    if (denyAuthorList.length > 0) {
      console.log(`  Deny-author list: ${denyAuthorList.length} name(s) will reject any paper containing them.`);
    }
  } else {
    console.log('  Author filter: DISABLED (every paper from S2 will be imported).');
  }

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

  // -------------------------------------------------------------------------
  // Load existing data so we can:
  //   1. Preserve custom paper images
  //   2. Preserve manually-added papers (paper.manual === true)
  //   3. Keep IDs stable across syncs (matched by DOI first, then by title)
  // -------------------------------------------------------------------------
  let existingPapers = [];
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      existingPapers = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf-8'));
    }
  } catch {
    /* treat as fresh sync */
  }

  const existingByTitle = new Map();
  const existingByDoi = new Map();
  for (const p of existingPapers) {
    const t = normalizeTitle(p.title);
    if (t) existingByTitle.set(t, p);
    const d = extractDoi(p.link);
    if (d) existingByDoi.set(d, p);
  }

  // Manually-added papers are sticky — never overwritten by sync.
  const manualPapers = existingPapers.filter((p) => p.manual === true);
  const manualTitleSet = new Set(manualPapers.map((p) => normalizeTitle(p.title)));
  const manualDoiSet = new Set(manualPapers.map((p) => extractDoi(p.link)).filter(Boolean));

  if (manualPapers.length > 0) {
    console.log(`  Preserving ${manualPapers.length} manual paper(s) (manual: true).`);
  }

  // -------------------------------------------------------------------------
  // Dedupe Semantic-Scholar fetched papers, skipping any that collide with
  // a manual paper (manual entries always take precedence).
  // -------------------------------------------------------------------------
  const uniquePapersMap = new Map();
  let denyFiltered = 0;
  let yearFiltered = 0;
  let manualOverridden = 0;
  let labAuthorFiltered = 0;
  let denyAuthorFiltered = 0;
  const labAuthorRejected = []; // for verbose reporting

  rawPapers.forEach((paper) => {
    if (!paper.title) return;
    const titleNorm = normalizeTitle(paper.title);

    if (denySet.has(titleNorm)) {
      denyFiltered++;
      return;
    }
    if (minYear && paper.year && paper.year < minYear) {
      yearFiltered++;
      return;
    }
    if (uniquePapersMap.has(titleNorm)) return;

    // Author-overlap filter — defends against S2 attributing papers to the
    // wrong "Leyla Soleymani" (or similar profile-merge bugs).
    if (filterEnabled) {
      const paperAuthors = paper.authors || [];
      // Deny-author check: any author matching the deny list → skip.
      // Uses the same fuzzy name match as the lab pool, so "Ashrafizadeh"
      // matches both "M. Ashrafizadeh" and "Mehrdad Ashrafizadeh".
      const hasDeniedAuthor = paperAuthors.some(
        (a) => a && a.name && denyAuthorList.some((dn) => nameMatches(a.name, dn))
      );
      if (hasDeniedAuthor) {
        denyAuthorFiltered++;
        return;
      }
      const labMatchCount = countLabAuthorOverlap(paperAuthors, labPool);
      if (labMatchCount < minLabAuthors) {
        labAuthorFiltered++;
        if (labAuthorRejected.length < 20) {
          labAuthorRejected.push({
            title: paper.title,
            year: paper.year,
            venue: paper.venue,
            matchCount: labMatchCount,
          });
        }
        return;
      }
    }

    const doiNorm =
      paper.externalIds && paper.externalIds.DOI ? paper.externalIds.DOI.toLowerCase() : null;

    if (manualTitleSet.has(titleNorm) || (doiNorm && manualDoiSet.has(doiNorm))) {
      manualOverridden++;
      return;
    }

    const existingMatch =
      (doiNorm && existingByDoi.get(doiNorm)) || existingByTitle.get(titleNorm) || null;

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

    uniquePapersMap.set(titleNorm, {
      _existingId: existingMatch && typeof existingMatch.id === 'number' ? existingMatch.id : null,
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

  // -------------------------------------------------------------------------
  // Assign IDs — preserving any existing match's ID, allocating new ones from
  // the next available integer for genuinely new papers. Manual papers reserve
  // their IDs so we don't clash.
  // -------------------------------------------------------------------------
  const usedIds = new Set();
  for (const p of manualPapers) {
    if (typeof p.id === 'number') usedIds.add(p.id);
  }
  let nextId = 1;
  const allocateId = () => {
    while (usedIds.has(nextId)) nextId++;
    const id = nextId;
    usedIds.add(id);
    nextId++;
    return id;
  };

  const autoPapersWithIds = [];
  // First pass: assign preserved IDs (existing-match IDs that aren't already used).
  for (const p of uniquePapersMap.values()) {
    if (p._existingId != null && !usedIds.has(p._existingId)) {
      const { _existingId, ...rest } = p;
      autoPapersWithIds.push({ id: _existingId, ...rest });
      usedIds.add(_existingId);
    } else {
      autoPapersWithIds.push(p); // ID will be allocated in the second pass
    }
  }
  // Second pass: allocate new IDs for those still missing.
  for (const p of autoPapersWithIds) {
    if (p.id == null) {
      const { _existingId, ...rest } = p;
      const newId = allocateId();
      // Replace in place (autoPapersWithIds holds the same reference).
      Object.assign(p, { id: newId, ...rest });
      delete p._existingId;
    } else {
      delete p._existingId;
    }
  }

  // -------------------------------------------------------------------------
  // Combine auto + manual, sort by date (newest first) for the file layout.
  // -------------------------------------------------------------------------
  const finalPapers = [...autoPapersWithIds, ...manualPapers].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  console.log(`\n  ${autoPapersWithIds.length} unique S2 papers after dedup.`);
  console.log(`  ${manualPapers.length} manual papers preserved.`);
  console.log(`  ${finalPapers.length} total papers in output.`);
  if (manualOverridden) console.log(`  ${manualOverridden} S2 papers skipped (overridden by manual entry).`);
  if (denyFiltered) console.log(`  ${denyFiltered} filtered by denyTitles.`);
  if (yearFiltered) console.log(`  ${yearFiltered} filtered by minYear=${minYear}.`);
  if (denyAuthorFiltered) console.log(`  ${denyAuthorFiltered} filtered by denyAuthors.`);
  if (labAuthorFiltered) {
    console.log(
      `  ${labAuthorFiltered} filtered by author overlap (need ≥${minLabAuthors} lab authors).`
    );
    if (labAuthorRejected.length > 0) {
      console.log(`    Rejected (showing up to 20):`);
      labAuthorRejected.forEach((p) =>
        console.log(
          `      [${p.matchCount} lab match] ${p.year} | ${(p.venue || '?').slice(0, 30)} | ${(p.title || '').slice(0, 70)}`
        )
      );
    }
  }

  if (dryRun) {
    console.log(`\n[dry-run] Would write ${finalPapers.length} papers to ${JSON_FILE_PATH}.`);
    return;
  }

  backup(JSON_FILE_PATH);
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(finalPapers, null, 2));
  console.log(
    `\n✅ Saved ${finalPapers.length} papers (IDs preserved across sync, sorted by date). Backup at ${JSON_FILE_PATH}.bak`
  );
}

fetchPapers().catch((error) => {
  console.error('❌ Error fetching papers:', error);
  process.exit(1);
});
