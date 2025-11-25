// sync-genres-from-tmdb.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Put your real TMDB API key here
const TMDB_API_KEY = "a6cda52e53695582aacec71e96e84f2c";

if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
  console.error("Please set TMDB_API_KEY in sync-genres-from-tmdb.mjs");
  process.exit(1);
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const moviesPath = path.join(__dirname, "src", "movies.js");

// --- Helpers to load & save movies.js ---

function loadMovies() {
  const source = fs.readFileSync(moviesPath, "utf8");

  // Grab the array inside: export const movies = [ ... ];
  const match = source.match(/export const movies\s*=\s*(\[[\s\S]*\]);?/);
  if (!match) {
    throw new Error("❌ Could not find `export const movies = [...]` in src/movies.js");
  }

  const arrayCode = match[1];

  // Evaluate just the array literal
  const movies = eval(arrayCode);
  if (!Array.isArray(movies)) {
    throw new Error("❌ Parsed movies is not an array");
  }

  return movies;
}

function saveMovies(movies) {
  const output =
    "export const movies = " + JSON.stringify(movies, null, 2) + ";\n";

  fs.writeFileSync(moviesPath, output, "utf8");
  console.log("✅ Updated src/movies.js with fresh TMDB genres.");
}

// --- TMDB fetch ---

async function fetchGenresForMovie(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`⚠️ TMDB request failed for id ${tmdbId}: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  if (!Array.isArray(data.genres) || data.genres.length === 0) {
    return [];
  }

  // TMDB returns [{id, name}, ...]
  return data.genres.map((g) => g.name).filter(Boolean);
}

// --- Main script ---

async function main() {
  const movies = loadMovies();
  console.log(`🎬 Found ${movies.length} movies in movies.js`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];

    if (!m.tmdbId) {
      skippedCount++;
      console.log(
        `(${i + 1}/${movies.length}) Skipping "${m.title}" – no tmdbId`
      );
      continue;
    }

    console.log(
      `(${i + 1}/${movies.length}) Updating genres for "${m.title}" (tmdbId=${m.tmdbId})`
    );

    try {
      const genres = await fetchGenresForMovie(m.tmdbId);

      if (genres && genres.length) {
        m.genres = genres;
        // Optional: remove old single-genre field so everything uses `genres`
        if (m.genre) {
          delete m.genre;
        }
        updatedCount++;
        console.log(`   ✔ genres → [${genres.join(", ")}]`);
      } else {
        console.log("   ⚠️ No genres returned, leaving existing values as-is.");
      }

      // Small delay to be gentle with TMDB API (optional)
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.warn(`   ⚠️ Error for tmdbId=${m.tmdbId}:`, err.message);
    }
  }

  saveMovies(movies);
  console.log(
    `🎉 Done. Updated genres for ${updatedCount} movie(s). Skipped ${skippedCount} without tmdbId.`
  );
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
