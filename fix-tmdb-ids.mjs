// fix-tmdb-ids.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔑 Your TMDB key here:
const TMDB_API_KEY = "YOUR_TMDB_API_KEY_HERE";

if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
  console.error("Please set TMDB_API_KEY in fix-tmdb-ids.mjs");
  process.exit(1);
}

const moviesPath = path.join(__dirname, "src", "movies.js");

/* ---------- Helpers to load/save movies ---------- */

function loadMovies() {
  const source = fs.readFileSync(moviesPath, "utf8");

  const exportIndex = source.indexOf("export const movies");
  if (exportIndex === -1) {
    throw new Error("❌ Could not find `export const movies` in src/movies.js");
  }

  const firstBracket = source.indexOf("[", exportIndex);
  const lastBracket = source.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    throw new Error("❌ Could not locate movies array brackets in src/movies.js");
  }

  const arrayCode = source.slice(firstBracket, lastBracket + 1);

  // Use eval so we accept JS-style array (trailing commas, no quotes on keys, etc.)
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
  console.log("✅ Saved updated src/movies.js");
}

/* ---------- Title similarity helpers ---------- */

function normalizeTitle(str) {
  return (str || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['‘’“”"¡¿?!.:,]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9]+/g, "");
}

function titlesSimilar(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  // Ignore leading "the"
  const naNoThe = na.replace(/^the/, "");
  const nbNoThe = nb.replace(/^the/, "");
  if (naNoThe === nbNoThe) return true;

  // Allow substring match for slightly different marketing titles
  if (na.includes(nb) || nb.includes(na)) return true;

  return false;
}

function yearsClose(localYear, tmdbYear) {
  if (!localYear || !tmdbYear) return true;
  return Math.abs(localYear - tmdbYear) <= 1;
}

/* ---------- TMDB helpers ---------- */

async function fetchMovieById(tmdbId) {
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

async function searchMovie(movie) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    language: "en-US",
    query: movie.title,
    include_adult: "true",
  });

  if (movie.year) {
    params.set("year", String(movie.year));
  }

  const url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`   ⚠️ search failed for "${movie.title}": ${res.status}`);
    return [];
  }

  const data = await res.json();
  return data.results || [];
}

function getYearFromDate(dateStr) {
  if (!dateStr) return null;
  const y = parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(y) ? null : y;
}

/* ---------- Main logic ---------- */

async function main() {
  const movies = loadMovies();
  console.log(`📀 Loaded ${movies.length} movies from src/movies.js`);

  let kept = 0;
  let fixed = 0;
  let invalid = 0;
  let unresolved = 0;

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    if (!movie.tmdbId) continue;

    console.log(`\n(${i + 1}/${movies.length}) Checking "${movie.title}" (local tmdbId=${movie.tmdbId})`);

    let tmdbData = null;
    try {
      tmdbData = await fetchMovieById(movie.tmdbId);
    } catch (err) {
      console.warn(`   ⚠️ error fetching id ${movie.tmdbId}: ${err.message}`);
    }

    if (!tmdbData) {
      console.log(`   ❌ current tmdbId ${movie.tmdbId} is invalid or not found`);
      invalid++;
    } else {
      const tmdbTitle = tmdbData.title || tmdbData.original_title || "";
      const tmdbYear = getYearFromDate(tmdbData.release_date);

      const looksGood =
        titlesSimilar(movie.title, tmdbTitle) &&
        yearsClose(movie.year, tmdbYear);

      if (looksGood) {
        console.log(`   ✅ kept existing ID ${movie.tmdbId} → "${tmdbTitle}" (${tmdbYear || "n/a"})`);
        // If we don’t have a year yet, fill it from TMDB
        if (!movie.year && tmdbYear) {
          movie.year = tmdbYear;
          console.log(`   ➕ added missing year → ${tmdbYear}`);
        }
        kept++;
        continue;
      }

      console.log(
        `   ⚠️ mismatch: TMDB="${tmdbTitle}" (${tmdbYear || "n/a"}) does not match local title/year`
      );
    }

    // At this point, either invalid or mismatched — try to find a better one
    const results = await searchMovie(movie);

    if (!results.length) {
      console.log(`   ❌ no TMDB search results for "${movie.title}"`);
      unresolved++;
      continue;
    }

    // Rank candidates
    const normLocal = normalizeTitle(movie.title);

    let best = null;
    let bestScore = -1;

    for (const r of results) {
      const tmdbTitle = r.title || r.original_title || "";
      const tmdbYear = getYearFromDate(r.release_date);

      const normCandidate = normalizeTitle(tmdbTitle);
      let score = 0;

      if (normCandidate === normLocal) score += 5;
      else if (titlesSimilar(movie.title, tmdbTitle)) score += 3;

      if (yearsClose(movie.year, tmdbYear)) score += 2;

      score += Math.min((r.popularity || 0) / 10, 3); // popularity bump

      if (score > bestScore) {
        bestScore = score;
        best = { ...r, _score: score, _tmdbYear: tmdbYear };
      }
    }

    if (!best) {
      console.log(`   ❌ could not choose a best match for "${movie.title}"`);
      unresolved++;
      continue;
    }

    const bestNorm = normalizeTitle(best.title || best.original_title || "");
    const tmdbYear = best._tmdbYear;

    const strongTitleMatch =
      bestNorm === normLocal || titlesSimilar(movie.title, best.title || best.original_title || "");
    const strongYearMatch = yearsClose(movie.year, tmdbYear);

    if (!strongTitleMatch) {
      console.log(
        `   ❌ best candidate "${best.title}" (${tmdbYear || "n/a"}) still not a strong title match (score=${best._score.toFixed(
          2
        )}). Skipping.`
      );
      unresolved++;
      continue;
    }

    console.log(
      `   🔁 replacing tmdbId=${movie.tmdbId} with ${best.id} → "${best.title}" (${tmdbYear || "n/a"})`
    );
    movie.tmdbId = best.id;

    if (tmdbYear && (!movie.year || !strongYearMatch)) {
      movie.year = tmdbYear;
      console.log(`   ✏ updated year → ${tmdbYear}`);
    }

    fixed++;
  }

  saveMovies(movies);

  console.log("\n📊 Summary:");
  console.log(`   ✅ kept valid IDs:      ${kept}`);
  console.log(`   🔁 fixed mismatches:    ${fixed}`);
  console.log(`   ❌ invalid unresolved:  ${invalid}`);
  console.log(`   ❓ unresolved matches:  ${unresolved}`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
