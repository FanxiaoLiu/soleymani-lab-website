import fs from 'fs';
import readline from 'readline';

// --- CONFIGURATION ---
const JSON_FILE_PATH = './client/src/data/team.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log("=== Team Contact Info Updater ===");
  console.log("This script will iterate through all members.");
  console.log("Tip: Press [Enter] to skip/keep the current value.\n");

  // 1. Load Data
  let teamData = [];
  try {
    const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    teamData = JSON.parse(rawData);
  } catch (err) {
    console.error(`❌ Error reading ${JSON_FILE_PATH}.`);
    process.exit(1);
  }

  // 2. Iterate through every member
  for (let i = 0; i < teamData.length; i++) {
    const member = teamData[i];
    
    console.log(`\n------------------------------------------------`);
    console.log(`Processing [${i + 1}/${teamData.length}]: ${member.name} (${member.role})`);
    
    // --- ASK LINKEDIN ---
    const currentLi = member.linkedin ? member.linkedin : "None";
    const liInput = await ask(`> Enter LinkedIn URL (Current: ${currentLi}): `);
    
    // Only update if user typed something
    if (liInput.trim() !== "") {
      member.linkedin = liInput.trim();
    }

    // --- ASK EMAIL ---
    const currentEmail = member.email ? member.email : "None";
    const emailInput = await ask(`> Enter Email Address (Current: ${currentEmail}): `);
    
    // Only update if user typed something
    if (emailInput.trim() !== "") {
      member.email = emailInput.trim();
    }
  }

  // 3. Save
  console.log(`\n------------------------------------------------`);
  console.log("Writing changes to file...");
  fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(teamData, null, 2));
  console.log("✅ Success! All contact info updated.");

  rl.close();
}

main();