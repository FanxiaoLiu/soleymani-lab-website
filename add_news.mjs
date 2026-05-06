// Add, edit, delete, or list lab news entries (client/src/data/news.json).
//
// Modes (all combinable with --dry-run for safe previewing):
//
//   npm run news:add                         interactive add, walks through fields
//   npm run news:add -- --from-pub           pick a paper, pre-fill a "New publication" entry
//   npm run news:add -- --from-pub 8         pre-fill from paper id=8 specifically
//   npm run news:add -- --from-url <URL>     fetch the page, pre-fill from og: tags
//   npm run news:add -- --edit               pick an entry and edit it
//   npm run news:add -- --edit 3             edit entry id=3 directly
//   npm run news:add -- --delete             pick an entry and delete it
//   npm run news:add -- --delete 3           delete entry id=3 directly
//   npm run news:add -- --list               just list current entries and exit
//   npm run news:add -- --title "Won grant!" --content "We won..." --category Grant
//                                            non-interactive quick add
//
// Date convenience: any field that wants a date accepts "today" / "yesterday"
// or a YYYY-MM-DD string. Default is always today.
//
// Image convenience: provide either a URL, a local file path (will be copied
// into client/public/news/), or leave blank for no image.
//
// Backs up news.json to .bak before any write.

import fs from 'fs';
import os from 'os';
import path from 'path';
import fetch from 'node-fetch';
import {
  createPrompt,
  ask,
  pick,
  confirm,
  readJson,
  writeJson,
  validators,
  isDryRun,
} from './script-utils.mjs';

const NEWS_PATH = './client/src/data/news.json';
const PUBS_PATH = './client/src/data/publications.json';
const NEWS_IMG_DIR = './client/public/news';
const NEWS_IMG_PREFIX = '/news';

// Categories with built-in badge colors in News.jsx (others render as gray).
const KNOWN_CATEGORIES = ['Award', 'Grant', 'Publication', 'Talk', 'Team'];

// --- helpers -----------------------------------------------------------------

const todayISO = () => new Date().toISOString().slice(0, 10);

function parseDate(s) {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  if (t === 'today') return todayISO();
  if (t === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return null;
}

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function nextId(news) {
  return news.reduce((max, n) => Math.max(max, n.id || 0), 0) + 1;
}

function getFlag(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined; // not present
  const next = process.argv[i + 1];
  // Treat as boolean flag if next arg is missing or starts with --
  if (next === undefined || next.startsWith('--')) return true;
  return next;
}

// --- field collectors -------------------------------------------------------

async function askDate(rl, current) {
  const def = current || todayISO();
  while (true) {
    const raw = await ask(rl, 'Date (YYYY-MM-DD or "today"/"yesterday")', { default: def });
    const parsed = parseDate(raw);
    if (parsed) return parsed;
    console.log('  ⚠️  Invalid date format. Use YYYY-MM-DD or "today"/"yesterday".');
  }
}

async function askCategory(rl, news, current) {
  // Show built-in categories first (with badge color hints), then any custom ones.
  const fromData = [...new Set(news.map((n) => n.category).filter(Boolean))];
  const ordered = [
    ...KNOWN_CATEGORIES,
    ...fromData.filter((c) => !KNOWN_CATEGORIES.includes(c)),
  ];
  console.log('\n  Built-in categories have themed badge colors on the page:');
  console.log('    Award (yellow), Grant (green), Publication (blue), Talk (purple), Team (gray)');
  return pick(rl, 'Category', ordered, {
    allowOther: true,
    otherLabel: 'Add new category…',
    default: current,
  });
}

// Image input: URL, local path, or blank. Local files get copied into
// client/public/news/ and the returned value is the public path.
async function askImage(rl, current) {
  const raw = await ask(rl, 'Image (URL, local file path, or blank)', {
    default: current || '',
    allowClear: true,
  });
  if (!raw) return '';

  // Already a remote URL or already a public path → store as-is.
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;

  // Local file → copy into public/news/.
  const expanded = expandHome(raw);
  if (!fs.existsSync(expanded) || !fs.statSync(expanded).isFile()) {
    console.log(`  ⚠️  File not found: ${expanded}. Saving with no image.`);
    return '';
  }
  if (!fs.existsSync(NEWS_IMG_DIR)) fs.mkdirSync(NEWS_IMG_DIR, { recursive: true });
  const ext = path.extname(expanded) || '.jpg';
  const baseName = path.basename(expanded, ext).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const fileName = `${todayISO()}-${baseName}${ext}`;
  const destPath = path.join(NEWS_IMG_DIR, fileName);
  fs.copyFileSync(expanded, destPath);
  console.log(`  ✓ Copied to ${destPath}`);
  return `${NEWS_IMG_PREFIX}/${fileName}`;
}

async function buildEntry(rl, news, prefilled = {}) {
  console.log('');
  const title = await ask(rl, 'Title', { default: prefilled.title, required: true });
  const category = await askCategory(rl, news, prefilled.category);
  const date = await askDate(rl, prefilled.date);
  const content = await ask(rl, 'Content (one paragraph)', {
    default: prefilled.content,
    required: true,
  });
  const link = await ask(rl, 'Link (optional)', {
    default: prefilled.link || '',
    allowClear: true,
    validate: (v) => (v === '' ? null : validators.url(v)),
  });
  const image = await askImage(rl, prefilled.image);
  return { title, date, category, content, image, link };
}

// --- pre-fill helpers --------------------------------------------------------

function prefillFromPub(pub) {
  const authorList = (pub.authors || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.endsWith('...'))
    .slice(0, 3);
  const authorPraise =
    authorList.length === 0
      ? ''
      : authorList.length === 1
        ? ` Congratulations to ${authorList[0]}!`
        : ` Congratulations to ${authorList.slice(0, -1).join(', ')}, and ${authorList.slice(-1)[0]}!`;
  return {
    title: `New publication in ${pub.journal || 'a journal'}`,
    category: 'Publication',
    date: todayISO(),
    content: `Our latest work, "${pub.title}", has been published in ${pub.journal || 'a journal'}.${authorPraise}`,
    link: pub.link || '',
    image: '',
  };
}

function extractMeta(html, key, attr = 'property') {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re1 = new RegExp(`<meta\\b[^>]*\\b${attr}\\s*=\\s*["']${k}["'][^>]*\\bcontent\\s*=\\s*["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta\\b[^>]*\\bcontent\\s*=\\s*["']([^"']+)["'][^>]*\\b${attr}\\s*=\\s*["']${k}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1] : '';
}

function decodeEntities(s) {
  return (s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

async function prefillFromUrl(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return {
    title: decodeEntities(extractMeta(html, 'og:title')),
    content:
      decodeEntities(extractMeta(html, 'og:description')) ||
      decodeEntities(extractMeta(html, 'description', 'name')),
    link: url,
    image: decodeEntities(extractMeta(html, 'og:image')),
    date: todayISO(),
  };
}

// --- pickers ----------------------------------------------------------------

async function pickPubInteractive(rl, pubs) {
  const recent = [...pubs]
    .sort((a, b) => new Date(b.date || '') - new Date(a.date || ''))
    .slice(0, 30);
  console.log('\nRecent publications (top 30 by date):');
  recent.forEach((p, i) =>
    console.log(`  ${String(i + 1).padStart(2)}) #${String(p.id).padStart(3)}  ${(p.title || '').slice(0, 65)}  (${p.year}, ${(p.journal || '').slice(0, 25)})`)
  );
  const raw = await rl.ask(`> Pick [1-${recent.length}, or Enter to cancel]: `);
  if (raw === null || raw.trim() === '') return null;
  const n = parseInt(raw.trim(), 10);
  if (n >= 1 && n <= recent.length) return recent[n - 1];
  console.log('  ⚠️  Invalid choice.');
  return null;
}

async function pickNewsInteractive(rl, news, action) {
  const sorted = [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(`\nNews entries (most recent first):`);
  sorted.forEach((n, i) =>
    console.log(
      `  ${String(i + 1).padStart(2)}) #${String(n.id).padStart(3)}  ${n.date}  [${(n.category || '').padEnd(11)}]  ${(n.title || '').slice(0, 60)}`
    )
  );
  const raw = await rl.ask(`> Pick to ${action} [1-${sorted.length}, or Enter to cancel]: `);
  if (raw === null || raw.trim() === '') return null;
  const n = parseInt(raw.trim(), 10);
  if (n >= 1 && n <= sorted.length) return sorted[n - 1];
  console.log('  ⚠️  Invalid choice.');
  return null;
}

// Edit-on-confirm: show preview, let user fix individual fields without
// re-entering the rest.
async function previewAndEditLoop(rl, entry, news) {
  const FIELDS = ['title', 'category', 'date', 'content', 'link', 'image'];
  while (true) {
    console.log('\n--- Preview ---');
    console.log(JSON.stringify(entry, null, 2));
    const ok = await confirm(rl, '\nLooks good?', true);
    if (ok) return true;

    console.log('\nWhich field to fix?');
    FIELDS.forEach((f, i) => {
      const v = entry[f];
      console.log(`  ${i + 1}) ${f}  ›  ${v === '' || v == null ? '<blank>' : String(v).slice(0, 70)}`);
    });
    console.log(`  ${FIELDS.length + 1}) Cancel (discard everything)`);
    const raw = await rl.ask(`> Pick [1-${FIELDS.length + 1}]: `);
    if (raw === null) return false;
    const n = parseInt(raw.trim(), 10);
    if (n === FIELDS.length + 1) return false;
    if (!(n >= 1 && n <= FIELDS.length)) {
      console.log('  ⚠️  Invalid choice.');
      continue;
    }
    const f = FIELDS[n - 1];
    if (f === 'date') entry.date = await askDate(rl, entry.date);
    else if (f === 'category') entry.category = await askCategory(rl, news, entry.category);
    else if (f === 'image') entry.image = await askImage(rl, entry.image);
    else if (f === 'link') entry.link = await ask(rl, 'Link', { default: entry.link, allowClear: true, validate: (v) => (v === '' ? null : validators.url(v)) });
    else entry[f] = await ask(rl, f.charAt(0).toUpperCase() + f.slice(1), { default: entry[f], required: f === 'title' || f === 'content' });
  }
}

// --- main --------------------------------------------------------------------

async function main() {
  const dryRun = isDryRun();
  const args = process.argv.slice(2);

  console.log('=== News Updater ===');
  if (dryRun) console.log('💧 Dry-run: no files will be written.');
  console.log('');

  const news = readJson(NEWS_PATH, []);
  const pubs = readJson(PUBS_PATH, []);

  // --list: print and exit
  if (args.includes('--list')) {
    console.log(`${news.length} news entries:`);
    [...news]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((n) =>
        console.log(`  #${String(n.id).padStart(3)}  ${n.date}  [${n.category}]  ${(n.title || '').slice(0, 70)}`)
      );
    return;
  }

  const rl = createPrompt();

  // --delete: by id or via picker
  if (args.includes('--delete')) {
    const arg = getFlag('delete');
    let target = null;
    if (typeof arg === 'string') {
      const id = parseInt(arg, 10);
      target = news.find((n) => n.id === id) || null;
      if (!target) { console.error(`❌ No entry with id=${arg}.`); rl.close(); process.exit(1); }
    } else {
      target = await pickNewsInteractive(rl, news, 'delete');
    }
    if (!target) { console.log('Cancelled.'); rl.close(); return; }
    console.log(`\nWill remove: #${target.id}  ${target.date}  ${target.title}`);
    const ok = await confirm(rl, 'Proceed? This cannot be undone (except via the .bak file).', false);
    if (!ok) { console.log('Cancelled.'); rl.close(); return; }
    const updated = news.filter((n) => n.id !== target.id);
    writeJson(NEWS_PATH, updated, { dryRun });
    console.log(`✅ ${dryRun ? '[dry-run] Would remove' : 'Removed'} entry #${target.id}.`);
    rl.close();
    return;
  }

  // --edit: by id or via picker
  if (args.includes('--edit')) {
    const arg = getFlag('edit');
    let target = null;
    if (typeof arg === 'string') {
      const id = parseInt(arg, 10);
      target = news.find((n) => n.id === id) || null;
      if (!target) { console.error(`❌ No entry with id=${arg}.`); rl.close(); process.exit(1); }
    } else {
      target = await pickNewsInteractive(rl, news, 'edit');
    }
    if (!target) { console.log('Cancelled.'); rl.close(); return; }
    console.log(`\nEditing: #${target.id}  ${target.date}  ${target.title}`);
    const updated = await buildEntry(rl, news, target);
    const merged = { ...target, ...updated };
    if (!(await previewAndEditLoop(rl, merged, news))) { console.log('Cancelled.'); rl.close(); return; }
    const idx = news.findIndex((n) => n.id === target.id);
    news[idx] = merged;
    writeJson(NEWS_PATH, news, { dryRun });
    console.log(`✅ ${dryRun ? '[dry-run] Would update' : 'Updated'} entry #${target.id}.`);
    rl.close();
    return;
  }

  // --- Add modes (default + pre-fill variants + quick CLI) ---

  // Quick CLI (non-interactive): require at least --title and --content.
  const cliTitle = getFlag('title');
  const cliContent = getFlag('content');
  if (typeof cliTitle === 'string' && typeof cliContent === 'string') {
    const entry = {
      id: nextId(news),
      title: cliTitle,
      date: parseDate(getFlag('date')) || todayISO(),
      category: typeof getFlag('category') === 'string' ? getFlag('category') : 'Team',
      content: cliContent,
      image: typeof getFlag('image') === 'string' ? getFlag('image') : '',
      link: typeof getFlag('link') === 'string' ? getFlag('link') : '',
    };
    console.log('\n--- Preview ---');
    console.log(JSON.stringify(entry, null, 2));
    const ok = await confirm(rl, 'Add this?', true);
    if (!ok) { console.log('Cancelled.'); rl.close(); return; }
    news.push(entry);
    writeJson(NEWS_PATH, news, { dryRun });
    console.log(`✅ ${dryRun ? '[dry-run] Would add' : 'Added'} entry #${entry.id}.`);
    rl.close();
    return;
  }

  // Pre-fill from publication
  let prefilled = {};
  if (args.includes('--from-pub')) {
    const arg = getFlag('from-pub');
    let pub = null;
    if (typeof arg === 'string') {
      const id = parseInt(arg, 10);
      pub = pubs.find((p) => p.id === id) || null;
      if (!pub) { console.error(`❌ No publication with id=${arg}.`); rl.close(); process.exit(1); }
    } else {
      pub = await pickPubInteractive(rl, pubs);
      if (!pub) { console.log('Cancelled.'); rl.close(); return; }
    }
    prefilled = prefillFromPub(pub);
    console.log(`\n📚 Pre-filled from publication #${pub.id}: ${(pub.title || '').slice(0, 60)}`);
  } else if (args.includes('--from-url')) {
    const url = getFlag('from-url');
    if (typeof url !== 'string') { console.error('❌ --from-url requires a URL value.'); rl.close(); process.exit(1); }
    try {
      console.log(`Fetching ${url}…`);
      prefilled = await prefillFromUrl(url);
      console.log(`🔗 Pre-filled from ${url}`);
    } catch (err) {
      console.warn(`⚠️  Couldn't pre-fill from URL (${err.message}). Continuing with empty fields.`);
    }
  }

  // Interactive build, with edit-on-confirm.
  const collected = await buildEntry(rl, news, prefilled);
  const finalEntry = { id: nextId(news), ...collected };
  if (!(await previewAndEditLoop(rl, finalEntry, news))) { console.log('Cancelled.'); rl.close(); return; }

  news.push(finalEntry);
  writeJson(NEWS_PATH, news, { dryRun });
  console.log(`✅ ${dryRun ? '[dry-run] Would add' : 'Added'} news #${finalEntry.id}.`);

  rl.close();
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
