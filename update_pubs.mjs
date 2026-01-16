import fs from 'fs';
import fetch from 'node-fetch';

// --- CONFIGURATION ---
// Add all the Semantic Scholar IDs you want to merge here.
const AUTHOR_IDS = [
  '2262212',  // Profile 1
  '2283336511',  // Example Profile 2 (Replace with real ID)
  '2239399173',   // Example Profile 3 (Replace with real ID)
  '2255804891',   // Example Profile 4 (Replace with real ID)
  '2330005962',   // Example Profile 5 (Replace with real ID)
]; 

const JSON_FILE_PATH = './client/src/data/publications.json';

async function fetchPapers() {
  try {
    console.log(`Starting fetch for ${AUTHOR_IDS.length} author profiles...`);

    const fetchPromises = AUTHOR_IDS.map(async (id) => {
      // Added 'publicationDate' and 'externalIds' to the requested fields
      const url = `https://api.semanticscholar.org/graph/v1/author/${id}/papers?fields=title,year,authors,venue,url,citationCount,publicationDate,externalIds&limit=500`;
      const response = await fetch(url);
      const data = await response.json();
      return data.data || [];
    });

    const results = await Promise.all(fetchPromises);
    const rawPapers = results.flat();
    console.log(`Fetched ${rawPapers.length} total papers.`);

    // Load existing data to preserve custom images
    let existingPapers = [];
    try {
      if (fs.existsSync(JSON_FILE_PATH)) {
        const fileContent = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
        existingPapers = JSON.parse(fileContent);
      }
    } catch (err) { /* ignore */ }

    const uniquePapersMap = new Map();

    rawPapers.forEach(paper => {
      if (!paper.title) return;

      const normalizedTitle = paper.title.trim().toLowerCase();

      if (!uniquePapersMap.has(normalizedTitle)) {
        
        // Preserve Custom Image
        const existingMatch = existingPapers.find(p => p.title.toLowerCase() === normalizedTitle);
        const imageToUse = (existingMatch && !existingMatch.image.includes('placehold.co')) 
          ? existingMatch.image 
          : "https://placehold.co/200x200/7A003C/white?text=Paper";

        // Logic: Prefer DOI link, fallback to Semantic Scholar URL
        const doiLink = paper.externalIds && paper.externalIds.DOI 
          ? `https://doi.org/${paper.externalIds.DOI}` 
          : paper.url;

        // Logic: Ensure we have a valid date string (fallback to Jan 1st of the year)
        const pubDate = paper.publicationDate || `${paper.year}-01-01`;

        uniquePapersMap.set(normalizedTitle, {
          title: paper.title,
          authors: paper.authors.map(a => a.name).slice(0, 5).join(", ") + (paper.authors.length > 5 ? "..." : ""),
          journal: paper.venue || "Journal",
          year: paper.year,
          date: pubDate,  // <--- NEW FIELD
          image: imageToUse,
          link: doiLink,  // <--- NEW LINK LOGIC
          citationCount: paper.citationCount
        });
      }
    });

    let finalPapers = Array.from(uniquePapersMap.values());

    // SORT BY DATE DESCENDING (Newest First)
    finalPapers.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Re-assign IDs
    finalPapers = finalPapers.map((paper, index) => ({
      id: index + 1,
      ...paper
    }));

    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(finalPapers, null, 2));
    console.log(`✅ Success! Saved ${finalPapers.length} papers (Sorted by Date, linked to DOI).`);

  } catch (error) {
    console.error("❌ Error fetching papers:", error);
  }
}

fetchPapers();