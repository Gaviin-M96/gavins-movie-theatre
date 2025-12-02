import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------------------------------------------------------
// PATH RESOLUTION — ALWAYS WORKS
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root (up from /scripts)
const rootDir = path.resolve(__dirname, "..");

// Correct input/output paths
const inputFile = path.join(rootDir, "src", "movies_with_category_with_trailers.js");
const outputFile = path.join(rootDir, "src", "movies_updated.js");

// -----------------------------------------------------------------------------
// KEY ORDER (STRUCTURE YOU WANT)
// -----------------------------------------------------------------------------
const keyOrder = [
  "id",
  "title",
  "sortTitle",
  "year",
  "library",
  "metadata",
  "media",
  "text",
  "ratings",
  "credits",
  "youtubeTrailerKey"
];

// Sort object keys recursively
function sortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj && typeof obj === "object") {
    const sorted = {};

    for (const key of keyOrder) {
      if (key in obj) sorted[key] = sortKeys(obj[key]);
    }

    for (const key of Object.keys(obj).sort()) {
      if (!keyOrder.includes(key)) sorted[key] = sortKeys(obj[key]);
    }

    return sorted;
  }
  return obj;
}

// -----------------------------------------------------------------------------
// READ FILE (SAFE IMPORT)
// -----------------------------------------------------------------------------
if (!fs.existsSync(inputFile)) {
  console.error("❌ Input file not found:", inputFile);
  process.exit(1);
}

// Import the movies array dynamically
const { movies } = await import(`file://${inputFile}`);

// -----------------------------------------------------------------------------
// NORMALIZATION LOGIC
// -----------------------------------------------------------------------------
let changedCount = 0;
let unchangedCount = 0;
let details = [];

const normalized = movies.map(movie => {
  const original = JSON.parse(JSON.stringify(movie));
  let changed = false;

  let result = { ...movie };
  result.metadata = result.metadata || {};
  const md = result.metadata;

  // Move youtubeTrailerKey
  if (md.youtubeTrailerKey) {
    result.youtubeTrailerKey = md.youtubeTrailerKey;
    delete md.youtubeTrailerKey;
    changed = true;
    details.push(`[${movie.id}] moved youtubeTrailerKey → top-level`);
  }

  // Move collection → metadata.collection
  if (result.collection) {
    md.collection = result.collection;
    delete result.collection;
    changed = true;
    details.push(`[${movie.id}] moved collection → metadata.collection`);
  }

  // Ensure seasons array
  if (!Array.isArray(md.seasons)) {
    md.seasons = [];
    changed = true;
    details.push(`[${movie.id}] added metadata.seasons []`);
  }

  // Safe creation of missing blocks
  const ensure = (parent, key, def) => {
    if (!(key in parent)) {
      parent[key] = def;
      changed = true;
      details.push(`[${movie.id}] created missing ${key}`);
    }
  };

  ensure(result, "library", { format: "", owned: false, tags: [] });
  ensure(result.library, "tags", []);

  ensure(result, "media", { poster: "", backdrop: "", placeholder: "" });
  ensure(result, "text", {});
  ensure(result, "ratings", { tmdb: {} });
  ensure(result.ratings, "tmdb", {});
  ensure(result, "credits", { castPreview: [] });
  ensure(result.credits, "castPreview", []);

  // Sort keys to match your preferred structure
  result = sortKeys(result);

  // Check if changed
  if (JSON.stringify(original) !== JSON.stringify(result)) {
    changedCount++;
  } else {
    unchangedCount++;
  }

  return result;
});

// -----------------------------------------------------------------------------
// WRITE OUTPUT FILE
// -----------------------------------------------------------------------------
const output = `export const movies = ${JSON.stringify(normalized, null, 2)};\n`;
fs.writeFileSync(outputFile, output, "utf8");

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("------------------------------------------------------------");
console.log(" NORMALIZATION COMPLETE");
console.log("------------------------------------------------------------");
console.log(` Total movies processed:  ${movies.length}`);
console.log(` Movies changed:         ${changedCount}`);
console.log(` Movies unchanged:       ${unchangedCount}`);
console.log("------------------------------------------------------------");
console.log(" Changes:");
details.forEach(d => console.log("  - " + d));
console.log("------------------------------------------------------------");
console.log(` Output written to ${outputFile}`);
