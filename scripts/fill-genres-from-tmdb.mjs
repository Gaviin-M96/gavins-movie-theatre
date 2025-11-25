// fill-genres-from-tmdb.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Put your real TMDB API key here (same as you use in the app)
const TMDB_API_KEY = "a6cda52e53695582aacec71e96e84f2c";

if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
  console.error("❌ Please set TMDB_API_KEY in fill-genres-from-tmdb.mjs");
  process.exit(1);
}

const moviesPath = path.join(__dirname, "src", "movies.js");

// --- Load movies.js and extract the array ---

function loadMovies() {
  const source = fs.readFileSync(moviesPath, "utf8");

  const match = source.match(/export const movies\s*=\s*(\[[\s\S]*\]);?/);
  if (!match) {
    throw new Error("❌ Could not find `export const movies = [...]` in src/movies.js");
  }

  const arrayCode = match[1];

  // Convert that code into an actual JS array
  // (This runs in Node, on your machine, against your own data.)
  const movies = eval(arrayCode);
  if (!Array.isArray(movies)) {
    throw new Error("❌ Parsed movies is not an array");
  }

  return movies;
}

// --- Save updated movies.js back to disk ---

function saveMovies(movies) {
  const output =
    "export const movies = " + JSON.stringify(movies, null, 2) + ";\n";

  fs.writeFileSync(moviesPath, output, "utf8");
  console.log("✅ Updated src/movies.js with TMDB genres.");
}

// --- Fetch genres from TMDB for a given movie id ---

async function fetchGenresForMovie(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`⚠️ TMDB request failed for id ${tmdbId}: ${res.status} ${res.statusText}`);
    return null;
  }

  const data = await res.json();
  if (!Array.isArray(data.genres) || data.genres.length === 0) {
    return null;
  }

  // Return an array of genre names, e.g. ["Action", "Thriller"]
  return data.genres.map((g) => g.name).filter(Boolean);
}

async function main() {
  const movies = loadMovies();
  console.log(`📀 Found ${movies.length} movies in movies.js`);

  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];

    if (!m.tmdbId) {
      console.log(`(${i + 1}/${movies.length}) ${m.title} → no tmdbId, skipping`);
      continue;
    }

    // Skip if this already has genres
    if (Array.isArray(m.genres) && m.genres.length > 0 && m.genre) {
      console.log(
        `(${i + 1}/${movies.length}) ${m.title} → already has genre(s): ${m.genres.join(
          ", "
        )}, skipping`
      );
      continue;
    }

    console.log(
      `(${i + 1}/${movies.length}) ${m.title} (tmdbId=${m.tmdbId}) → fetching genres...`
    );

    try {
      const genres = await fetchGenresForMovie(m.tmdbId);

      if (genres && genres.length > 0) {
        m.genres = genres;          // full list
        m.genre = genres[0];        // primary genre, for sidebar

        console.log(`   ✔ genres set to [${genres.join(", ")}]`);
      } else {
        console.log("   ⚠️ no genres returned, leaving as-is");
      }
    } catch (err) {
      console.warn(`   ⚠️ error for ${m.tmdbId}:`, err.message);
    }

    // Optional: tiny delay to be gentle to TMDB (remove if you want)
    await new Promise((r) => setTimeout(r, 150));
  }

  saveMovies(movies);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
