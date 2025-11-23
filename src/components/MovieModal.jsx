import { useState } from "react";
import MovieReviews from "./MovieReviews";

function MovieModal({
  movie,
  details,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  gavinReview,
  onSetGavinRating,
  onSetGavinText, // still accepted, but not used anymore
  movieReviewKey,
  onQuickSearch,
}) {
  const trailerKey = details?.trailerKey || null;
  const [showTrailer, setShowTrailer] = useState(false);

  const openTrailer = () => {
    if (!trailerKey) return;
    setShowTrailer(true);
  };

  const closeTrailer = () => {
    setShowTrailer(false);
  };

  // Handle typed decimal rating (0.0–5.0)
  const handleGavinInputChange = (e) => {
    const raw = e.target.value;

    // Allow clearing the field
    if (raw === "") {
      onSetGavinRating(0);
      return;
    }

    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) return;

    const clamped = Math.max(0, Math.min(5, parsed));
    onSetGavinRating(clamped);
  };

  // Value for the number input – blank if 0
  const gavinScoreValue =
    gavinReview && typeof gavinReview.rating === "number"
      ? gavinReview.rating || ""
      : "";

  return (
    <div className="modal-content">
      {/* LEFT COLUMN: Poster + Gavin's Score */}
      <div className="modal-left">
        <div className="modal-poster">
          <img src={details?.posterUrl || movie.image} alt={movie.title} />
        </div>

        <section className="review-section review-section--gavin">
          <div className="review-section-header">
            <h3 className="review-section-title">Gavin&apos;s Score</h3>
          </div>

          {/* Stars + numeric input (hybrid) */}
          <div className="gavin-score-row">
            <div className="star-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-button ${
                    gavinReview.rating >= star ? "star-button--filled" : ""
                  }`}
                  onClick={() => onSetGavinRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <div>
              <input
                className="gavin-score-input"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={gavinScoreValue}
                onChange={handleGavinInputChange}
              />
              <span className="gavin-score-outof"> / 5</span>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Info, Trailer, Community, Actions */}
      <div className="modal-info">
        <h2>{movie.title}</h2>

        {details?.year && (
          <p>
            <strong>Year:</strong> {details.year}
          </p>
        )}

        {details?.genres && details.genres.length > 0 && (
          <p>
            <strong>Genres:</strong> {details.genres.join(", ")}
          </p>
        )}

        {details?.runtime && (
          <p>
            <strong>Runtime:</strong> {details.runtime} min
          </p>
        )}

        {details?.rating && (
          <p>
            <strong>Rating:</strong> {details.rating.toFixed(1)}/10
          </p>
        )}

        {details?.director && (
          <p>
            <strong>Director:</strong>{" "}
            <button
              type="button"
              className="chip"
              onClick={() => onQuickSearch(details.director)}
            >
              {details.director}
            </button>
          </p>
        )}

        {details?.cast && details.cast.length > 0 && (
          <p className="modal-cast">
            <strong>Cast:</strong>{" "}
            {details.cast.slice(0, 3).map((name) => (
              <button
                key={name}
                type="button"
                className="chip"
                onClick={() => onQuickSearch(name)}
              >
                {name}
              </button>
            ))}
          </p>
        )}

        {details?.overview && (
          <p className="modal-overview">{details.overview}</p>
        )}

        {trailerKey && (
          <div style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="chip chip--primary"
              onClick={openTrailer}
            >
              ▶ Watch Trailer
            </button>
          </div>
        )}

        {/* RIGHT COLUMN SCORE BOXES (Community only now) */}
        <div className="review-sections">
          <MovieReviews movieKey={movieReviewKey} title={movie.title} />
        </div>

        <div className="modal-actions">
          <button
            className={`chip ${isFavorite ? "chip--active" : ""}`}
            onClick={onToggleFavorite}
          >
            {isFavorite ? "⭐ In Favourites" : "☆ Add to Favourites"}
          </button>

          <button
            className={`chip ${inWatchlist ? "chip--active" : ""}`}
            onClick={onToggleWatchlist}
          >
            {inWatchlist ? "📺 In Watchlist" : "+ Add to Watchlist"}
          </button>
        </div>
      </div>

      {/* Trailer popup overlay (autoplay when opened) */}
      {showTrailer && (
        <div className="trailer-overlay" onClick={closeTrailer}>
          <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="trailer-close" onClick={closeTrailer}>
              ✕
            </button>
            <div className="trailer-embed">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieModal;
