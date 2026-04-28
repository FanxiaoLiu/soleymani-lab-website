// Interactively assign a graphical-abstract / cover image to a publication.
//
// Safe by design — this script is ADDITIVE ONLY:
//   * Default view shows ONLY papers that are still on the placeholder image,
//     so you cannot accidentally pick a paper that already has a real image.
//   * Use --all to see every paper. Overwriting an existing custom image then
//     requires an explicit "yes, replace it" confirmation.
//   * Pressing Enter at the source prompt skips the paper (no change).
//   * There is no "clear" / "reset to placeholder" option. To revert a paper
//     to placeholder, edit publications.json by hand.
//   * publications.json is backed up to publications.json.bak before any write.
//
// Workflow:
//   1. npm run pubs:image
//   2. Pick a paper from the list of papers needing images.
//   3. On the publisher's page, right-click the graphical abstract → Copy Image
//      Address. Paste it here. (Or: drop a local file path like
//      ~/Downloads/abstract.png — anything Node can read.)
//   4. Script downloads/copies into client/public/pub-images/, updates
//      publications.json, and returns you to the list.
//   5. Pick the next paper, or "Done" to save.

import fs from 'fs';
import os from 'os';
import path from 'path';
import fetch from 'node-fetch';
import {
  createPrompt,
  ask,
  confirm,
  readJson,
  writeJson,
  isDryRun,
  getPositionalArg,
} from './script-utils.mjs';

// --- CONFIG ------------------------------------------------------------------

const PUBS_PATH = './client/src/data/publications.json';
const IMG_DIR = './client/public/pub-images';
const PUBLIC_PREFIX = '/pub-images';
const PLACEHOLDER_HOST = 'placehold.co';
const MIN_IMAGE_BYTES = 4 * 1024;
const REQUEST_TIMEOUT_MS = 30000;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0 Safari/537.36';

// --- helpers -----------------------------------------------------------------

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function isPlaceholder(img) {
  return !img || (typeof img === 'string' && img.includes(PLACEHOLDER_HOST));
}

function isLocalPath(img) {
  return typeof img === 'string' && img.startsWith(PUBLIC_PREFIX + '/');
}

function imageStatus(img) {
  if (!img) return 'none';
  if (isPlaceholder(img)) return 'placeholder';
  if (isLocalPath(img)) return 'local';
  return 'remote';
}

function statusGlyph(status) {
  return { placeholder: '○', local: '✓', remote: '↗', none: '?' }[status] || '?';
}

function extFromContentType(ct) {
  if (!ct) return null;
  const mime = ct.split(';')[0].trim().toLowerCase();
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'image/svg+xml': '.svg',
  };
  return map[mime] || null;
}

function extFromUrlOrPath(s) {
  const m = s.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)(?:\?|#|$)/i);
  if (!m) return null;
  return '.' + m[1].toLowerCase().replace('jpeg', 'jpg');
}

function pickFileBase(pub) {
  return `${pub.id}-${slugify(pub.title || 'paper')}`;
}

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Download from URL → returns { path, size }
async function downloadFromUrl(url, base) {
  const res = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_IMAGE_BYTES) {
    throw new Error(`response too small (${buf.length} bytes) — probably not an image`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct && !ct.toLowerCase().startsWith('image/')) {
    throw new Error(`response Content-Type is "${ct}" — expected image/*`);
  }
  const ext = extFromContentType(ct) || extFromUrlOrPath(url) || '.jpg';
  const dest = base + ext;
  fs.writeFileSync(dest, buf);
  return { path: dest, size: buf.length };
}

// Copy from a local file path → returns { path, size }
function copyFromFile(srcPath, base) {
  const expanded = expandHome(srcPath);
  if (!fs.existsSync(expanded)) throw new Error(`file not found: ${expanded}`);
  const stat = fs.statSync(expanded);
  if (!stat.isFile()) throw new Error(`not a file: ${expanded}`);
  if (stat.size < MIN_IMAGE_BYTES) {
    throw new Error(`file too small (${stat.size} bytes)`);
  }
  const ext = extFromUrlOrPath(expanded) || path.extname(expanded).toLowerCase() || '.jpg';
  const dest = base + ext;
  fs.copyFileSync(expanded, dest);
  return { path: dest, size: stat.size };
}

function renderPubLine(pub, idx) {
  const glyph = statusGlyph(imageStatus(pub.image));
  const idStr = `#${pub.id}`.padEnd(5);
  const title = (pub.title || '').slice(0, 65).padEnd(65);
  const meta = `(${pub.year || '?'} ${pub.journal || ''})`.slice(0, 40);
  return `  ${String(idx + 1).padStart(3)}) ${glyph} ${idStr} ${title} ${meta}`;
}

// Returns true if a change was applied to `pub`, false otherwise.
async function setOnePub(rl, pub, opts) {
  const { dryRun } = opts;

  console.log(`\n──── #${pub.id} ────`);
  console.log(`  Title:   ${pub.title}`);
  console.log(`  Year:    ${pub.year || '?'}`);
  console.log(`  Journal: ${pub.journal || '?'}`);
  console.log(`  DOI:     ${pub.link || '<none>'}`);
  const status = imageStatus(pub.image);
  console.log(`  Image:   [${status}] ${pub.image || '<none>'}`);

  // Guard against accidental overwrite of an already-set image.
  if (status === 'local' || status === 'remote') {
    const ok = await confirm(
      rl,
      '\n  ⚠️  This paper already has a custom image. Replace it?',
      false
    );
    if (!ok) {
      console.log('  Skipped (kept existing image).');
      return false;
    }
  }

  console.log('\n  Source: paste an image URL (http/https), or a local file path.');
  console.log('          Press Enter on its own to skip this paper.\n');

  const raw = await rl.ask('> Image source: ');
  if (raw === null || raw.trim() === '') {
    console.log('  Skipped.');
    return false;
  }
  const input = raw.trim();

  if (!fs.existsSync(IMG_DIR) && !dryRun) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
  }

  const base = path.join(IMG_DIR, pickFileBase(pub));

  if (dryRun) {
    const kind = /^https?:\/\//i.test(input) ? 'download' : 'copy';
    console.log(`  [dry-run] would ${kind} into ${base}.<ext> and set image to ${PUBLIC_PREFIX}/${path.basename(base)}.<ext>`);
    // Don't mutate the publication on dry-run.
    return false;
  }

  let result;
  try {
    if (/^https?:\/\//i.test(input)) {
      console.log('  Downloading…');
      result = await downloadFromUrl(input, base);
    } else {
      console.log('  Copying…');
      result = await copyFromFile(input, base);
    }
  } catch (err) {
    console.log(`  ❌ ${err.message}`);
    console.log('  No change made to this paper.');
    return false;
  }

  pub.image = `${PUBLIC_PREFIX}/${path.basename(result.path)}`;
  console.log(`  ✓ Saved: ${pub.image}  (${(result.size / 1024).toFixed(0)} KB)`);
  return true;
}

// --- main --------------------------------------------------------------------

async function main() {
  const dryRun = isDryRun();
  const showAll = process.argv.includes('--all');
  const idArg = getPositionalArg();

  console.log('=== Publication Image Setter ===');
  console.log('Additive-only: existing custom images are preserved unless you explicitly');
  console.log('confirm replacement. Press Enter on a prompt to skip.');
  if (dryRun) console.log('💧 Dry-run: no files written.');
  console.log('');

  const pubs = readJson(PUBS_PATH, []);
  if (!pubs.length) {
    console.error('❌ No publications found in publications.json.');
    process.exit(1);
  }

  const rl = createPrompt();
  let dirty = false;

  // Direct mode:  npm run pubs:image -- 17
  if (idArg) {
    const id = parseInt(idArg, 10);
    const pub = pubs.find((p) => p.id === id);
    if (!pub) {
      console.error(`❌ No publication with id=${idArg}.`);
      rl.close();
      process.exit(1);
    }
    if (await setOnePub(rl, pub, { dryRun })) dirty = true;
  } else {
    // Interactive picker loop.
    while (true) {
      const list = showAll ? pubs : pubs.filter((p) => isPlaceholder(p.image));
      if (list.length === 0) {
        console.log('🎉 No papers need images. Pass --all to edit any paper.');
        break;
      }

      const total = pubs.length;
      const placeholderCount = pubs.filter((p) => isPlaceholder(p.image)).length;
      const customCount = total - placeholderCount;

      console.log(
        `\n${list.length} paper(s) shown — ${placeholderCount} on placeholder, ${customCount} with custom images${
          showAll ? ' (showing ALL)' : ''
        }`
      );
      console.log('  Legend:  ○ placeholder   ✓ local file   ↗ remote URL\n');
      list.forEach((p, i) => console.log(renderPubLine(p, i)));
      console.log(`\n  ${list.length + 1}) Done`);

      const raw = await rl.ask(`\n> Pick [1-${list.length}, ${list.length + 1} = done]: `);
      if (raw === null) break;
      const t = raw.trim();
      const n = parseInt(t, 10);
      if (n === list.length + 1) break;
      if (!(n >= 1 && n <= list.length)) {
        console.log('  ⚠️  Invalid choice.');
        continue;
      }
      const pub = list[n - 1];
      if (await setOnePub(rl, pub, { dryRun })) dirty = true;
    }
  }

  if (!dirty) {
    console.log('\nNo changes made.');
    rl.close();
    return;
  }

  if (dryRun) {
    console.log('\n[dry-run] Changes were not written.');
  } else {
    writeJson(PUBS_PATH, pubs); // writeJson handles the .bak backup
    console.log(`\n✅ Wrote ${PUBS_PATH}.  Backup at ${PUBS_PATH}.bak`);
  }

  rl.close();
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
