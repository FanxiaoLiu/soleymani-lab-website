import fs from 'fs';
import readline from 'readline';

// --- CONFIGURATION ---
const JSON_FILE_PATH = './client/src/data/alumni.json';

// Defined questions (Split Role and Year)
const questions = [
  { key: 'name', question: "Enter Name (e.g., Dr. John Smith): " },
  { key: 'role_base', question: "Enter Former Role (e.g., PhD Graduate): " },
  { key: 'year', question: "Enter Year (e.g., 2024): " },
  { key: 'current_position', question: "Enter Current Position (e.g., Postdoctoral Fellow): " },
  { key: 'current_org', question: "Enter Current Organization (e.g., MIT): " },
  { key: 'group', question: "Enter Group (e.g., PhD Graduates): " }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log("=== Alumni Directory Updater ===");
  console.log("Press Ctrl+C at any time to cancel.\n");

  let alumniData = [];
  try {
    if (fs.existsSync(JSON_FILE_PATH)) {
      const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
      alumniData = JSON.parse(rawData);
    } else {
      console.log(`⚠️  ${JSON_FILE_PATH} not found. Creating a new one.`);
    }
  } catch (err) {
    console.error(`❌ Error reading file: ${err.message}`);
    process.exit(1);
  }

  // Collect raw answers
  const answers = {};
  for (const q of questions) {
    const response = await ask(q.question);
    answers[q.key] = response.trim();
  }

  // Generate ID
  const maxId = alumniData.reduce((max, p) => (typeof p.id === 'number' ? Math.max(max, p.id) : max), 0);
  
  // Construct the Final Object
  // We automatically format 'former_role' to match your JSON structure: "Role (Year)"
  const newAlum = {
    id: maxId + 1,
    name: answers.name,
    former_role: `${answers.role_base} (${answers.year})`,
    current_position: answers.current_position,
    current_org: answers.current_org,
    group: answers.group
  };

  console.log("\n--- Preview ---");
  console.log(newAlum);

  const confirm = await ask("\nIs this correct? (y/n): ");

  if (confirm.toLowerCase() === 'y') {
    alumniData.push(newAlum);
    // Optional: Sort by Year Descending if you want (Newest graduates first)
    // alumniData.sort((a, b) => {
    //   const yearA = parseInt(a.former_role.match(/\d{4}/)?.[0] || 0);
    //   const yearB = parseInt(b.former_role.match(/\d{4}/)?.[0] || 0);
    //   return yearB - yearA;
    // });

    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(alumniData, null, 2));
    console.log(`\n✅ Success! Added ${newAlum.name} to the alumni list.`);
  } else {
    console.log("\n❌ Cancelled. No changes made.");
  }

  rl.close();
}

main();