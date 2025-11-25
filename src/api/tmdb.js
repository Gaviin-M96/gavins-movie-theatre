// src/api/tmdb.js
const API_KEY =
  import.meta.env.VITE_TMDB_API_KEY ||
  "a6cda52e53695582aacec71e96e84f2c";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";

/**
 * Strict + fallback:
 * - Prefer movie.tmdbId (fast & accurate)
 * - If missing, search by title/year
 * - We only really *need* poster, rating, runtime, overview, trailer
 *   (we return year/genres too, but your movies.js data takes priority)
 *
 * @param {{ title: string, year?: number, tmdbId?: number }} movie
 */
export async function fetchDetailsForMovie(movie) {
  if (!API_KEY) {
    console.warn(
      "TMDB API key missing. Set VITE_TMDB_API_KEY in .env or hardcode it."
    );
    return null;
  }

  const { title, year, tmdbId } = movie;

  try {
    let resolvedId = tmdbId;

    // 1) If we DON'T have tmdbId, fall back to search
    if (!resolvedId) {
      const searchParams = new URLSearchParams({
        api_key: API_KEY,
        query: title,
        include_adult: "false",
        language: "en-US",
        page: "1",
      });

      if (year) {
        searchParams.set("year", String(year));
      }

      const searchRes = await fetch(
        `${TMDB_BASE_URL}/search/movie?${searchParams.toString()}`
      );

      if (!searchRes.ok) {
        console.error(
          "TMDB search error:",
          searchRes.status,
          searchRes.statusText
        );
        return null;
      }

      const searchData = await searchRes.json();
      if (!searchData.results || searchData.results.length === 0) {
        console.warn("No TMDB result for:", title, year);
        return null;
      }

      resolvedId = searchData.results[0].id;
    }

    // 2) Fetch details + videos (no credits to keep it lighter)
    const detailsParams = new URLSearchParams({
      api_key: API_KEY,
      language: "en-US",
      append_to_response: "videos",
    });

    const detailsRes = await fetch(
      `${TMDB_BASE_URL}/movie/${resolvedId}?${detailsParams.toString()}`
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

    let finalYear = year ?? null;
    if (details.release_date) {
      const parsedYear = parseInt(details.release_date.slice(0, 4), 10);
      if (!Number.isNaN(parsedYear)) {
        finalYear = parsedYear;
      }
    }

    const genres =
      details.genres?.map((g) => g.name) ??
      [];

    const runtime = details.runtime || null;
    const rating = details.vote_average || null;
    const overview = details.overview || "";

    // Trailer
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
      tmdbId: resolvedId,
      posterUrl,
      year: finalYear,
      genres,
      runtime,  // minutes
      rating,   // 0–10
      overview,
      trailerKey,
    };
  } catch (e) {
    console.error("TMDB fetch error:", e);
    return null;
  }
}
