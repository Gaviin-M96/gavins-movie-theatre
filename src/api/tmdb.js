const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
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

// Fetch full details: poster, year, genres, runtime, rating, director, overview
export async function fetchDetailsForMovie(title, yearHint) {
  if (!API_KEY) {
    console.warn("TMDB API key missing. Set VITE_TMDB_API_KEY in .env.local");
    return null;
  }

  // Helper to normalize titles for comparison
  function normalizeTitle(str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/’/g, "'")
      .replace(/[^a-z0-9]+/g, " ") // remove punctuation → spaces
      .replace(/\s+/g, " ")        // collapse spaces
      .trim();
  }

  try {
    // 1) Search by title (and optional year)
    const searchParams = new URLSearchParams({
      api_key: API_KEY,
      query: title,
      include_adult: "false",
      language: "en-US",
      page: "1",
    });

    if (yearHint) {
      searchParams.set("year", String(yearHint));
    }

    const searchRes = await fetch(
      `${TMDB_BASE_URL}/search/movie?${searchParams.toString()}`
    );

    if (!searchRes.ok) {
      console.error("TMDB search error:", searchRes.status, searchRes.statusText);
      return null;
    }

    const searchData = await searchRes.json();
    const results = searchData.results || [];
    if (results.length === 0) {
      console.warn("No TMDB result for:", title, yearHint);
      return null;
    }

    const normQuery = normalizeTitle(title);
    const yearStr = yearHint ? String(yearHint) : null;

    let bestMatch = null;
    let exactTitleAndYear = null;
    let exactTitleOnly = null;
    let sameYearOnly = null;

    for (const r of results) {
      const candidateTitle = r.title || r.original_title || "";
      const normCandidate = normalizeTitle(candidateTitle);
      const candidateYear = r.release_date ? r.release_date.slice(0, 4) : null;

      // Exact normalized title + exact year
      if (normCandidate === normQuery && yearStr && candidateYear === yearStr) {
        exactTitleAndYear = r;
        break; // this is the strongest match, we can stop
      }

      // Exact title, regardless of year
      if (!exactTitleOnly && normCandidate === normQuery) {
        exactTitleOnly = r;
      }

      // Same year, even if title is a bit off
      if (!sameYearOnly && yearStr && candidateYear === yearStr) {
        sameYearOnly = r;
      }
    }

    bestMatch = exactTitleAndYear || exactTitleOnly || sameYearOnly || results[0];

    const tmdbId = bestMatch.id;

    // 2) Fetch full details + credits in one call
    const detailsParams = new URLSearchParams({
      api_key: API_KEY,
      language: "en-US",
      append_to_response: "credits",
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
      (bestMatch.genre_ids || [])
        .map((id) => GENRE_MAP[id])
        .filter(Boolean);

    const runtime = details.runtime || null;
    const rating = details.vote_average || null;
    const overview = details.overview || "";
    let director = null;

    if (details.credits && Array.isArray(details.credits.crew)) {
      const directorEntry = details.credits.crew.find(
        (c) => c.job === "Director"
      );
      if (directorEntry) {
        director = directorEntry.name;
      }
    }

    return {
      tmdbId,
      posterUrl,
      year,
      genres,
      runtime,  // minutes
      rating,   // 0–10
      overview,
      director,
    };
  } catch (e) {
    console.error("TMDB fetch error:", e);
    return null;
  }
}
