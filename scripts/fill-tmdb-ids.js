import { movies } from "../src/movies.js";

const API_KEY = process.env.TMDB_API_KEY; // set this in your env

if (!API_KEY) {
  console.error("Please set TMDB_API_KEY environment variable first.");
  process.exit(1);
}

function normalizeTitle(str) {
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

async function fetchTmdbMatch(movie) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    query: movie.title,
    include_adult: "true",
  });

  if (movie.year) {
    params.set("year", String(movie.year));
  }

  const url = `https://api.themoviedb.org/3/search/movie?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for "${movie.title}"`);
  }
  const data = await res.json();

  const results = data.results || [];
  if (!results.length) {
    console.warn(`No TMDB results for: ${movie.title} (${movie.year ?? "no year"})`);
    return null;
  }

  const normTarget = normalizeTitle(movie.title);

  let best = results[0];
  for (const r of results) {
    const normCandidate = normalizeTitle(r.title || r.original_title || "");
    const yearMatches =
      movie.year && r.release_date
        ? r.release_date.startsWith(String(movie.year))
        : true;

    if (normCandidate === normTarget && yearMatches) {
      best = r;
      break;
    }
  }

  return best;
}

async function main() {
  const updated = [];

  for (const movie of movies) {
    try {
      const match = await fetchTmdbMatch(movie);
      if (!match) {
        updated.push({ ...movie, tmdbId: null });
        continue;
      }

      const tmdbId = match.id;
      console.log(`Matched: ${movie.title} (${movie.year ?? "n/a"}) -> TMDB ${tmdbId}`);
      updated.push({ ...movie, tmdbId });
    } catch (err) {
      console.error(`Error on "${movie.title}":`, err.message);
      updated.push({ ...movie, tmdbId: null });
    }
  }

  console.log("\n\n// ---- UPDATED movies.js BELOW ----\n");
  console.log("export const movies = ");
  console.log(JSON.stringify(updated, null, 2));
  console.log(";");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});