// scripts/addMovieFromTmdb.mjs
import "dotenv/config";

const API_KEY = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

if (!API_KEY) {
  console.error("TMDB_API_KEY is missing. Add it to your .env file or set VITE_TMDB_API_KEY.");
  process.exit(1);
}

const [, , tmdbIdArg, formatArg] = process.argv;

if (!tmdbIdArg) {
  console.error("Usage: node scripts/addMovieFromTmdb.mjs <tmdbId> [format]");
  process.exit(1);
}

const tmdbId = Number.parseInt(tmdbIdArg, 10);
if (Number.isNaN(tmdbId)) {
  console.error("tmdbId must be a number.");
  process.exit(1);
}

const DEFAULT_FORMAT = typeof formatArg === "string" && formatArg.length ? formatArg : "Blu-ray";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json();
}

function slugifyTitle(title, year) {
  const base = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-${year || "unknown"}`;
}

function normalizeYear(releaseDate, firstAirDate = null) {
  const date = releaseDate || firstAirDate;
  if (!date) return null;
  const year = Number.parseInt(String(date).slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
}

function buildImageUrl(pathSegment, size = "w500") {
  if (!pathSegment) return null;
  return `${IMAGE_BASE}/${size}${pathSegment}`;
}

function makePlaceholder(title) {
  const encoded = encodeURIComponent(String(title || "No Poster").replace(/\s+/g, "+"));
  return `https://via.placeholder.com/300x450?text=${encoded}`;
}

function extractDirector(credits) {
  const crew = credits?.crew || [];
  const directors = crew.filter((p) => /director/i.test(p.job));
  if (directors.length === 0) return null;
  return directors.map((d) => d.name).join(" & ");
}

function extractCastPreview(credits, limit = 4) {
  const cast = credits?.cast || [];
  return cast.slice(0, limit).map((c) => c.name);
}

function pickYoutubeTrailerKey(videos = []) {
  if (!Array.isArray(videos)) return null;
  // Prefer official YouTube Trailer, then any YouTube Trailer, then any YouTube result
  const official = videos.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official === true);
  if (official) return official.key;
  const trailer = videos.find((v) => v.site === "YouTube" && v.type === "Trailer");
  if (trailer) return trailer.key;
  const any = videos.find((v) => v.site === "YouTube");
  return any ? any.key : null;
}

async function main() {
  console.log(`Fetching TMDB data for ID ${tmdbId}...`);

  // Use append_to_response to get credits, external_ids and videos in one request
  const url = `${BASE_URL}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US&append_to_response=credits,external_ids,videos`;
  let movie;
  try {
    movie = await fetchJson(url);
  } catch (err) {
    // fallback: try TV (optional)
    console.warn(`Movie endpoint failed for ${tmdbId}: ${err.message}. Trying TV endpoint...`);
    try {
      const tvUrl = `${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=en-US&append_to_response=credits,external_ids,videos`;
      movie = await fetchJson(tvUrl);
      movie._is_tv = true; // mark for category handling
    } catch (err2) {
      console.error("Both movie and TV endpoints failed:", err2.message);
      process.exit(1);
    }
  }

  const year = normalizeYear(movie.release_date, movie.first_air_date);
  const title = movie.title || movie.name || movie.original_title || movie.original_name || "Untitled";
  const idSlug = slugifyTitle(title, year);

  const genres = (movie.genres || []).map((g) => g.name);
  const runtimeMinutes =
    typeof movie.runtime === "number" ? movie.runtime : (Array.isArray(movie.episode_run_time) && movie.episode_run_time[0]) || null;

  const poster = buildImageUrl(movie.poster_path, "w500") || null;
  const backdrop = buildImageUrl(movie.backdrop_path, "w780") || null;
  const placeholder = makePlaceholder(title);

  const director = extractDirector(movie.credits || {});
  const castPreview = extractCastPreview(movie.credits || [], 5);

  const youtubeKey = pickYoutubeTrailerKey((movie.videos && movie.videos.results) || []);

  const imdbId =
    movie.imdb_id ||
    (movie.external_ids && movie.external_ids.imdb_id) ||
    null;

  const category = movie._is_tv ? "TV Show" : "Movie";

  const result = {
    id: idSlug,
    title,
    sortTitle: title,
    year: year || null,
    library: {
      format: DEFAULT_FORMAT,
      owned: true,
      tags: [],
    },
    metadata: {
      genres,
      tmdbId,
      runtimeMinutes,
      imdbId,
      status: movie.status || (movie._is_tv ? movie.status : "Released"),
      originalLanguage: movie.original_language || movie.original_language || "en",
      category,
      ...(youtubeKey ? { youtubeTrailerKey: youtubeKey } : {}),
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
        voteAverage: typeof movie.vote_average === "number" ? movie.vote_average : null,
        voteCount: typeof movie.vote_count === "number" ? movie.vote_count : null,
      },
    },
    credits: {
      director: director || "",
      castPreview,
    },
  };

  console.log("\n// ---- New movie object ----\n");
  console.log(JSON.stringify(result, null, 2));
  console.log("\n// Copy the above object into src/movies_*.js (preserve surrounding array export).");
  console.log("// If you want me to automatically append it to your file instead of printing, tell me and I can add that option.");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});
