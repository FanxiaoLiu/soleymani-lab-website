// Interactively edit which publications appear under each research area's
// "Key Publications" dropdown on the Research page.
//
// The mapping lives in client/src/data/research_areas.json under each area's
// `publication_ids` array. This script lets you add, remove, and reorder
// those mappings without editing JSON by hand.
//
// Workflow:
//   npm run research:map
//   1) Pick a research area
//   2) Add a paper (search by title keyword or paper id), remove a paper,
//      or reorder the existing list
//   3) Repeat for other areas, or pick Done to save
//
// Backs up research_areas.json to .bak before any write. Pass --dry-run to
// preview without saving.

import {
  createPrompt,
  ask,
  readJson,
  writeJson,
  isDryRun,
} from './script-utils.mjs';

const AREAS_PATH = './client/src/data/research_areas.json';
const PUBS_PATH = './client/src/data/publications.json';

// --- helpers -----------------------------------------------------------------

function fmtPub(pub) {
  const title = (pub.title || '').slice(0, 70);
  const year = pub.year || '?';
  const journal = (pub.journal || '').slice(0, 25);
  return `#${String(pub.id).padStart(3)}  ${title}  (${year}, ${journal})`;
}

// Search by title keyword or by exact id. Returns up to 30 matches.
function searchPubs(allPubs, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    // No query → show most recent 20 papers
    return [...allPubs]
      .sort((a, b) => new Date(b.date || '') - new Date(a.date || ''))
      .slice(0, 20);
  }
  const asId = parseInt(q, 10);
  return allPubs.filter(
    (p) =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (Number.isFinite(asId) && p.id === asId)
  );
}

// Picker: search → numbered list → choice. Returns the picked pub, or null.
async function pickPub(rl, allPubs, excludeIds) {
  const query = await ask(rl, 'Search papers (title keyword or paper #id, blank for top 20)');
  let matches = searchPubs(allPubs, query).filter((p) => !excludeIds.includes(p.id));

  if (matches.length === 0) {
    console.log('  No matches.');
    return null;
  }

  const shown = matches.slice(0, 30);
  console.log(`\nMatches (${matches.length}${matches.length > 30 ? ', showing first 30' : ''}):`);
  shown.forEach((p, i) => console.log(`  ${String(i + 1).padStart(3)}) ${fmtPub(p)}`));
  console.log(`  ${shown.length + 1}) Cancel`);

  const raw = await rl.ask(`> Pick [1-${shown.length + 1}]: `);
  if (raw === null) return null;
  const n = parseInt(raw.trim(), 10);
  if (n === shown.length + 1) return null;
  if (n >= 1 && n <= shown.length) return shown[n - 1];
  console.log('  ⚠️  Invalid choice.');
  return null;
}

async function reorder(rl, area, mappedPubs) {
  console.log('\nCurrent order:');
  mappedPubs.forEach((p, i) => console.log(`  ${i + 1}) ${fmtPub(p)}`));

  const raw = await rl.ask(
    `> Enter new order as comma-separated positions (e.g., "${
      mappedPubs.length === 1 ? '1' : Array.from({ length: mappedPubs.length }, (_, i) => mappedPubs.length - i).join(',')
    }"), or Enter to cancel: `
  );
  if (raw === null || raw.trim() === '') {
    console.log('  Reorder cancelled.');
    return false;
  }

  const positions = raw
    .trim()
    .split(',')
    .map((s) => parseInt(s.trim(), 10));

  const ok =
    positions.length === mappedPubs.length &&
    positions.every((p) => Number.isFinite(p) && p >= 1 && p <= mappedPubs.length) &&
    new Set(positions).size === positions.length;

  if (!ok) {
    console.log(
      `  ⚠️  Invalid order — must be ${mappedPubs.length} unique positions between 1 and ${mappedPubs.length}.`
    );
    return false;
  }

  area.publication_ids = positions.map((pos) => mappedPubs[pos - 1].id);
  console.log('  ✓ Reordered.');
  return true;
}

// Returns true if the area was modified.
async function editArea(rl, area, allPubs) {
  let changed = false;

  while (true) {
    const ids = area.publication_ids || [];
    const mappedPubs = ids.map((id) => allPubs.find((p) => p.id === id)).filter(Boolean);
    const missing = ids.length - mappedPubs.length;

    console.log(`\n──── ${area.title} ────`);
    console.log(`Currently mapped (${mappedPubs.length}${missing ? ` + ${missing} stale` : ''}):`);
    if (mappedPubs.length === 0) {
      console.log('  (none)');
    } else {
      mappedPubs.forEach((p, i) => console.log(`  ${i + 1}. ${fmtPub(p)}`));
    }
    if (missing > 0) {
      console.log(`  ⚠️  ${missing} mapped id(s) no longer exist in publications.json — they will be cleaned up on save.`);
    }

    console.log('\nActions:');
    console.log('  1) Add a paper');
    console.log('  2) Remove a paper');
    console.log('  3) Reorder');
    console.log('  4) Done with this area');

    const raw = await rl.ask('> Pick [1-4]: ');
    if (raw === null) return changed;
    const n = parseInt(raw.trim(), 10);

    if (n === 4) return changed;

    if (n === 1) {
      const pub = await pickPub(rl, allPubs, ids);
      if (pub) {
        if (!area.publication_ids) area.publication_ids = [];
        area.publication_ids.push(pub.id);
        console.log(`  ✓ Added #${pub.id} (${pub.title.slice(0, 50)}…) to ${area.title}.`);
        changed = true;
      }
    } else if (n === 2) {
      if (mappedPubs.length === 0) {
        console.log('  Nothing to remove.');
        continue;
      }
      const pickRaw = await rl.ask(`> Remove which? [1-${mappedPubs.length}, or Enter to cancel]: `);
      if (pickRaw === null || pickRaw.trim() === '') continue;
      const pickN = parseInt(pickRaw.trim(), 10);
      if (pickN >= 1 && pickN <= mappedPubs.length) {
        const removed = mappedPubs[pickN - 1];
        area.publication_ids = area.publication_ids.filter((x) => x !== removed.id);
        console.log(`  ✓ Removed #${removed.id} from ${area.title}.`);
        changed = true;
      } else {
        console.log('  ⚠️  Invalid choice.');
      }
    } else if (n === 3) {
      if (mappedPubs.length < 2) {
        console.log('  Need at least 2 papers to reorder.');
        continue;
      }
      if (await reorder(rl, area, mappedPubs)) changed = true;
    } else {
      console.log('  ⚠️  Invalid choice.');
    }
  }
}

// Drop ids that no longer match any paper in publications.json.
function pruneStaleIds(areas, allPubs) {
  const valid = new Set(allPubs.map((p) => p.id));
  let pruned = 0;
  for (const a of areas) {
    if (!a.publication_ids) continue;
    const before = a.publication_ids.length;
    a.publication_ids = a.publication_ids.filter((id) => valid.has(id));
    pruned += before - a.publication_ids.length;
  }
  return pruned;
}

// --- main --------------------------------------------------------------------

async function main() {
  const dryRun = isDryRun();

  console.log('=== Research Area ↔ Publication Mapping ===');
  if (dryRun) console.log('💧 Dry-run: no files will be written.');
  console.log('');

  const areas = readJson(AREAS_PATH, []);
  const pubs = readJson(PUBS_PATH, []);

  if (areas.length === 0) {
    console.error('❌ No research areas found in research_areas.json.');
    process.exit(1);
  }
  if (pubs.length === 0) {
    console.error('❌ No publications found. Run "npm run pubs:sync" first.');
    process.exit(1);
  }

  const rl = createPrompt();
  let dirty = false;

  while (true) {
    console.log('\nResearch areas:');
    areas.forEach((a, i) => {
      const count = (a.publication_ids || []).length;
      console.log(`  ${i + 1}) ${a.title}  (${count} paper${count === 1 ? '' : 's'} mapped)`);
    });
    console.log(`  ${areas.length + 1}) Done`);

    const raw = await rl.ask(`\n> Pick area to edit [1-${areas.length + 1}]: `);
    if (raw === null) break;
    const n = parseInt(raw.trim(), 10);
    if (n === areas.length + 1) break;
    if (n >= 1 && n <= areas.length) {
      const changed = await editArea(rl, areas[n - 1], pubs);
      if (changed) dirty = true;
    } else {
      console.log('  ⚠️  Invalid choice.');
    }
  }

  // Prune stale ids on the way out (only logs; doesn't count as "dirty" by itself).
  const pruned = pruneStaleIds(areas, pubs);
  if (pruned > 0) {
    console.log(`\nCleaned up ${pruned} mapping(s) pointing to non-existent papers.`);
    dirty = true;
  }

  if (!dirty) {
    console.log('\nNo changes made.');
    rl.close();
    return;
  }

  if (dryRun) {
    console.log('\n[dry-run] Changes were not written.');
  } else {
    writeJson(AREAS_PATH, areas);
    console.log(`\n✅ Wrote ${AREAS_PATH}.  Backup at ${AREAS_PATH}.bak`);
  }
  rl.close();
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
