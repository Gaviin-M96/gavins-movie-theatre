// src/components/MovieModal.jsx
import { useMemo } from "react";

function Stars({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-row">
      {stars.map((s) => {
        const filled = value >= s;
        return (
          <button
            key={s}
            type="button"
            className={
              "star-button" + (filled ? " star-button--filled" : "")
            }
            onClick={() => onChange(s)}
            aria-label={`Set rating to ${s} star${s > 1 ? "s" : ""}`}
          >
            {filled ? "★" : "☆"}
          </button>
        );
      })}
      <span className="star-label">
        {value ? `${value} / 5` : "No score yet"}
      </span>
    </div>
  );
}

function MovieModal({
  movie,
  details,
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
  const year = details?.year || movie.year;
  const runtime = details?.runtime;
  const rating = details?.rating;
  const genres = details?.genres || (movie.genre ? [movie.genre] : []);
  const director = details?.director;
  const cast = details?.cast || [];

  const runtimeLabel = useMemo(() => {
    if (!runtime) return null;
    const hours = Math.floor(runtime / 60);
    const mins = runtime % 60;
    if (!hours) return `${mins} min`;
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }, [runtime]);

  const handleStarChange = (val) => {
    onSetGavinRating(val);
  };

  const handleTextChange = (e) => {
    onSetGavinText(e.target.value);
  };

  const handleGenreClick = (g) => {
    if (!g) return;
    onQuickSearch(g);
  };

  const handleYearClick = () => {
    if (!year) return;
    onQuickSearch(String(year));
  };

  return (
    <div className="modal-content">
      {/* Poster column */}
      <div className="modal-poster">
        {details?.posterUrl ? (
          <img src={details.posterUrl} alt={movie.title} />
        ) : (
          <img
            src="https://via.placeholder.com/400x600?text=No+Poster"
            alt={movie.title}
          />
        )}
      </div>

      {/* Info + reviews */}
      <div className="modal-info">
        <h2>{movie.title}</h2>

        <p className="meta">
          {year && (
            <button
              type="button"
              className="chip"
              onClick={handleYearClick}
              style={{ marginRight: "0.4rem" }}
            >
              {year}
            </button>
          )}
          {runtimeLabel && (
            <span style={{ marginRight: "0.4rem" }}>{runtimeLabel}</span>
          )}
          {rating && (
            <span className={getRatingBadgeClass(rating)}>
              ⭐ TMDB {rating.toFixed(1)}
            </span>
          )}
        </p>

        {genres && genres.length > 0 && (
          <p className="meta">
            {genres.slice(0, 5).map((g) => (
              <button
                key={g}
                type="button"
                className="chip"
                onClick={() => handleGenreClick(g)}
                style={{ marginRight: "0.3rem", marginBottom: "0.25rem" }}
              >
                {g}
              </button>
            ))}
          </p>
        )}

        {director && (
          <p>
            <strong>Director:</strong> {director}
          </p>
        )}

        {cast && cast.length > 0 && (
          <p className="modal-cast">
            <strong>Cast:</strong>{" "}
            <span>
              {cast.slice(0, 8).join(", ")}
              {cast.length > 8 ? "…" : ""}
            </span>
          </p>
        )}

        {details?.overview && (
          <p className="modal-overview">{details.overview}</p>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className={
              "icon-button" + (isFavorite ? " icon-button--active" : "")
            }
            onClick={onToggleFavorite}
          >
            <span className="icon-symbol">
              {isFavorite ? "★ Favourited" : "☆ Favourites"}
            </span>
          </button>
          <button
            type="button"
            className={
              "icon-button" + (inWatchlist ? " icon-button--active" : "")
            }
            onClick={onToggleWatchlist}
          >
            <span className="icon-symbol">
              {inWatchlist ? "✓ Watchlist" : "+ Watchlist"}
            </span>
          </button>
          {details?.trailerKey && (
            <button
              type="button"
              className="chip chip--primary"
              onClick={() =>
                window.open(
                  `https://www.youtube.com/watch?v=${details.trailerKey}`,
                  "_blank",
                )
              }
            >
              ▶ Watch Trailer
            </button>
          )}
        </div>

        {/* Reviews section */}
        <div className="review-sections">
          <section className="review-section review-section--gavin">
            <div className="review-section-header">
              <h3 className="review-section-title">Gavin&apos;s Score</h3>
              <p className="review-section-sub">
                Your personal rating and notes – saved to this browser.
              </p>
            </div>

            <Stars value={gavinReview.rating ?? 0} onChange={handleStarChange} />

            <textarea
              className="review-textarea"
              rows={3}
              placeholder="Thoughts, favourite scenes, why this stays (or doesn’t stay) in the collection…"
              value={gavinReview.text ?? ""}
              onChange={handleTextChange}
            />
          </section>

          {/* Placeholder for community / Supabase integration */}
          <section className="review-section">
            <div className="review-section-header">
              <h3 className="review-section-title">Community Opinions</h3>
              <p className="review-section-sub">
                Hook this up to Supabase later using key:{" "}
                <code>{movieReviewKey || "n/a"}</code>
              </p>
            </div>
            <p className="community-empty">
              Community reviews will live here when you&apos;re ready to wire up
              Supabase again.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function getRatingBadgeClass(rating) {
  if (!rating) return "card-rating-badge";
  if (rating >= 8) return "card-rating-badge card-rating-badge--high";
  if (rating >= 6) return "card-rating-badge card-rating-badge--mid";
  return "card-rating-badge card-rating-badge--low";
}

export default MovieModal;
