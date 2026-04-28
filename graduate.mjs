// Move a current team member into the alumni list in one step.
//
//   - Removes the member from team.json
//   - Adds a corresponding entry to alumni.json (pre-filled from team data)

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

const TEAM_PATH = './client/src/data/team.json';
const ALUMNI_PATH = './client/src/data/alumni.json';

// Reasonable defaults if the alumni file has no entries yet.
const DEFAULT_ALUMNI_GROUPS = [
  'PhD Graduates',
  'MSc Graduates',
  'Post-Doctoral Fellows',
  'Undergraduate Alumni',
  'Staff',
];

async function main() {
  console.log('=== Graduate Team Member → Alumni ===\n');

  const dryRun = isDryRun();
  if (dryRun) console.log('💧 Dry-run mode: no files will be written.\n');

  const team = readJson(TEAM_PATH, []);
  const alumni = readJson(ALUMNI_PATH, []);

  const candidates = team.filter((m) => m.group !== 'PI' && m.id !== 'pi-1');
  if (candidates.length === 0) {
    console.error('❌ No team members available to graduate.');
    process.exit(1);
  }

  const rl = createPrompt();

  console.log('Pick the team member to graduate:');
  candidates.forEach((m, i) => {
    console.log(`  ${String(i + 1).padStart(2)}) ${m.name}  —  ${m.role}  (${m.group})`);
  });

  let person;
  while (true) {
    const raw = await rl.ask(`\n> Pick [1-${candidates.length}]: `);
    if (raw === null) {
      console.error('❌ stdin closed before a choice was made.');
      rl.close();
      process.exit(1);
    }
    const n = parseInt(raw.trim(), 10);
    if (n >= 1 && n <= candidates.length) {
      person = candidates[n - 1];
      break;
    }
    console.log('  ⚠️  Invalid choice.');
  }

  console.log(`\nGraduating: ${person.name} (${person.role})\n`);

  // Pre-fill from existing data where possible.
  const roleBase = await ask(rl, 'Former role title', { default: person.role, required: true });
  const year = await ask(rl, 'Graduation year', { required: true, validate: validators.year });
  const currentPos = await ask(rl, 'Current position (optional)', {});
  const currentOrg = await ask(rl, 'Current organization (optional)', {});

  const existingGroups = [...new Set(alumni.map((a) => a.group).filter(Boolean))];
  const groupChoices = existingGroups.length ? existingGroups : DEFAULT_ALUMNI_GROUPS;
  const group = await pick(rl, 'Alumni group', groupChoices, {
    allowOther: true,
    otherLabel: 'Enter new group…',
  });

  const maxId = alumni.reduce(
    (max, a) => (typeof a.id === 'number' ? Math.max(max, a.id) : max),
    0
  );

  const newAlum = {
    id: maxId + 1,
    name: person.name,
    former_role: `${roleBase} (${year})`,
    current_position: currentPos || 'NA',
    current_org: currentOrg || 'NA',
    group,
  };

  console.log('\n--- Preview ---');
  console.log('Will REMOVE from team.json:');
  console.log(`  ${person.name} — ${person.role} (${person.group})`);
  console.log('Will ADD to alumni.json:');
  console.log(JSON.stringify(newAlum, null, 2));

  const ok = await confirm(rl, '\nProceed?', false);
  if (!ok) {
    console.log('\n❌ Cancelled. No changes made.');
    rl.close();
    return;
  }

  const newTeam = team.filter((m) => m !== person);
  alumni.push(newAlum);

  writeJson(TEAM_PATH, newTeam, { dryRun });
  writeJson(ALUMNI_PATH, alumni, { dryRun });
  console.log(`\n✅ ${dryRun ? '[dry-run] Would have graduated' : 'Graduated'} ${person.name}.`);

  rl.close();
}

main();
