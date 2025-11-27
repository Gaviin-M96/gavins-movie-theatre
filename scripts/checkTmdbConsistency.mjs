// scripts/checkTmdbConsistency.mjs
import "dotenv/config";
import fs from "node:fs/promises";
import { movies } from "../src/movies.js";

const API_KEY = process.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

if (!API_KEY) {
  console.error("VITE_TMDB_API_KEY is missing. Add it to your .env file.");
  process.exit(1);
}

function normalizeYear(releaseDate) {
  if (!releaseDate) return null;
  return Number.parseInt(releaseDate.slice(0, 4), 10);
}

function buildImageUrl(path, size) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function sameStringSet(a = [], b = []) {
  const aSet = new Set(a);
  const bSet = new Set(b);
  if (aSet.size !== bSet.size) return false;
  for (const v of aSet) {
    if (!bSet.has(v)) return false;
  }
  return true;
}

async function fetchMovieFromTmdb(tmdbId) {
  const url = `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB request failed for ID ${tmdbId}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function main() {
  const report = [];
  let checked = 0;

  for (const movie of movies) {
    const tmdbId = movie.metadata?.tmdbId;

    if (!tmdbId) {
      // Skip movies without a TMDB link
      continue;
    }

    try {
      const tmdb = await fetchMovieFromTmdb(tmdbId);
      checked++;

      const issues = [];

      // Title
      if (tmdb.title && movie.title !== tmdb.title) {
        issues.push({
          field: "title",
          local: movie.title,
          tmdb: tmdb.title,
        });
      }

      // Year
      const tmdbYear = normalizeYear(tmdb.release_date);
      if (tmdbYear && movie.year && movie.year !== tmdbYear) {
        issues.push({
          field: "year",
          local: movie.year,
          tmdb: tmdbYear,
        });
      }

      // Runtime
      if (
        typeof tmdb.runtime === "number" &&
        movie.metadata?.runtimeMinutes &&
        movie.metadata.runtimeMinutes !== tmdb.runtime
      ) {
        issues.push({
          field: "runtimeMinutes",
          local: movie.metadata.runtimeMinutes,
          tmdb: tmdb.runtime,
        });
      }

      // Genres (by name)
      const tmdbGenres = (tmdb.genres || []).map((g) => g.name);
      const localGenres = movie.metadata?.genres || [];
      if (!sameStringSet(localGenres, tmdbGenres)) {
        issues.push({
          field: "genres",
          local: localGenres,
          tmdb: tmdbGenres,
        });
      }

      // Poster
      const expectedPoster = buildImageUrl(tmdb.poster_path, "w500");
      if (
        expectedPoster &&
        movie.media?.poster &&
        movie.media.poster !== expectedPoster
      ) {
        issues.push({
          field: "media.poster",
          local: movie.media.poster,
          tmdb: expectedPoster,
        });
      }

      // Backdrop
      const expectedBackdrop = buildImageUrl(tmdb.backdrop_path, "w780");
      if (
        expectedBackdrop &&
        movie.media?.backdrop &&
        movie.media.backdrop !== expectedBackdrop
      ) {
        issues.push({
          field: "media.backdrop",
          local: movie.media.backdrop,
          tmdb: expectedBackdrop,
        });
      }

      if (issues.length > 0) {
        report.push({
          id: movie.id,
          tmdbId,
          title: movie.title,
          issues,
        });
      }
    } catch (err) {
      console.error(`Error checking movie ${movie.id} (tmdbId=${movie.metadata?.tmdbId}):`, err.message);
      report.push({
        id: movie.id,
        tmdbId,
        title: movie.title,
        error: err.message,
      });
    }
  }

  const outputPath = "./tmdb-consistency-report.json";
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Checked ${checked} movies with TMDB IDs.`);
  console.log(`Found ${report.length} movies with differences or errors.`);
  console.log(`Report written to ${outputPath}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
