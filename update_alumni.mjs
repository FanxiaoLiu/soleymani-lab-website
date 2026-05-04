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

const JSON_FILE_PATH = './client/src/data/alumni.json';

// "former_role" is stored as "Role (Year)", but we ask role + year separately.
const FIELDS = [
  { key: 'name',             label: 'Name',                  required: true },
  { key: 'role_base',        label: 'Former role title',     required: true },
  { key: 'year',             label: 'Graduation year',       required: true,  validate: validators.year },
  { key: 'current_position', label: 'Current position',      required: false },
  { key: 'current_org',      label: 'Current organization',  required: false },
  { key: 'group',            label: 'Group',                 required: true,  isGroup: true },
];

const DEFAULT_GROUPS = ['PhD Graduates', "Master's Graduates", 'Post-Doctoral Fellows', 'Undergraduate Alumni', 'Staff'];

async function collectField(rl, field, existingGroups, current) {
  if (field.isGroup) {
    const choices = existingGroups.length ? existingGroups : DEFAULT_GROUPS;
    return pick(rl, field.label, choices, {
      allowOther: true,
      otherLabel: 'Enter new group…',
      default: current,
    });
  }
  return ask(rl, field.label, {
    required: field.required,
    default: current,
    validate: field.validate,
  });
}

async function main() {
  console.log('=== Alumni Directory: Add Entry ===');
  console.log('Press Ctrl+C to cancel.\n');

  const dryRun = isDryRun();
  if (dryRun) console.log('💧 Dry-run mode: no files will be written.\n');

  const alumni = readJson(JSON_FILE_PATH, []);
  const existingGroups = [...new Set(alumni.map((a) => a.group).filter(Boolean))];

  const rl = createPrompt();
  const answers = {};
  for (const field of FIELDS) {
    answers[field.key] = await collectField(rl, field, existingGroups);
  }

  const maxId = alumni.reduce(
    (max, a) => (typeof a.id === 'number' ? Math.max(max, a.id) : max),
    0
  );
  const newAlum = {
    id: maxId + 1,
    name: answers.name,
    former_role: `${answers.role_base} (${answers.year})`,
    current_position: answers.current_position || 'NA',
    current_org: answers.current_org || 'NA',
    group: answers.group,
  };

  // Edit-on-confirm — store edits back into `answers` and rebuild `former_role`.
  while (true) {
    console.log('\n--- Preview ---');
    console.log(JSON.stringify(newAlum, null, 2));

    const ok = await confirm(rl, '\nIs this correct?', true);
    if (ok) break;

    console.log('\nWhich field would you like to fix?');
    FIELDS.forEach((f, i) => {
      const v = answers[f.key];
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
      answers[f.key] = await collectField(rl, f, existingGroups, answers[f.key]);
      // Rebuild derived fields
      newAlum.name = answers.name;
      newAlum.former_role = `${answers.role_base} (${answers.year})`;
      newAlum.current_position = answers.current_position || 'NA';
      newAlum.current_org = answers.current_org || 'NA';
      newAlum.group = answers.group;
    } else {
      console.log('  ⚠️  Invalid choice.');
    }
  }

  alumni.push(newAlum);
  writeJson(JSON_FILE_PATH, alumni, { dryRun });
  console.log(`\n✅ ${dryRun ? '[dry-run] Would have added' : 'Added'} ${newAlum.name}.`);

  rl.close();
}

main();
