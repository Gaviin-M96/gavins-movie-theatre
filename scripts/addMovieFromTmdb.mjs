// scripts/addMovieFromTmdb.mjs
import "dotenv/config";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

if (!API_KEY) {
  console.error("TMDB_API_KEY is missing. Add it to your .env file.");
  process.exit(1);
}

const [, , tmdbIdArg] = process.argv;

if (!tmdbIdArg) {
  console.error("Usage: node scripts/addMovieFromTmdb.mjs <tmdbId>");
  process.exit(1);
}

const tmdbId = Number.parseInt(tmdbIdArg, 10);
if (Number.isNaN(tmdbId)) {
  console.error("tmdbId must be a number.");
  process.exit(1);
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function slugifyTitle(title, year) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${year}`;
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

function makePlaceholder(title) {
  // Simple placeholder; you can tweak text style if you want.
  const encoded = encodeURIComponent(title.replace(/\s+/g, " "));
  return `https://via.placeholder.com/300x450?text=${encoded}`;
}

function extractDirector(credits) {
  const crew = credits.crew || [];
  const directors = crew.filter((p) => p.job === "Director");
  if (directors.length === 0) return null;
  // If multiple directors, join with &.
  return directors.map((d) => d.name).join(" & ");
}

function extractCastPreview(credits, limit = 4) {
  const cast = credits.cast || [];
  return cast.slice(0, limit).map((c) => c.name);
}

async function main() {
  console.log(`Fetching TMDB data for ID ${tmdbId}...`);

  const movieUrl = `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US`;
  const creditsUrl = `${BASE_URL}/movie/${tmdbId}/credits?api_key=${API_KEY}&language=en-US`;

  const [movie, credits] = await Promise.all([
    fetchJson(movieUrl),
    fetchJson(creditsUrl),
  ]);

  const year = normalizeYear(movie.release_date);
  const title = movie.title || movie.original_title;
  const idSlug = slugifyTitle(title, year || "unknown");

  const genres = (movie.genres || []).map((g) => g.name);
  const runtimeMinutes =
    typeof movie.runtime === "number" ? movie.runtime : null;

  const poster = buildImageUrl(movie.poster_path, "w500");
  const backdrop = buildImageUrl(movie.backdrop_path, "w780");
  const placeholder = makePlaceholder(title);

  const director = extractDirector(credits);
  const castPreview = extractCastPreview(credits);

  const result = {
    id: idSlug,
    title,
    sortTitle: title,
    year: year || null,
    library: {
      format: "Blu-ray", // 👈 change this after paste if it's DVD/Digital/etc.
      owned: true,
      tags: [],
    },
    metadata: {
      genres,
      tmdbId,
      runtimeMinutes,
      imdbId: movie.imdb_id || null,
      status: movie.status || "Released",
      originalLanguage: movie.original_language || "en",
    },
    media: {
      poster: poster || placeholder,
      backdrop: backdrop || null,
      placeholder,
    },
    text: {
      overview: movie.overview || "",
      tagline: movie.tagline || "",
    },
    ratings: {
      tmdb: {
        voteAverage:
          typeof movie.vote_average === "number"
            ? movie.vote_average
            : null,
        voteCount:
          typeof movie.vote_count === "number" ? movie.vote_count : null,
      },
    },
    credits: {
      director: director || "",
      castPreview,
    },
  };

  console.log("\n// ---- New movie object ----\n");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n// Copy the above object into src/movies.js\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});