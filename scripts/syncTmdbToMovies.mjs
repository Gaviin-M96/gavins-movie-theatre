// scripts/syncTmdbToMovies.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { movies } from "../src/movies.js";

const API_KEY = process.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

// Optional: be a bit nice to TMDB's rate limits
const SLEEP_MS = 250;

if (!API_KEY) {
  console.error("VITE_TMDB_API_KEY is missing. Add it to your .env file.");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeYear(releaseDate) {
  if (!releaseDate) return null;
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function buildImageUrl(pathSegment, size = "w500") {
  if (!pathSegment) return null;
  return `${IMAGE_BASE}/${size}${pathSegment}`;
}

async function fetchMovieFromTmdb(tmdbId) {
  const url = `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `TMDB request failed for ID ${tmdbId}: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

/**
 * Merge a local movie object with TMDB data.
 * - Preserves: id, library, text, credits, any custom fields
 * - Syncs from TMDB when available:
 *   - title, year, runtimeMinutes, genres, status, originalLanguage,
 *     imdbId, poster, backdrop, tmdb rating
 */
function mergeMovieWithTmdb(movie, tmdb) {
  if (!tmdb) return movie;

  const tmdbYear = normalizeYear(tmdb.release_date);
  const tmdbGenres = (tmdb.genres || []).map((g) => g.name);

  const tmdbPoster = buildImageUrl(tmdb.poster_path, "w500");
  const tmdbBackdrop = buildImageUrl(tmdb.backdrop_path, "w780");

  const localMetadata = movie.metadata ?? {};
  const localMedia = movie.media ?? {};
  const localRatings = movie.ratings ?? {};

  const merged = {
    // keep all existing fields by default
    ...movie,

    // title & sortTitle updated from TMDB where possible
    title: tmdb.title || movie.title,
    sortTitle: movie.sortTitle || tmdb.title || movie.title,

    // year synced if TMDB has one
    year: tmdbYear || movie.year || null,

    metadata: {
      ...localMetadata,
      tmdbId: localMetadata.tmdbId ?? tmdb.id,
      runtimeMinutes:
        typeof tmdb.runtime === "number"
          ? tmdb.runtime
          : localMetadata.runtimeMinutes ?? null,
      genres: tmdbGenres.length > 0 ? tmdbGenres : localMetadata.genres ?? [],
      status: tmdb.status || localMetadata.status,
      originalLanguage:
        tmdb.original_language || localMetadata.originalLanguage,
      imdbId: tmdb.imdb_id || localMetadata.imdbId,
    },

    media: {
      ...localMedia,
      poster: tmdbPoster || localMedia.poster,
      backdrop: tmdbBackdrop || localMedia.backdrop,
      // keep your placeholder as-is
      placeholder: localMedia.placeholder,
    },

    ratings: {
      ...localRatings,
      tmdb: {
        voteAverage:
          typeof tmdb.vote_average === "number"
            ? tmdb.vote_average
            : localRatings.tmdb?.voteAverage ?? null,
        voteCount:
          typeof tmdb.vote_count === "number"
            ? tmdb.vote_count
            : localRatings.tmdb?.voteCount ?? null,
      },
    },
  };

  return merged;
}

async function main() {
  const fixedMovies = [];
  const errors = [];

  let processedWithTmdb = 0;
  let withoutTmdb = 0;

  for (const movie of movies) {
    const tmdbId = movie.metadata?.tmdbId;

    if (!tmdbId) {
      // Nothing to sync, just keep as-is
      fixedMovies.push(movie);
      withoutTmdb++;
      continue;
    }

    try {
      const tmdb = await fetchMovieFromTmdb(tmdbId);
      processedWithTmdb++;

      const merged = mergeMovieWithTmdb(movie, tmdb);
      fixedMovies.push(merged);

      console.log(
        `Synced: ${movie.title} (tmdbId=${tmdbId})`
      );

      if (SLEEP_MS > 0) {
        await sleep(SLEEP_MS);
      }
    } catch (err) {
      console.error(
        `Error syncing movie ${movie.id} (tmdbId=${tmdbId}):`,
        err.message
      );
      errors.push({
        id: movie.id,
        tmdbId,
        title: movie.title,
        error: err.message,
      });
      // On error, keep original movie in the output
      fixedMovies.push(movie);
    }
  }

  const outPath = path.resolve(__dirname, "../src/movies_fixed.js");
  const reportPath = path.resolve(
    __dirname,
    "../tmdb-sync-errors.json"
  );

  const fileContent =
    "export const movies = " +
    JSON.stringify(fixedMovies, null, 2) +
    ";\n\nexport default movies;\n";

  await fs.writeFile(outPath, fileContent, "utf-8");
  await fs.writeFile(reportPath, JSON.stringify(errors, null, 2), "utf-8");

  console.log("--------------------------------------------------");
  console.log(`Movies with TMDB IDs synced: ${processedWithTmdb}`);
  console.log(`Movies without TMDB IDs   : ${withoutTmdb}`);
  console.log(`New file written to       : ${outPath}`);
  console.log(`Error report written to   : ${reportPath}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});