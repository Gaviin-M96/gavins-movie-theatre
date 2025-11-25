// scripts/step2_enrich_tmdb.js
// Run with: node scripts/step2_enrich_tmdb.js

import { writeFileSync } from "node:fs";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { movies as baseMovies } from "../movies.structured.js";

dotenv.config();

// IMPORTANT: your key is VITE_TMDB_API_KEY
const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.error("❌ Missing VITE_TMDB_API_KEY in your .env file.");
  process.exit(1);
}

console.log("TMDB API Loaded ✔");

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

async function fetchMovieDetails(tmdbId) {
  const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;

  const res = await fetch(url); // <-- built-in fetch (Node 18+)
  if (!res.ok) {
    throw new Error(`TMDB error for ${tmdbId}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function pickDirector(credits) {
  return credits?.crew?.find(c => c.job === "Director")?.name;
}

function pickCastPreview(credits, limit = 4) {
  return credits?.cast
    ?.slice(0, limit)
    .map(c => c.name)
    .filter(Boolean) ?? [];
}

function img(path, base) {
  return path ? `${base}${path}` : null;
}

async function enrich(movie) {
  try {
    const data = await fetchMovieDetails(movie.metadata.tmdbId);

    return {
      ...movie,

      collection: data.belongs_to_collection?.name
        ? {
            name: data.belongs_to_collection.name,
            tmdbId: data.belongs_to_collection.id
          }
        : undefined,

      metadata: {
        ...movie.metadata,
        imdbId: data.imdb_id || undefined,
        runtimeMinutes: data.runtime ?? null,
        status: data.status || undefined,
        originalLanguage: data.original_language || undefined
      },

      media: {
        ...movie.media,
        poster: img(data.poster_path, TMDB_IMAGE_BASE),
        backdrop: img(data.backdrop_path, TMDB_BACKDROP_BASE)
      },

      text: {
        overview: data.overview || undefined,
        tagline: data.tagline || undefined
      },

      ratings: {
        tmdb: {
          voteAverage: data.vote_average ?? null,
          voteCount: data.vote_count ?? null
        }
      },

      credits: {
        director: pickDirector(data.credits),
        castPreview: pickCastPreview(data.credits)
      }
    };
  } catch (err) {
    console.error(`⚠️ Failed tmdbId=${movie.metadata.tmdbId}:`, err.message);
    return movie;
  }
}

async function main() {
  const enriched = [];

  console.log(`\nFetching TMDB details for ${baseMovies.length} movies...\n`);

  for (const m of baseMovies) {
    console.log(`→ ${m.title}`);
    enriched.push(await enrich(m));
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputPath = path.join(__dirname, "..", "src", "movies.js");

  const output = `// AUTO-GENERATED — FINAL STATIC MOVIE DATA
export const movies = ${JSON.stringify(enriched, null, 2)};
`;

  writeFileSync(outputPath, output, "utf8");

  console.log("\n🎉 DONE! Wrote FINAL src/movies.js");
  console.log(`Total movies: ${enriched.length}`);
}

// 👇 add this
main().catch((err) => {
  console.error("Fatal error in step2_enrich_tmdb:", err);
  process.exit(1);
});
