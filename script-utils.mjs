// Shared helpers for the lab content-management scripts.
// Pure ESM, no extra dependencies (Node 16 compatible).

import fs from 'fs';
import readline from 'readline';

// --- Reader plumbing ---------------------------------------------------------
// Queue-based line reader. Works correctly for both interactive TTY input AND
// piped input (e.g. for demos / automation). Node 16's classic rl.question only
// reliably consumes the first line of piped input, hence this wrapper.

export function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const queue = [];
  const waiters = [];
  let closed = false;

  rl.on('line', (line) => {
    if (waiters.length) waiters.shift()(line);
    else queue.push(line);
  });
  rl.on('close', () => {
    closed = true;
    while (waiters.length) waiters.shift()(null);
  });

  return {
    ask(prompt) {
      process.stdout.write(prompt);
      if (queue.length) return Promise.resolve(queue.shift());
      if (closed) return Promise.resolve(null);
      return new Promise((resolve) => waiters.push(resolve));
    },
    question(prompt) { return this.ask(prompt); }, // alias to match readline API
    close() { rl.close(); },
  };
}

// Treat null (EOF) as graceful exit for the demo / scripting case.
function exitOnEof() {
  console.log('\n[stdin closed before all answers were provided — aborting]');
  process.exit(0);
}

// Ask a question with optional default, validation, required-ness, and clear sentinel.
//   default:    if user presses Enter, return this value
//   required:   if true, empty input re-prompts (unless a default exists)
//   validate:   (value) => string | null   — return error message to re-prompt
//   allowClear: if true, "-" or "clear" returns "" (lets the user wipe a field)
export async function ask(rl, label, opts = {}) {
  const { default: def, required = false, validate, allowClear = false } = opts;
  const hasDefault = def !== undefined && def !== null && def !== '';
  const prompt = hasDefault ? `> ${label} [${def}]: ` : `> ${label}: `;

  while (true) {
    const raw = await rl.ask(prompt);
    if (raw === null) exitOnEof();
    const trimmed = raw.trim();

    if (trimmed === '') {
      if (hasDefault) return def;
      if (required) {
        console.log('  ⚠️  Required, please enter a value.');
        continue;
      }
      return '';
    }

    if (allowClear && (trimmed === '-' || trimmed.toLowerCase() === 'clear')) {
      return '';
    }

    if (validate) {
      const err = validate(trimmed);
      if (err) {
        console.log(`  ⚠️  ${err}`);
        continue;
      }
    }

    return trimmed;
  }
}

// Numbered-menu picker. Returns the chosen string. If allowOther is true, an
// extra "Add new…" option is appended that prompts for free-text input.
export async function pick(rl, label, choices, opts = {}) {
  const { allowOther = false, otherLabel = 'Enter new value…', default: def } = opts;

  console.log(`\n${label}:`);
  choices.forEach((c, i) => {
    const marker = c === def ? ' (current)' : '';
    console.log(`  ${i + 1}) ${c}${marker}`);
  });
  if (allowOther) {
    console.log(`  ${choices.length + 1}) ${otherLabel}`);
  }

  const max = choices.length + (allowOther ? 1 : 0);
  while (true) {
    const raw = await rl.ask(
      `> Pick [1-${max}]${def ? ` (Enter to keep "${def}")` : ''}: `
    );
    if (raw === null) exitOnEof();
    const t = raw.trim();
    if (t === '' && def !== undefined) return def;
    const n = parseInt(t, 10);
    if (!isNaN(n) && n >= 1 && n <= choices.length) return choices[n - 1];
    if (allowOther && n === choices.length + 1) {
      const other = await ask(rl, 'Enter new value', { required: true });
      return other;
    }
    console.log('  ⚠️  Invalid choice.');
  }
}

export async function confirm(rl, label, def = true) {
  const tag = def ? 'Y/n' : 'y/N';
  while (true) {
    const raw = await rl.ask(`${label} (${tag}): `);
    if (raw === null) exitOnEof();
    const t = raw.trim().toLowerCase();
    if (t === '') return def;
    if (t === 'y' || t === 'yes') return true;
    if (t === 'n' || t === 'no') return false;
    console.log('  ⚠️  Please answer y or n.');
  }
}

// --- File helpers ------------------------------------------------------------

export function readJson(path, fallback = []) {
  try {
    if (!fs.existsSync(path)) return fallback;
    return JSON.parse(fs.readFileSync(path, 'utf-8'));
  } catch (err) {
    console.error(`❌ Error reading ${path}: ${err.message}`);
    process.exit(1);
  }
}

export function backup(path) {
  if (fs.existsSync(path)) {
    fs.copyFileSync(path, `${path}.bak`);
  }
}

export function writeJson(path, data, opts = {}) {
  const { dryRun = false } = opts;
  if (dryRun) {
    const summary = Array.isArray(data) ? `${data.length} entries` : 'object';
    console.log(`  [dry-run] would write ${path} (${summary})`);
    return;
  }
  backup(path);
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

// --- Validators --------------------------------------------------------------

export const validators = {
  email: (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Doesn\'t look like an email address.',
  url: (v) => {
    try {
      new URL(v);
      return null;
    } catch {
      return 'Doesn\'t look like a valid URL.';
    }
  },
  year: (v) => (/^\d{4}$/.test(v) ? null : 'Year should be a 4-digit number.'),
};

// --- CLI flags ---------------------------------------------------------------

export function isDryRun() {
  return process.argv.includes('--dry-run');
}

export function getPositionalArg() {
  return process.argv.slice(2).find((a) => !a.startsWith('--'));
}
