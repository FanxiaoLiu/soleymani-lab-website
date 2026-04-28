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

const JSON_FILE_PATH = './client/src/data/team.json';
const PLACEHOLDER_IMG = 'https://placehold.co/400x500/gray/white?text=Member';

// Field metadata. The order is the order the user is prompted in.
const FIELDS = [
  { key: 'name',           label: 'Name',                                          required: true },
  { key: 'role',           label: 'Role (e.g., PhD Candidate)',                    required: true },
  { key: 'joined',         label: 'Joined (e.g., Fall 2025)',                      required: false },
  { key: 'research_focus', label: 'Research focus',                                required: false },
  { key: 'research_link',  label: 'Research link (e.g., /research/diagnostics)',   required: false },
  { key: 'image',          label: 'Image (filename, URL, or blank for placeholder)', required: false, isImage: true },
  { key: 'group',          label: 'Group',                                         required: true,  isGroup: true },
  { key: 'linkedin',       label: 'LinkedIn URL (optional)',                       required: false, validate: (v) => (v === '' ? null : validators.url(v)) },
  { key: 'email',          label: 'Email (optional)',                              required: false, validate: (v) => (v === '' ? null : validators.email(v)) },
];

function normalizeImage(v) {
  if (!v || v.toLowerCase() === 'na') return PLACEHOLDER_IMG;
  if (v.startsWith('http') || v.startsWith('/')) return v;
  return `/people/${v}`;
}

async function collectField(rl, field, existingGroups, current) {
  if (field.isGroup) {
    return pick(rl, field.label, existingGroups, {
      allowOther: true,
      otherLabel: 'Enter new group…',
      default: current,
    });
  }
  const v = await ask(rl, field.label, {
    required: field.required,
    default: current,
    validate: field.validate,
  });
  return field.isImage ? normalizeImage(v) : v;
}

async function main() {
  console.log('=== Lab Team Directory: Add Member ===');
  console.log('Press Ctrl+C to cancel at any time.\n');

  const dryRun = isDryRun();
  if (dryRun) console.log('💧 Dry-run mode: no files will be written.\n');

  const teamData = readJson(JSON_FILE_PATH, []);

  const pi = teamData.find((p) => p.group === 'PI' || p.id === 'pi-1');
  if (!pi) {
    console.error('❌ PI entry not found in team.json. Refusing to proceed (would corrupt the file).');
    process.exit(1);
  }
  const otherMembers = teamData.filter((p) => p !== pi);
  const existingGroups = [...new Set(otherMembers.map((m) => m.group).filter(Boolean))];

  const rl = createPrompt();
  const newMember = {};

  for (const field of FIELDS) {
    newMember[field.key] = await collectField(rl, field, existingGroups);
  }

  // ID assignment (preserve existing scheme: PI is "pi-1", everyone else numeric).
  const maxId = otherMembers.reduce(
    (max, p) => (typeof p.id === 'number' ? Math.max(max, p.id) : max),
    0
  );
  newMember.id = maxId + 1;

  // Preview + edit-on-confirm loop.
  while (true) {
    console.log('\n--- Preview ---');
    console.log(JSON.stringify(newMember, null, 2));

    const ok = await confirm(rl, '\nIs this correct?', true);
    if (ok) break;

    console.log('\nWhich field would you like to fix?');
    FIELDS.forEach((f, i) => {
      const v = newMember[f.key];
      console.log(`  ${i + 1}) ${f.label}  ›  ${v === '' || v == null ? '<blank>' : v}`);
    });
    console.log(`  ${FIELDS.length + 1}) Cancel (discard everything)`);

    const raw = await rl.ask(`> Pick [1-${FIELDS.length + 1}]: `);
    if (raw === null) {
      console.log('\n[stdin closed — aborting]');
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
      newMember[f.key] = await collectField(rl, f, existingGroups, newMember[f.key]);
    } else {
      console.log('  ⚠️  Invalid choice.');
    }
  }

  const updatedList = [pi, ...otherMembers, newMember];
  writeJson(JSON_FILE_PATH, updatedList, { dryRun });
  console.log(`\n✅ ${dryRun ? '[dry-run] Would have added' : 'Added'} ${newMember.name}.`);

  rl.close();
}

main();
