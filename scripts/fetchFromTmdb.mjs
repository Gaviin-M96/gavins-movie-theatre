import "dotenv/config";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const API_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

if (!API_KEY) {
  console.error("TMDB_API_KEY missing in .env");
  process.exit(1);
}

const [, , tmdbIdArg] = process.argv;
if (!tmdbIdArg) {
  console.error("Usage: node scripts/fetchFromTmdb.mjs <tmdbId>");
  process.exit(1);
}
const tmdbId = Number(tmdbIdArg);

async function j(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
}

function slug(title, year) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year}`;
}

function imgUrl(path, size = "w500") {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

async function downloadImage(url, filename) {
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const outDir = "public/assets/posters";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, filename);
  fs.writeFileSync(file, buffer);
  return `/assets/posters/${filename}`;
}

async function fetchDetails(tmdbId) {
  let details, type;
  try {
    details = await j(`${BASE}/tv/${tmdbId}?api_key=${API_KEY}&language=en-US`);
    type = "tv";
  } catch {
    details = await j(`${BASE}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US`);
    type = "movie";
  }
  return { details, type };
}

async function main() {
  const { details, type } = await fetchDetails(tmdbId);

  const credits = await j(`${BASE}/${type}/${tmdbId}/credits?api_key=${API_KEY}&language=en-US`);
  const videos = await j(`${BASE}/${type}/${tmdbId}/videos?api_key=${API_KEY}&language=en-US`);

  const year = details.release_date?.slice(0, 4) || details.first_air_date?.slice(0, 4);
  const title = details.title || details.name;

  const id = slug(title, year);

  const posterRemote = imgUrl(details.poster_path);
  const backdropRemote = imgUrl(details.backdrop_path, "w780");

  const posterLocal = await downloadImage(posterRemote, `${id}-poster.jpg`);
  const backdropLocal = await downloadImage(backdropRemote, `${id}-backdrop.jpg`);

  const trailer = videos.results.find(v => v.type === "Trailer" && v.site === "YouTube");

  const directors =
    type === "movie"
      ? credits.crew.filter(p => p.job === "Director").map(p => p.name).join(", ")
      : "";

  // Build seasons array for TV
  const seasons =
    type === "tv"
      ? details.seasons.map(s => ({
          seasonNumber: s.season_number,
          seasonName: s.name || `Season ${s.season_number}`,
          firstAirDate: s.air_date || null,
          lastAirDate: s.end_date || null,
          episodeCount: s.episode_count || null
        }))
      : [];

  const obj = {
    id,
    title,
    sortTitle: title,
    year: Number(year),
    library: {
      format: "DVD",
      owned: true,
      tags: []
    },
    metadata: {
      genres: details.genres.map(g => g.name),
      tmdbId,
      runtimeMinutes: type === "movie" ? details.runtime : null,
      imdbId: details.imdb_id || null,
      status: details.status,
      originalLanguage: details.original_language,
      category: type === "tv" ? "TV Show" : "Movie",
      seasons
    },
    media: {
      poster: posterLocal,
      backdrop: backdropLocal,
      placeholder: `https://via.placeholder.com/300x450?text=${encodeURIComponent(title)}`
    },
    text: {
      overview: details.overview,
      tagline: details.tagline || ""
    },
    ratings: {
      tmdb: {
        voteAverage: details.vote_average,
        voteCount: details.vote_count
      }
    },
    credits: {
      director: directors,
      castPreview: credits.cast.slice(0, 5).map(c => c.name)
    },
    youtubeTrailerKey: trailer ? trailer.key : null
  };

  console.log("----- COPY THIS INTO movies.js -----\n");
  console.log(JSON.stringify(obj, null, 2));
  console.log("\n------------------------------------");
}

main();
