// src/components/MovieModal.jsx
import { useMemo, useState, useEffect } from "react";
import { getRatingBadgeClass } from "./MovieGrid";
import { supabase } from "../api/supabaseClient";
import {
  AiFillStar,
  AiOutlineStar,
  AiFillEye,
  AiOutlineEye,
} from "react-icons/ai";

function MovieModal({
  movie,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  gavinReview,
  onSetGavinRating,
  onSetGavinText,
  movieReviewKey,
  onQuickSearch,
}) {
  const year = movie.year || null;
  const runtime = movie.metadata?.runtimeMinutes ?? null;

  const manualScore = movie.ratings?.score ?? null;
  const tmdbScore = movie.ratings?.tmdb?.voteAverage ?? null;
  const rating = manualScore ?? tmdbScore;

  const genres = movie.metadata?.genres || [];
  const director = movie.credits?.director;
  const cast = movie.credits?.castPreview || [];
  const limitedCast = cast.slice(0, 3);

  const overview = movie.text?.overview || "";

  const posterSrc =
    movie.media?.poster ||
    movie.media?.placeholder ||
    "https://via.placeholder.com/400x600?text=No+Poster";

  // Trailer support (updated path)
  const youtubeKey = movie.youtubeTrailerKey ?? null;
  const directTrailerUrl = movie.metadata?.trailerUrl ?? null;

  const trailerUrl =
    directTrailerUrl ||
    (youtubeKey ? `https://www.youtube.com/watch?v=${youtubeKey}` : null);

  const trailerEmbedUrl = youtubeKey
    ? `https://www.youtube.com/embed/${youtubeKey}`
    : null;

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const [communityName, setCommunityName] = useState("");
  const [communityRating, setCommunityRating] = useState("");
  const [communityText, setCommunityText] = useState("");

  useEffect(() => {
    if (!movieReviewKey) return;

    async function loadReviews() {
      setLoadingReviews(true);
      setReviewsError(null);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_id", movieReviewKey)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading reviews:", error);
        setReviewsError("Could not load reviews.");
        setReviews([]);
      } else {
        setReviews(data || []);
      }

      setLoadingReviews(false);
    }

    loadReviews();
  }, [movieReviewKey]);

  const runtimeLabel = useMemo(() => {
    if (!runtime) return null;
    const hours = Math.floor(runtime / 60);
    const mins = runtime % 60;
    if (!hours) return `${mins} min`;
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }, [runtime]);

  const isTV = movie.metadata?.category === "TV Show";
  const seasons = movie.metadata?.seasons || [];
  const seasonSummary = isTV
    ? `${seasons.length} season${seasons.length > 1 ? "s" : ""} • ${seasons.reduce(
        (sum, s) => sum + (s.episodeCount || 0),
        0
      )} episodes`
    : null;

  const handleGenreClick = (g) => {
    if (!g) return;
    onQuickSearch(g);
  };

  const handleYearClick = () => {
    if (!year) return;
    onQuickSearch(String(year));
  };

  const gavinReviewRow = reviews.find(
    (r) => r.name && r.name.trim().toLowerCase() === "gavin"
  );
  const gavinScoreRaw = gavinReviewRow?.rating ?? null;
  const hasGavinScore =
    typeof gavinScoreRaw === "number" && gavinScoreRaw > 0;
  const gavinDisplay = hasGavinScore ? gavinScoreRaw.toFixed(1) : null;

  const communityReviews = reviews.filter(
    (r) => !gavinReviewRow || r.id !== gavinReviewRow.id
  );

  const handleCommunitySubmit = async (e) => {
    e.preventDefault();

    const num = parseFloat(communityRating);
    if (isNaN(num) || num < 0 || num > 10) return;

    const payload = {
      movie_id: movieReviewKey,
      name: communityName.trim() || "Anonymous",
      rating: num,
      comment: communityText.trim() || null,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Error saving review:", error);
      return;
    }

    setReviews((prev) => [data, ...prev]);
    setCommunityName("");
    setCommunityRating("");
    setCommunityText("");
  };

  return (
    <div className="modal-content">
      {/* Poster column */}
      <div className="modal-poster" style={{ textAlign: "center" }}>
        <img src={posterSrc} alt={movie.title} className="modal-poster-img" />
      </div>

      {/* Info + reviews */}
      <div className="modal-info" style={{ textAlign: "center" }}>
        {/* Title + runtime + season summary */}
        <div className="modal-title-block">
          <div
            className="modal-title-row"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <h2 className="modal-title">{movie.title}</h2>
            {runtimeLabel && <span className="modal-meta-text">{runtimeLabel}</span>}
            {isTV && seasonSummary && (
              <span className="modal-meta-text">{seasonSummary}</span>
            )}
          </div>

          {/* Year + rating chips */}
          <div
            className="modal-meta-row modal-meta-row--chips"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            {year && (
              <button
                type="button"
                className="chip modal-meta-chip"
                onClick={handleYearClick}
              >
                {year}
              </button>
            )}

            {rating != null && (
              <span
                className={"chip modal-rating-chip " + getRatingBadgeClass(rating)}
              >
                ⭐ {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Genres */}
        {genres && genres.length > 0 && (
          <div className="modal-genre-row" style={{ justifyContent: "center" }}>
            {genres.slice(0, 5).map((g) => (
              <button
                key={g}
                type="button"
                className="chip modal-genre-chip"
                onClick={() => handleGenreClick(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Favorite / Watchlist buttons */}
        <div className="card-actions" style={{ justifyContent: "center", marginTop: "0.75rem" }}>
          <button
            type="button"
            className={"icon-button" + (isFavorite ? " icon-button--active" : "")}
            onClick={onToggleFavorite}
            title={isFavorite ? "Remove from favourites" : "Add to favourites"}
          >
            <span className="icon-symbol">{isFavorite ? <AiFillStar /> : <AiOutlineStar />}</span>
          </button>

          <button
            type="button"
            className={"icon-button" + (inWatchlist ? " icon-button--active" : "")}
            onClick={onToggleWatchlist}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            <span className="icon-symbol">{inWatchlist ? <AiFillEye /> : <AiOutlineEye />}</span>
          </button>
        </div>

        {/* Director / Cast */}
        {(director || limitedCast.length > 0) && (
          <div className="modal-people-section" style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8rem", lineHeight: "1.4" }}>
            {director && (
              <p style={{ margin: "4px 0" }}>
                <strong>Directed By:</strong> {director}
              </p>
            )}
            {limitedCast.length > 0 && (
              <p style={{ margin: "4px 0" }}>
                <strong>Starring:</strong> {limitedCast.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Overview */}
        {overview && (
          <p className="modal-overview" style={{ maxWidth: "600px", margin: "1rem auto" }}>
            {overview}
          </p>
        )}

        {/* Trailer */}
        {trailerEmbedUrl && (
          <div className="modal-trailer" style={{ margin: "1.25rem auto", maxWidth: "720px" }}>
            <div className="modal-trailer-inner" style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
              <iframe
                src={trailerEmbedUrl}
                title={`${movie.title} trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="review-sections" style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "center", alignItems: "flex-start", marginTop: "1.5rem" }}>
          {/* Gavin */}
          <section className="review-section review-section--gavin" style={{ flex: "0 1 260px", maxWidth: "280px" }}>
            <div className="review-section-header">
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Gavin&apos;s Score</h3>
            </div>
            <div className="review-section-body">
              <div className="gavin-score-box">
                <span className="gavin-score-icon">{hasGavinScore ? "⭐" : "☆"}</span>
                {hasGavinScore ? (
                  <span className="gavin-score-text">{gavinDisplay}/10</span>
                ) : (
                  <span className="gavin-score-text gavin-score-text--empty">Not Yet Rated</span>
                )}
              </div>
            </div>
          </section>

          {/* Community */}
          <section className="review-section review-section--community" style={{ flex: "1 1 320px", maxWidth: "480px" }}>
            <div className="review-section-header">
              <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>Community Reviews</h3>
              <p style={{ fontSize: "0.8rem" }}>Let me know what you thought. <span style={{ fontWeight: 600 }}>Be honest.</span></p>
            </div>

            {loadingReviews ? (
              <p style={{ fontSize: "0.85rem" }}>Loading reviews...</p>
            ) : reviewsError ? (
              <p style={{ fontSize: "0.85rem" }}>{reviewsError}</p>
            ) : communityReviews.length === 0 ? (
              <p style={{ fontSize: "0.85rem" }}>No community reviews yet. Be the first to rate this movie.</p>
            ) : (
              <ul className="community-list">
                {communityReviews.map((r) => (
                  <li key={r.id} className="community-item">
                    <div className="community-meta">
                      <span style={{ fontSize: "0.85rem" }}>{r.name}</span>
                      <span> ⭐ {Number(r.rating).toFixed(1)} / 10 • {r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : ""}</span>
                    </div>
                    {r.comment && <p style={{ fontSize: "0.85rem" }}>{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}

            <form className="community-form" onSubmit={handleCommunitySubmit}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  className="community-input"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  style={{ maxWidth: "110px" }}
                  placeholder="Rating"
                  value={communityRating}
                  onChange={(e) => setCommunityRating(e.target.value)}
                  className="community-input"
                />
              </div>
              <textarea
                rows={2}
                placeholder="What did you think?"
                value={communityText}
                onChange={(e) => setCommunityText(e.target.value)}
                className="community-textarea"
              />
              <button type="submit" className="btn-primary community-submit">Submit review</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
