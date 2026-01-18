import fs from 'fs';
import readline from 'readline';
import path from 'path';

// --- CONFIGURATION ---
const JSON_FILE_PATH = './client/src/data/team.json';
const PLACEHOLDER_IMG = "https://placehold.co/400x500/gray/white?text=Member";

// Define the questions we will ask
const questions = [
  { key: 'name', question: "Enter Name (e.g., John Smith): " },
  { key: 'role', question: "Enter Role (e.g., PhD Candidate): " },
  { key: 'joined', question: "Enter Joined Date (e.g., Fall 2025): " },
  { key: 'research_focus', question: "Enter Research Focus (e.g., DNA Sensors): " },
  { key: 'research_link', question: "Enter Research Link (e.g., /research/diagnostics): " },
  { key: 'image', question: "Enter Image Path (Type 'NA' for placeholder): " },
  { key: 'group', question: "Enter Group (e.g., Graduate Students, Undergraduate Students): " }
];

// Setup Readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask a question and return a promise
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log("=== Lab Team Directory Updater ===");
  console.log("Press Ctrl+C at any time to cancel.\n");

  // 1. Load existing data
  let teamData = [];
  try {
    const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    teamData = JSON.parse(rawData);
  } catch (err) {
    console.error(`❌ Error reading ${JSON_FILE_PATH}. Make sure the file exists.`);
    process.exit(1);
  }

  // 2. Separate PI from the rest (We must preserve PI unchanged)
  // Assuming PI is always the first element or identified by "pi-1"
  const pi = teamData.find(p => p.group === 'PI' || p.id === 'pi-1');
  const otherMembers = teamData.filter(p => p.group !== 'PI' && p.id !== 'pi-1');

  // 3. Ask user for input
  const newMember = {};

  for (const q of questions) {
    let answer = await ask(q.question);
    
    // Handle Special Logic for Image
    if (q.key === 'image') {
      if (answer.trim().toUpperCase() === 'NA' || answer.trim() === '') {
        answer = PLACEHOLDER_IMG;
      } else if (!answer.startsWith('http') && !answer.startsWith('/')) {
        // Automatically add /people/ if user just types "john.jpg"
        answer = `/people/${answer}`;
      }
    }

    newMember[q.key] = answer.trim();
  }

  // 4. Generate a new numeric ID (Find max ID + 1)
  const maxId = otherMembers.reduce((max, p) => (typeof p.id === 'number' ? Math.max(max, p.id) : max), 0);
  newMember.id = maxId + 1;

  console.log("\n--- Preview ---");
  console.log(newMember);

  const confirm = await ask("\nIs this correct? (y/n): ");

  if (confirm.toLowerCase() === 'y') {
    // 5. Add to list (PI first, then existing members, then new member)
    // You might want to append to 'otherMembers' and let the page sort them, 
    // or insert them here. We will simply append.
    const updatedList = [pi, ...otherMembers, newMember];

    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(updatedList, null, 2));
    console.log(`\n✅ Success! Added ${newMember.name} to the directory.`);
  } else {
    console.log("\n❌ Cancelled. No changes made.");
  }

  rl.close();
}

main();