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

  const youtubeKey = movie.youtubeTrailerKey ?? null;
  const trailerEmbedUrl = youtubeKey
    ? `https://www.youtube.com/embed/${youtubeKey}`
    : null;

  const [trailerOpen, setTrailerOpen] = useState(false);
  const openTrailer = () => setTrailerOpen(true);
  const closeTrailer = () => setTrailerOpen(false);

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
  const hasGavinScore = typeof gavinScoreRaw === "number" && gavinScoreRaw > 0;
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
    <div className={`modal-content${movie.tags?.includes("superbit") ? " superbit" : ""}`}>
      {/* Poster */}
      <div className="modal-poster" style={{ textAlign: "center" }}>
        <img src={posterSrc} alt={movie.title} className="modal-poster-img" />
      </div>

      {/* Info */}
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
            <h2 className="modal-title">
              {movie.title}
              {movie.tags?.includes("superbit") && (
                <span className="badge-superbit">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    style={{ marginRight: "4px" }}
                  >
                    <path d="M8 0L6.5 5H1L5 8L3.5 13L8 10L12.5 13L11 8L15 5H9.5L8 0Z" />
                  </svg>
                  Superbit
                </span>
              )}
            </h2>
            {runtimeLabel && <span className="modal-meta-text">{runtimeLabel}</span>}
            {isTV && seasonSummary && (
              <span className="modal-meta-text">{seasonSummary}</span>
            )}
          </div>

          {/* Year + rating */}
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
              <span className={"chip modal-rating-chip " + getRatingBadgeClass(rating)}>
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

        {/* Favorite / Watchlist */}
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
            {director && <p><strong>Directed By:</strong> {director}</p>}
            {limitedCast.length > 0 && <p><strong>Starring:</strong> {limitedCast.join(", ")}</p>}
          </div>
        )}

        {/* Overview */}
        {overview && <p className="modal-overview" style={{ maxWidth: "600px", margin: "1rem auto" }}>{overview}</p>}

        {/* Trailer Button */}
        {trailerEmbedUrl && (
          <div style={{ margin: "1rem 0" }}>
            <button className="btn-primary" onClick={openTrailer}>
              ▶ Play Trailer
            </button>
          </div>
        )}

        {/* Reviews (Gavin + Community) */}
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
              <p style={{ fontSize: "0.8rem" }}>Let me know what you thought. <strong>Be honest.</strong></p>
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
                <input type="text" placeholder="Your name (optional)" value={communityName} onChange={(e) => setCommunityName(e.target.value)} className="community-input" />
                <input type="number" min="0" max="10" step="0.1" style={{ maxWidth: "110px" }} placeholder="Rating" value={communityRating} onChange={(e) => setCommunityRating(e.target.value)} className="community-input" />
              </div>
              <textarea rows={2} placeholder="What did you think?" value={communityText} onChange={(e) => setCommunityText(e.target.value)} className="community-textarea" />
              <button type="submit" className="btn-primary community-submit">Submit review</button>
            </form>
          </section>
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerOpen && (
        <div
          className="trailer-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={closeTrailer}
        >
          <div
            className="trailer-modal-content"
            style={{
              position: "relative",
              width: "80%",
              maxWidth: "720px",
              aspectRatio: "16/9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={trailerEmbedUrl}
              title={`${movie.title} trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "12px",
              }}
            />
            <button
              onClick={closeTrailer}
              style={{
                position: "absolute",
                top: "-30px",
                right: 0,
                background: "transparent",
                color: "#fff",
                fontSize: "1.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieModal;
