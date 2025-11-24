// fix-tmdb-mismatches.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMDB_API_KEY = "a6cda52e53695582aacec71e96e84f2c";

if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
  console.error("Please set TMDB_API_KEY in fix-tmdb-mismatches.mjs");
  process.exit(1);
}

const moviesPath = path.join(__dirname, "src", "movies.js");

// --- Helpers ----------------------------------------------------

function normalizeTitle(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function titlesLookSame(a, b) {
  return normalizeTitle(a) === normalizeTitle(b);
}

function loadMovies() {
  const source = fs.readFileSync(moviesPath, "utf8");

  const match = source.match(/export const movies\s*=\s*(\[[\s\S]*\]);?/);
  if (!match) {
    throw new Error("❌ Could not find `export const movies = [...]` in src/movies.js");
  }

  const arrayCode = match[1];

  // Turn that JS array literal into a real array
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
  console.log("✅ Saved cleaned data back to src/movies.js");
}

async function tmdbFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return await res.json();
}

async function getMovieById(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
  return tmdbFetchJson(url);
}

async function searchMovieByTitleAndYear(title, year) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "en-US",
    query: title,
    include_adult: "false"
  });

  if (year) {
    // use primary_release_year to bias the search
    params.set("primary_release_year", String(year));
  }

  const url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`;
  const data = await tmdbFetchJson(url);
  return data.results || [];
}

// --- Core logic -------------------------------------------------

async function main() {
  const movies = loadMovies();
  console.log(`📀 Loaded ${movies.length} movies from src/movies.js\n`);

  let changedCount = 0;
  let suspectCount = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    if (!movie.tmdbId) {
      // We can try to fill missing ones too
      console.log(
        `(${i + 1}/${movies.length}) ${movie.title} — no tmdbId, trying to find one...`
      );
      try {
        const candidates = await searchMovieByTitleAndYear(movie.title, movie.year);
        const best = candidates[0];

        if (best && titlesLookSame(movie.title, best.title)) {
          movie.tmdbId = best.id;
          if (!movie.year && best.release_date) {
            movie.year = parseInt(best.release_date.slice(0, 4), 10);
          }
          changedCount++;
          console.log(
            `   ✔ Assigned tmdbId=${best.id} (${best.title}, ${best.release_date?.slice(0, 4) || "n/a"})`
          );
        } else {
          console.log("   ⚠️ Could not confidently assign a tmdbId");
        }
      } catch (err) {
        console.log("   ⚠️ Error searching TMDB:", err.message);
      }
      continue;
    }

    // Has a tmdbId – verify it
    console.log(
      `(${i + 1}/${movies.length}) Checking: ${movie.title} (local year: ${
        movie.year ?? "n/a"
      }) → tmdbId=${movie.tmdbId}`
    );

    let tmdb;
    try {
      tmdb = await getMovieById(movie.tmdbId);
    } catch (err) {
      console.log(`   ⚠️ TMDB lookup failed (${err.message}), will try to find a better match...`);
      tmdb = null;
    }

    let tmdbYear = null;
    let tmdbTitle = null;

    if (tmdb) {
      tmdbTitle = tmdb.title || tmdb.name || "";
      if (tmdb.release_date) {
        tmdbYear = parseInt(tmdb.release_date.slice(0, 4), 10);
      }

      const titleSame = titlesLookSame(movie.title, tmdbTitle);
      const yearSame =
        movie.year && tmdbYear ? Math.abs(movie.year - tmdbYear) <= 1 : true;

      if (titleSame && yearSame) {
        console.log(`   ✅ Looks good: "${tmdbTitle}" (${tmdbYear || "n/a"})`);
        continue; // current tmdbId seems correct
      }

      console.log(
        `   ⚠️ Suspicious match: TMDB "${tmdbTitle}" (${tmdbYear || "n/a"}) vs local "${movie.title}" (${
          movie.year ?? "n/a"
        })`
      );
      suspectCount++;
    } else {
      suspectCount++;
    }

    // Try to find a better match using search
    try {
      const candidates = await searchMovieByTitleAndYear(movie.title, movie.year);
      if (!candidates.length) {
        console.log("   ⚠️ No search results; keeping existing tmdbId.");
        continue;
      }

      const best = candidates[0];
      const bestTitle = best.title || best.name || "";
      const bestYear = best.release_date
        ? parseInt(best.release_date.slice(0, 4), 10)
        : null;

      const titleBetter = titlesLookSame(movie.title, bestTitle);
      const yearBetter =
        movie.year && bestYear ? Math.abs(movie.year - bestYear) <= 1 : true;

      if (titleBetter && yearBetter) {
        console.log(
          `   🔁 Updating tmdbId ${movie.tmdbId} → ${best.id} (${bestTitle}, ${
            bestYear || "n/a"
          })`
        );
        movie.tmdbId = best.id;
        if (bestYear) movie.year = bestYear;
        changedCount++;
      } else {
        console.log(
          `   ⚠️ Found candidate "${bestTitle}" (${bestYear || "n/a"}) but it doesn't look clearly better; keeping old tmdbId.`
        );
      }
    } catch (err) {
      console.log("   ⚠️ Error during search:", err.message);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Suspect matches: ${suspectCount}`);
  console.log(`   Updated tmdbId/year for: ${changedCount} movies`);

  saveMovies(movies);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
