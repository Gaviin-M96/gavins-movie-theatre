// src/components/MovieModal.jsx
import { useMemo, useState } from "react";
import { getRatingBadgeClass } from "./MovieGrid"; // reuse badge styling
import { AiFillStar, AiOutlineStar, AiFillEye, AiOutlineEye } from "react-icons/ai";


function MovieModal({
  movie,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  gavinReview,
  onSetGavinRating,
  onSetGavinText, // still accepted if you decide to use text later
  movieReviewKey,
  onQuickSearch,
}) {
  const year = movie.year || null;
  const runtime = movie.metadata?.runtimeMinutes ?? null;
  const rating = movie.ratings?.tmdb?.voteAverage ?? null;
  const genres = movie.metadata?.genres || [];
  const director = movie.credits?.director;
  const cast = movie.credits?.castPreview || [];
  const limitedCast = cast.slice(0, 3);

  const overview = movie.text?.overview || "";

  const posterSrc =
    movie.media?.poster ||
    movie.media?.placeholder ||
    "https://via.placeholder.com/400x600?text=No+Poster";

  // Local-only community reviews (not persisted)
  const [communityName, setCommunityName] = useState("");
  const [communityRating, setCommunityRating] = useState("");
  const [communityText, setCommunityText] = useState("");
  const [communityReviews, setCommunityReviews] = useState([]);

  const runtimeLabel = useMemo(() => {
    if (!runtime) return null;
    const hours = Math.floor(runtime / 60);
    const mins = runtime % 60;
    if (!hours) return `${mins} min`;
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }, [runtime]);

  const handleGenreClick = (g) => {
    if (!g) return;
    onQuickSearch(g);
  };

  const handleYearClick = () => {
    if (!year) return;
    onQuickSearch(String(year));
  };

  // Gavin rating 0–10 via slider
  const sliderValue = gavinReview.rating ?? 0;

  const handleGavinSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    const clamped = Math.max(0, Math.min(10, val));
    onSetGavinRating(clamped);
  };

  // Community submit
  const handleCommunitySubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(communityRating);
    if (isNaN(num) || num < 0 || num > 10) {
      return;
    }

    const review = {
      id: Date.now(),
      name: communityName.trim() || "Anonymous",
      rating: num,
      text: communityText.trim(),
      date: new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };

    setCommunityReviews((prev) => [review, ...prev]);
    setCommunityName("");
    setCommunityRating("");
    setCommunityText("");
  };

  return (
    <div className="modal-content">
      {/* Poster column */}
      <div className="modal-poster">
        <img src={posterSrc} alt={movie.title} />
      </div>

      {/* Info + reviews */}
      <div className="modal-info">
        <h2>{movie.title}</h2>

        {/* Meta row: year, runtime, rating */}
        <div className="modal-meta-row">
          {year && (
            <button
              type="button"
              className="chip modal-meta-chip"
              onClick={handleYearClick}
            >
              {year}
            </button>
          )}
          {runtimeLabel && (
            <span className="modal-meta-text">{runtimeLabel}</span>
          )}
          {rating && (
            <span className={getRatingBadgeClass(rating)}>
              ⭐ {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Genres row */}
        {genres && genres.length > 0 && (
          <div className="modal-genre-row">
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

        {/* Director + Cast as pills (top 3 only) */}
        {(director || limitedCast.length > 0) && (
          <div className="modal-chip-section">
            {director && (
              <div className="modal-chip-group">
                <span className="modal-chip-label">Director</span>
                <div className="modal-chip-list">
                  <span className="chip modal-chip">{director}</span>
                </div>
              </div>
            )}

            {limitedCast.length > 0 && (
              <div className="modal-chip-group">
                <span className="modal-chip-label">Cast</span>
                <div className="modal-chip-list">
                  {limitedCast.map((name) => (
                    <span key={name} className="chip modal-chip">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overview – smaller text */}
        {overview && <p className="modal-overview">{overview}</p>}

        {/* Actions: icon-only for Favourite & Watchlist */}
        <div className="modal-actions">
          <button
            type="button"
            className={
              "icon-button" + (isFavorite ? " icon-button--active" : "")
            }
            onClick={onToggleFavorite}
            title={isFavorite ? "Remove from favourites" : "Add to favourites"}
          >
            <span className="icon-symbol">
              {isFavorite ? <AiFillStar /> : <AiOutlineStar />}
            </span>
          </button>
          <button
            type="button"
            className={
              "icon-button" + (inWatchlist ? " icon-button--active" : "")
            }
            onClick={onToggleWatchlist}
            title={
              inWatchlist ? "Remove from watchlist" : "Add to watchlist"
            }
          >
            <span className="icon-symbol">
              {inWatchlist ? <AiFillEye /> : <AiOutlineEye />}
            </span>
          </button>
          {/* No trailer button for now – we didn't fetch videos in the script */}
        </div>

        {/* Reviews section */}
        <div className="review-sections">
          {/* Gavin's score – slider 0–10 with ⭐ */}
          <section className="review-section review-section--gavin">
            <div className="review-section-header">
              <h3 className="review-section-title">Gavin&apos;s Score</h3>
            </div>

            <div className="gavin-score-row gavin-score-row--slider">
              <span className="gavin-score-star">⭐</span>
              <span className="gavin-score-outof">
                {sliderValue.toFixed(1)} / 10
              </span>
            </div>
          </section>

          {/* Community reviews – 0–10 with decimals */}
          <section className="review-section">
            <div className="review-section-header">
              <h3 className="review-section-title">Community Reviews</h3>
              <p className="review-section-sub">
                Visitors can rate this movie out of 10 and leave a short review
                (local only for now).
              </p>
            </div>

            {communityReviews.length === 0 ? (
              <p className="community-empty">
                No community reviews yet. Be the first to rate this movie.
              </p>
            ) : (
              <ul className="community-list">
                {communityReviews.map((r) => (
                  <li key={r.id} className="community-item">
                    <div className="community-meta">
                      <span className="community-author">{r.name}</span>
                      <span className="community-date">
                        ⭐ {r.rating.toFixed(1)} / 10 • {r.date}
                      </span>
                    </div>
                    {r.text && (
                      <p className="community-body">{r.text}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <form className="community-form" onSubmit={handleCommunitySubmit}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  className="community-input"
                  placeholder="Your name (optional)"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  className="community-input"
                  style={{ maxWidth: "110px" }}
                  placeholder="Rating"
                  value={communityRating}
                  onChange={(e) => setCommunityRating(e.target.value)}
                />
              </div>
              <textarea
                className="community-textarea"
                rows={2}
                placeholder="What did you think?"
                value={communityText}
                onChange={(e) => setCommunityText(e.target.value)}
              />
              <button
                type="submit"
                className="btn-primary community-submit"
              >
                Submit review
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default MovieModal;
