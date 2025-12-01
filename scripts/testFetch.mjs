// scripts/testFetch.mjs
import "dotenv/config";
import fetch from "node-fetch";

const API_KEY = process.env.TMDB_API_KEY;
const [, , tmdbIdArg] = process.argv;

if (!tmdbIdArg) {
  console.error("Usage: node scripts/testFetch.mjs <tmdbId>");
  process.exit(1);
}

const tmdbId = Number(tmdbIdArg);

async function fetchMovie(id) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=en-US`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    console.log("RAW MOVIE DATA:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching TMDb data:", err);
  }
}

fetchMovie(tmdbId);
