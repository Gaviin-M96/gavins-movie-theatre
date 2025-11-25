// fill-years-from-tmdb.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ES module mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Put your real TMDB API key here:
const TMDB_API_KEY = "a6cda52e53695582aacec71e96e84f2c";

if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
  console.error("Please set TMDB_API_KEY in fill-years-from-tmdb.mjs");
  process.exit(1);
}

const moviesPath = path.join(__dirname, "src", "movies.js");

// Load movies.js and extract the array
function loadMovies() {
  const source = fs.readFileSync(moviesPath, "utf8");

  const match = source.match(/export const movies\s*=\s*(\[[\s\S]*\]);?/);
  if (!match) {
    throw new Error("❌ Could not find `export const movies = [...]` in src/movies.js");
  }

  const arrayCode = match[1];

  // Convert it into an actual array
  const movies = eval(arrayCode);
  if (!Array.isArray(movies)) {
    throw new Error("❌ Parsed movies is not an array");
  }

  return movies;
}

// Save updated data back to movies.js
function saveMovies(movies) {
  const output =
    "export const movies = " + JSON.stringify(movies, null, 2) + ";\n";

  fs.writeFileSync(moviesPath, output, "utf8");
  console.log("✅ Updated src/movies.js with TMDB release years.");
}

// Fetch release year from TMDB
async function fetchMovieYear(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`⚠️ TMDB request failed for id ${tmdbId}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  if (!data.release_date) return null;

  const year = parseInt(data.release_date.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

async function main() {
  const movies = loadMovies();
  console.log(`📀 Found ${movies.length} movies.`);

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];

    if (!m.tmdbId) continue;

    console.log(`(${i + 1}/${movies.length}) ${m.title} → tmdbId=${m.tmdbId}`);

    try {
      const year = await fetchMovieYear(m.tmdbId);
      if (year) {
        m.year = year;
        console.log(`   ✔ updated year → ${year}`);
      } else {
        console.log(`   ⚠️ no year found, keeping ${m.year}`);
      }
    } catch (err) {
      console.warn(`   ⚠️ error for ${m.tmdbId}:`, err.message);
    }
  }

  saveMovies(movies);
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
