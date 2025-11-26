import dotenv from "dotenv";
dotenv.config();

const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error("❌ Missing VITE_TMDB_API_KEY");
  process.exit(1);
}

const tmdbId = process.argv[2];
const format = process.argv[3] || "Blu-ray";

if (!tmdbId) {
  console.log("Usage:");
  console.log("  node scripts/addMovie.js <tmdbId> [format]");
  process.exit(1);
}

const TMDB = "https://api.themoviedb.org/3";
const IMG_500 = "https://image.tmdb.org/t/p/w500";
const IMG_780 = "https://image.tmdb.org/t/p/w780";

async function fetchTMDB(endpoint) {
  const url = `${TMDB}${endpoint}?api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

async function main() {
  const movie = await fetchTMDB(`/movie/${tmdbId}`);
  const credits = await fetchTMDB(`/movie/${tmdbId}/credits`);

  const year = movie.release_date
    ? parseInt(movie.release_date.slice(0, 4))
    : null;

  const director =
    credits.crew.find((c) => c.job === "Director")?.name || "Unknown";

  const castPreview = credits.cast.slice(0, 4).map((c) => c.name);

  const object = {
    id: `${movie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year}`,
    title: movie.title,
    sortTitle: movie.title,
    year,
    library: {
      format,
      owned: true,
      tags: []
    },
    metadata: {
      genres: movie.genres.map((g) => g.name),
      tmdbId: movie.id,
      runtimeMinutes: movie.runtime,
      imdbId: movie.imdb_id,
      status: movie.status,
      originalLanguage: movie.original_language
    },
    media: {
      poster: movie.poster_path ? `${IMG_500}${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `${IMG_780}${movie.backdrop_path}` : null,
      placeholder: `https://via.placeholder.com/300x450?text=${encodeURIComponent(movie.title)}`
    },
    text: {
      overview: movie.overview,
      tagline: movie.tagline || ""
    },
    ratings: {
      tmdb: {
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count
      }
    },
    credits: {
      director,
      castPreview
    }
  };

  console.log("\n✔️  Copy this into movies.json (or movies.js):\n");
  console.log(JSON.stringify(object, null, 2));
}

main().catch((e) => console.error("Error:", e));
