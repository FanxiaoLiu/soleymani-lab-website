// Add a publication manually. Useful for papers that aren't on Semantic
// Scholar yet (e.g., new preprints), papers in venues S2 doesn't index, or
// to override metadata that S2 has wrong.
//
// The new entry is written with `"manual": true`. update_pubs.mjs preserves
// any paper marked manual across re-syncs, so manual entries are sticky.

import {
  createPrompt,
  ask,
  confirm,
  readJson,
  writeJson,
  validators,
  isDryRun,
} from './script-utils.mjs';

const PUBS_PATH = './client/src/data/publications.json';
const PLACEHOLDER_IMG = 'https://placehold.co/200x200/7A003C/white?text=Paper';

// --- validators --------------------------------------------------------------

const dateValidator = (v) => {
  if (v === '') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Use YYYY-MM-DD (e.g., 2025-11-14), or leave blank.';
  const d = new Date(v + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return 'Not a real calendar date.';
  return null;
};

const nonNegIntValidator = (v) => {
  if (v === '') return null;
  if (!/^\d+$/.test(v)) return 'Must be a non-negative integer (e.g., 0, 12, 134).';
  return null;
};

// --- field definitions -------------------------------------------------------

const FIELDS = [
  { key: 'title',         label: 'Title', required: true },
  { key: 'authors',       label: 'Authors (comma-separated, e.g. "Doe, J., Smith, A.")', required: true },
  { key: 'journal',       label: 'Journal / venue (e.g., "Nature Reviews Bioengineering")', required: true },
  { key: 'year',          label: 'Year', required: true, validate: validators.year },
  { key: 'date',          label: 'Date YYYY-MM-DD (blank = Jan 1 of that year)', required: false, validate: dateValidator },
  { key: 'link',          label: 'DOI URL or article link', required: true, validate: validators.url },
  { key: 'image',         label: 'Image URL or local /pub-images/ path (blank = placeholder)', required: false },
  { key: 'citationCount', label: 'Citation count (blank = 0)', required: false, validate: nonNegIntValidator },
];

async function collectField(rl, field, current) {
  return ask(rl, field.label, {
    required: field.required,
    default: current,
    validate: field.validate,
  });
}

function buildPub(answers, id) {
  const year = parseInt(answers.year, 10);
  return {
    id,
    title: answers.title,
    authors: answers.authors,
    journal: answers.journal,
    year,
    date: answers.date || `${answers.year}-01-01`,
    image: answers.image || PLACEHOLDER_IMG,
    link: answers.link,
    citationCount:
      answers.citationCount === '' || answers.citationCount == null
        ? 0
        : parseInt(answers.citationCount, 10),
    manual: true,
  };
}

// --- main --------------------------------------------------------------------

async function main() {
  console.log('=== Add Publication (Manual) ===');
  console.log('For papers not on Semantic Scholar, or to override S2 metadata.');
  console.log('Manually-added papers are preserved across "npm run pubs:sync".\n');

  const dryRun = isDryRun();
  if (dryRun) console.log('💧 Dry-run: no files will be written.\n');

  const pubs = readJson(PUBS_PATH, []);
  const maxId = pubs.reduce(
    (max, p) => (typeof p.id === 'number' ? Math.max(max, p.id) : max),
    0
  );
  const newId = maxId + 1;

  const rl = createPrompt();
  const answers = {};
  for (const field of FIELDS) {
    answers[field.key] = await collectField(rl, field);
  }

  let newPub = buildPub(answers, newId);

  // Edit-on-confirm.
  while (true) {
    console.log('\n--- Preview ---');
    console.log(JSON.stringify(newPub, null, 2));

    const ok = await confirm(rl, '\nLook good?', true);
    if (ok) break;

    console.log('\nWhich field to fix?');
    FIELDS.forEach((f, i) => {
      const v = answers[f.key];
      console.log(`  ${i + 1}) ${f.label}  ›  ${v === '' || v == null ? '<blank>' : v}`);
    });
    console.log(`  ${FIELDS.length + 1}) Cancel (discard everything)`);

    const raw = await rl.ask(`> Pick [1-${FIELDS.length + 1}]: `);
    if (raw === null) {
      console.log('\n❌ Cancelled.');
      rl.close();
      return;
    }
    const n = parseInt(raw.trim(), 10);
    if (n === FIELDS.length + 1) {
      console.log('\n❌ Cancelled. No changes made.');
      rl.close();
      return;
    }
    if (n >= 1 && n <= FIELDS.length) {
      const f = FIELDS[n - 1];
      answers[f.key] = await collectField(rl, f, answers[f.key]);
      newPub = buildPub(answers, newId);
    } else {
      console.log('  ⚠️  Invalid choice.');
    }
  }

  // Append + sort by date (newest first), to match the file's existing order.
  pubs.push(newPub);
  pubs.sort((a, b) => new Date(b.date) - new Date(a.date));

  writeJson(PUBS_PATH, pubs, { dryRun });
  console.log(
    `\n✅ ${dryRun ? '[dry-run] Would have added' : 'Added'} #${newPub.id}: ${newPub.title}`
  );
  console.log(`   Backup at ${PUBS_PATH}.bak`);
  console.log(
    '\nTip: this paper is marked "manual": true and will be preserved on the next pubs:sync.'
  );

  rl.close();
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
