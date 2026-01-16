import fs from 'fs';
// Note: If you haven't installed 'node-fetch' yet, run: npm install node-fetch
import fetch from 'node-fetch';

const AUTHOR_ID = '2262212'; // Dr. Soleymani's ID
const JSON_FILE_PATH = './client/src/data/publications.json';

// Changed limit=20 to limit=500
const url = `https://api.semanticscholar.org/graph/v1/author/${AUTHOR_ID}/papers?fields=title,year,authors,venue,url,citationCount&limit=500&sort=year:desc`;

async function fetchPapers() {
  try {
    console.log("Fetching papers from Semantic Scholar...");
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data) {
      throw new Error("No data found. Check Author ID.");
    }

    // 1. Load existing data so we don't lose custom images
    let existingPapers = [];
    try {
      if (fs.existsSync(JSON_FILE_PATH)) {
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
        existingPapers = JSON.parse(fileContent);
      }
    } catch (err) {
      console.log("No existing file found, creating new one.");
    }

    // 2. Format the new data
    const formattedPapers = data.data.map((paper, index) => {
      // Check if we already have this paper in our local file
      // We match by TITLE (ignoring case)
      const existingMatch = existingPapers.find(p => p.title.toLowerCase() === paper.title.toLowerCase());
      
      // If we found a match AND it has a custom image (not a placeholder), use that image.
      // Otherwise, use the placeholder.
      const imageToUse = (existingMatch && !existingMatch.image.includes('placehold.co')) 
        ? existingMatch.image 
        : "https://placehold.co/200x200/7A003C/white?text=Paper";

      return {
        id: index + 1,
        title: paper.title,
        authors: paper.authors.map(a => a.name).slice(0, 5).join(", ") + (paper.authors.length > 5 ? "..." : ""),
        journal: paper.venue || "Journal",
        year: paper.year,
        image: imageToUse, // <--- The smart logic
        link: paper.url,
        citationCount: paper.citationCount
      };
    });

    // 3. Save
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(formattedPapers, null, 2));
    console.log(`✅ Success! Updated ${JSON_FILE_PATH}`);
    console.log(`   (Preserved custom images for ${formattedPapers.filter(p => !p.image.includes('placehold.co')).length} papers)`);

  } catch (error) {
    console.error("❌ Error fetching papers:", error);
  }
}

fetchPapers();