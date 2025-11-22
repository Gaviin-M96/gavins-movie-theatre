import MovieReviews from "./MovieReviews";
import { useState } from "react";

function MovieModal({
  movie,
  details,
  seenDate,
  isFavorite,
  inWatchlist,
  isSeen,
  onToggleFavorite,
  onToggleWatchlist,
  onToggleSeen,
  gavinReview,
  onSetGavinRating,
  onSetGavinText,
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

  return (
    <div className="modal-content">
      <div className="modal-poster">
        <img
          src={details?.posterUrl || movie.image}
          alt={movie.title}
        />
      </div>

      <div className="modal-info">
        <h2>{movie.title}</h2>

        {details?.year && (
          <p>
            <strong>Year:</strong> {details.year}
          </p>
        )}

        {details?.genres && details.genres.length > 0 && (
          <p>
            <strong>Genres:</strong>{" "}
            {details.genres.join(", ")}
          </p>
        )}

        {details?.runtime && (
          <p>
            <strong>Runtime:</strong> {details.runtime} min
          </p>
        )}

        {details?.rating && (
          <p>
            <strong>TMDB Rating:</strong>{" "}
            {details.rating.toFixed(1)}/10
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
            {details.cast.slice(0, 6).map((name) => (
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

        {isSeen && seenDate && (
          <p>
            <strong>Last watched:</strong>{" "}
            {new Date(seenDate).toLocaleDateString()}
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

        {/* Reviews */}
        <div className="review-sections">
          {/* Gavin Review */}
          <section className="review-section">
            <div className="review-section-header">
              <h3 className="review-section-title">Gavin&apos;s Score</h3>
            </div>

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
              <span className="star-label">
                {gavinReview.rating
                  ? `${gavinReview.rating} / 5`
                  : "Tap to rate"}
              </span>
            </div>

            <textarea
              className="review-textarea"
              rows={3}
              placeholder="Your personal thoughts on this movie…"
              value={gavinReview.text}
              onChange={(e) => onSetGavinText(e.target.value)}
            />
          </section>

          {/* Community reviews */}
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

          <button
            className={`chip ${isSeen ? "chip--active" : ""}`}
            onClick={onToggleSeen}
          >
            {isSeen ? "👁 Marked as Seen" : "👁 Mark as Seen"}
          </button>
        </div>
      </div>

      {/* Trailer popup overlay */}
      {showTrailer && (
        <div className="trailer-overlay" onClick={closeTrailer}>
          <div
            className="trailer-modal"
            onClick={(e) => e.stopPropagation()}
          >
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
