// scripts/create_movie_snippet.js
// Usage: node scripts/create_movie_snippet.js <tmdbId> [format]

import dotenv from "dotenv";

dotenv.config();

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("Missing VITE_TMDB_API_KEY in .env");
  process.exit(1);
}

const tmdbId = process.argv[2];
const format = process.argv[3] || "Blu-ray";

if (!tmdbId) {
  console.error("Usage: node scripts/create_movie_snippet.js <tmdbId> [format]");
  process.exit(1);
}

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

async function main() {
  const res = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
  );

  if (!res.ok) {
    console.error("TMDB error:", res.status, res.statusText);
    process.exit(1);
  }

  const data = await res.json();

  const year = data.release_date ? parseInt(data.release_date.slice(0, 4), 10) : null;
  const posterUrl = data.poster_path
    ? `${TMDB_IMAGE_BASE}${data.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Poster";

  const snippet = {
    id: 999, // ← change this to the next id before pasting
    title: data.title,
    year,
    format,
    image: posterUrl,
    tmdbId: data.id,
    genres: (data.genres || []).map((g) => g.name),
  };

  console.log("\nPaste this into src/movies.js and fix the id:\n");
  console.log(JSON.stringify(snippet, null, 2));
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
