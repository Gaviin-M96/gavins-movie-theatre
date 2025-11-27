// scripts/setCategoriesFromTmdb.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { movies } from "../src/movies_fixed.js";

const API_KEY = process.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

if (!API_KEY) {
  console.error("VITE_TMDB_API_KEY is missing. Add it to your .env file.");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Try to resolve a TMDB ID as a movie first, then as a TV show.
 * Returns:
 *   { baseKind: "Movie" | "TV", data }
 */
async function resolveTmdbType(tmdbId) {
  // Try movie endpoint
  const movieUrl = `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US`;
  let res = await fetch(movieUrl);

  if (res.ok) {
    const data = await res.json();
    return { baseKind: "Movie", data };
  }

  if (res.status !== 404) {
    throw new Error(`Movie endpoint failed: ${res.status} ${res.statusText}`);
  }

  // Try TV endpoint if movie was 404
  const tvUrl = `${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=en-US`;
  res = await fetch(tvUrl);

  if (res.ok) {
    const data = await res.json();
    return { baseKind: "TV", data };
  }

  throw new Error(
    `Neither movie nor TV endpoint resolved tmdbId=${tmdbId} (last: ${res.status} ${res.statusText})`
  );
}

/**
 * Infer a more specific category from TMDB data:
 * - Movie / TV Show
 * - Concert (music + "live"/"concert"/"tour" etc.)
 * - Stand-Up (comedy + "stand-up"/"standup" in overview/title)
 * - Mini-Series (TV type "Miniseries")
 * - Documentary Series (TV with Documentary genre)
 * - Special (short runtime / special-like)
 */
function inferCategoryFromTmdb(baseKind, tmdbData) {
  const genres = (tmdbData.genres || []).map((g) => g.name);
  const genreSet = new Set(genres.map((g) => g.toLowerCase()));

  const title =
    (tmdbData.title || tmdbData.name || "").toLowerCase();
  const overview = (tmdbData.overview || "").toLowerCase();

  // Helper flags
  const hasMusic = genreSet.has("music");
  const hasDocumentary = genreSet.has("documentary");
  const hasComedy = genreSet.has("comedy");

  const mentionsLive =
    title.includes("live") ||
    title.includes("concert") ||
    title.includes("tour") ||
    overview.includes("live") ||
    overview.includes("concert") ||
    overview.includes("tour");

  const mentionsStandup =
    title.includes("stand-up") ||
    title.includes("standup") ||
    overview.includes("stand-up") ||
    overview.includes("standup");

  // Runtime in minutes (movies) or approx from TV episode runtimes
  let runtimeMinutes = null;
  if (typeof tmdbData.runtime === "number") {
    runtimeMinutes = tmdbData.runtime;
  } else if (
    Array.isArray(tmdbData.episode_run_time) &&
    tmdbData.episode_run_time.length > 0
  ) {
    runtimeMinutes = tmdbData.episode_run_time[0];
  }

  // --- TV baseKind ---
  if (baseKind === "TV") {
    const tvType = (tmdbData.type || "").toLowerCase();

    if (tvType === "miniseries" || tvType === "limited") {
      return "Mini-Series";
    }

    if (hasDocumentary) {
      return "Documentary Series";
    }

    return "TV Show";
  }

  // --- MOVIE baseKind ---
  // Concert: usually Music + live/concert/tour language
  if (hasMusic && mentionsLive) {
    return "Concert";
  }

  // Stand-Up: Comedy + "stand-up" style language
  if (hasComedy && mentionsStandup) {
    return "Stand-Up";
  }

  // Special: very short "movie" (e.g. < 50–60 minutes) and often Comedy/Music
  if (
    baseKind === "Movie" &&
    runtimeMinutes != null &&
    runtimeMinutes <= 60 &&
    (hasComedy || hasMusic || hasDocumentary)
  ) {
    return "Special";
  }

  // Default
  return "Movie";
}

async function main() {
  const updated = [];
  const errors = [];

  let moviesWithTmdb = 0;
  let moviesWithoutTmdb = 0;
  let alreadyHadCategory = 0;

  const statsByCategory = {};

  for (const movie of movies) {
    const tmdbId = movie.metadata?.tmdbId;

    // If no TMDB ID, just keep the movie as-is
    if (!tmdbId) {
      moviesWithoutTmdb++;
      updated.push(movie);
      continue;
    }

    // If the movie already has a category, we respect it.
    if (movie.metadata?.category) {
      alreadyHadCategory++;
      updated.push(movie);
      continue;
    }

    try {
      const { baseKind, data } = await resolveTmdbType(tmdbId);
      moviesWithTmdb++;

      const inferredCategory = inferCategoryFromTmdb(baseKind, data);

      const newMetadata = {
        ...movie.metadata,
        category: inferredCategory,
      };

      const patched = {
        ...movie,
        metadata: newMetadata,
      };

      statsByCategory[inferredCategory] =
        (statsByCategory[inferredCategory] || 0) + 1;

      console.log(
        `Set category for ${movie.title} (tmdbId=${tmdbId}) -> ${inferredCategory}`
      );

      updated.push(patched);
    } catch (err) {
      console.error(
        `Error resolving type for ${movie.id} (tmdbId=${tmdbId}):`,
        err.message
      );
      errors.push({
        id: movie.id,
        tmdbId,
        title: movie.title,
        error: err.message,
      });
      // On error, keep original movie
      updated.push(movie);
    }
  }

  const outPath = path.resolve(__dirname, "../src/movies_with_category.js");
  const reportPath = path.resolve(
    __dirname,
    "../tmdb-category-errors.json"
  );

  const fileContent =
    "export const movies = " +
    JSON.stringify(updated, null, 2) +
    ";\n\nexport default movies;\n";

  await fs.writeFile(outPath, fileContent, "utf-8");
  await fs.writeFile(reportPath, JSON.stringify(errors, null, 2), "utf-8");

  console.log("--------------------------------------------------");
  console.log(`Movies with TMDB IDs           : ${moviesWithTmdb}`);
  console.log(`Movies without TMDB IDs        : ${moviesWithoutTmdb}`);
  console.log(`Movies that already had category: ${alreadyHadCategory}`);
  console.log("Category counts from inference :");
  Object.entries(statsByCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  console.log(`New file written to            : ${outPath}`);
  console.log(`Error report written to        : ${reportPath}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
