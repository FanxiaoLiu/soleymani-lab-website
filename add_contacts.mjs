import {
  createPrompt,
  ask,
  readJson,
  writeJson,
  validators,
  isDryRun,
  getPositionalArg,
} from './script-utils.mjs';

const JSON_FILE_PATH = './client/src/data/team.json';

// Edit one member's LinkedIn + email, in place.
async function editPerson(rl, member) {
  console.log(`\n──── Editing: ${member.name} (${member.role}) ────`);
  console.log('  Press Enter to keep current value. Type "-" or "clear" to wipe a field.\n');

  const li = await ask(rl, 'LinkedIn URL', {
    default: member.linkedin || '',
    allowClear: true,
    validate: (v) => (v === '' ? null : validators.url(v)),
  });
  member.linkedin = li;

  const em = await ask(rl, 'Email', {
    default: member.email || '',
    allowClear: true,
    validate: (v) => (v === '' ? null : validators.email(v)),
  });
  member.email = em;
}

function renderRoster(members) {
  console.log('\nMembers:');
  members.forEach((m, i) => {
    const li = m.linkedin ? '✓' : '·';
    const em = m.email ? '✓' : '·';
    const idx = String(i + 1).padStart(2);
    console.log(`  ${idx}) [LI ${li}  EM ${em}]  ${m.name}  —  ${m.role}`);
  });
  console.log(`  ${String(members.length + 1).padStart(2)}) Done`);
}

async function pickPersonLoop(rl, members) {
  while (true) {
    renderRoster(members);
    const raw = await rl.ask(
      `\n> Pick a member to edit [1-${members.length}, ${members.length + 1} = done]: `
    );
    if (raw === null) return; // stdin closed (EOF) — stop gracefully
    const n = parseInt(raw.trim(), 10);
    if (n === members.length + 1) return;
    if (n >= 1 && n <= members.length) {
      await editPerson(rl, members[n - 1]);
    } else {
      console.log('  ⚠️  Invalid choice.');
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = isDryRun();
  const allMode = args.includes('--all');
  const nameArg = getPositionalArg();

  console.log('=== Team Contact Info Updater ===');
  if (dryRun) console.log('💧 Dry-run mode: no files will be written.');
  console.log('');

  const teamData = readJson(JSON_FILE_PATH, []);
  // Anyone except the PI is editable here.
  const editable = teamData.filter((m) => m.group !== 'PI' && m.id !== 'pi-1');

  const rl = createPrompt();

  if (nameArg) {
    // Direct mode: `node add_contacts.mjs "Frankie"`
    const needle = nameArg.toLowerCase();
    const matches = editable.filter((m) => m.name.toLowerCase().includes(needle));
    if (matches.length === 0) {
      console.error(`❌ No member matching "${nameArg}" found.`);
      rl.close();
      process.exit(1);
    }
    if (matches.length > 1) {
      console.log(`Multiple matches for "${nameArg}":`);
      matches.forEach((m, i) => console.log(`  ${i + 1}) ${m.name} — ${m.role}`));
      const raw = await rl.ask(`> Pick [1-${matches.length}]: `);
      if (raw === null) {
        console.error('❌ stdin closed before a choice was made.');
        rl.close();
        process.exit(1);
      }
      const n = parseInt(raw.trim(), 10);
      if (!(n >= 1 && n <= matches.length)) {
        console.error('❌ Invalid choice.');
        rl.close();
        process.exit(1);
      }
      await editPerson(rl, matches[n - 1]);
    } else {
      await editPerson(rl, matches[0]);
    }
  } else if (allMode) {
    // Legacy "walk every member" behavior, preserved behind --all.
    console.log('Walking every member (--all mode). Press Enter to skip a field.\n');
    for (const m of editable) await editPerson(rl, m);
  } else {
    // Default: pick-from-list, repeatable.
    await pickPersonLoop(rl, editable);
  }

  writeJson(JSON_FILE_PATH, teamData, { dryRun });
  console.log(`\n✅ ${dryRun ? '[dry-run] Would have written' : 'Saved'} contact updates.`);

  rl.close();
}

main();
