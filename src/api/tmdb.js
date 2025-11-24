const API_KEY =
  import.meta.env.VITE_TMDB_API_KEY ||
  "a6cda52e53695582aacec71e96e84f2c";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// TMDB movie genre ID → name mapping
const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// Fetch full details: poster, year, genres, runtime, rating, director, cast, overview, trailer
export async function fetchDetailsForMovie(title, yearHint) {
  if (!API_KEY) {
    console.warn(
      "TMDB API key missing. Set VITE_TMDB_API_KEY in .env or hardcode it."
    );
    return null;
  }

  try {
    // --- 1) STRICT SEARCH: title + year (if yearHint provided) ---
    const baseParams = new URLSearchParams({
      api_key: API_KEY,
      query: title,
      include_adult: "false",
      language: "en-US",
      page: "1",
    });

    if (yearHint) {
      baseParams.set("year", String(yearHint));
    }

    const strictRes = await fetch(
      `${TMDB_BASE_URL}/search/movie?${baseParams.toString()}`
    );

    if (!strictRes.ok) {
      console.error(
        "TMDB strict search error:",
        strictRes.status,
        strictRes.statusText
      );
      return null;
    }

    const strictData = await strictRes.json();
    let results = strictData.results || [];

    // --- 2) FALLBACK: if strict search failed AND we had a year, retry WITHOUT year ---
    if ((!results || results.length === 0) && yearHint) {
      console.warn(
        "No TMDB result with year for:",
        title,
        yearHint,
        "— retrying without year"
      );

      const looseParams = new URLSearchParams({
        api_key: API_KEY,
        query: title,
        include_adult: "false",
        language: "en-US",
        page: "1",
      });

      const looseRes = await fetch(
        `${TMDB_BASE_URL}/search/movie?${looseParams.toString()}`
      );

      if (!looseRes.ok) {
        console.error(
          "TMDB loose search error:",
          looseRes.status,
          looseRes.statusText
        );
        return null;
      }

      const looseData = await looseRes.json();
      results = looseData.results || [];
    }

    // If still nothing, give up – but at least we tried both ways
    if (!results || results.length === 0) {
      console.warn("No TMDB result for:", title, yearHint);
      return null;
    }

    // Use the first result as the match
    const match = results[0];
    const tmdbId = match.id;

    // --- 3) Fetch full details + credits + videos in one call ---
    const detailsParams = new URLSearchParams({
      api_key: API_KEY,
      language: "en-US",
      append_to_response: "credits,videos",
    });

    const detailsRes = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?${detailsParams.toString()}`
    );

    if (!detailsRes.ok) {
      console.error(
        "TMDB details error:",
        detailsRes.status,
        detailsRes.statusText
      );
      return null;
    }

    const details = await detailsRes.json();

    const posterUrl = details.poster_path
      ? `${TMDB_IMAGE_BASE}${details.poster_path}`
      : null;

    let year = null;
    if (details.release_date) {
      year = parseInt(details.release_date.slice(0, 4), 10);
    }

    const genres =
      details.genres?.map((g) => g.name) ??
      (match.genre_ids || [])
        .map((id) => GENRE_MAP[id])
        .filter(Boolean);

    const runtime = details.runtime || null;
    const rating = details.vote_average || null;
    const overview = details.overview || "";

    // Director
    let director = null;
    if (details.credits && Array.isArray(details.credits.crew)) {
      const directorEntry = details.credits.crew.find(
        (c) => c.job === "Director"
      );
      if (directorEntry) {
        director = directorEntry.name;
      }
    }

    // Cast names (top 10)
    let cast = [];
    if (details.credits && Array.isArray(details.credits.cast)) {
      cast = details.credits.cast
        .slice(0, 10)
        .map((c) => c.name)
        .filter(Boolean);
    }

    // Trailer (YouTube)
    let trailerKey = null;
    if (details.videos && Array.isArray(details.videos.results)) {
      const youtubeVideos = details.videos.results.filter(
        (v) => v.site === "YouTube"
      );

      const trailer =
        youtubeVideos.find((v) => v.type === "Trailer" && v.official) ||
        youtubeVideos.find((v) => v.type === "Trailer") ||
        youtubeVideos[0];

      if (trailer) {
        trailerKey = trailer.key;
      }
    }

    return {
      tmdbId,
      posterUrl,
      year,
      genres,
      runtime, // minutes
      rating,  // 0–10
      overview,
      director,
      cast,
      trailerKey,
    };
  } catch (e) {
    console.error("TMDB fetch error:", e);
    return null;
  }
}
