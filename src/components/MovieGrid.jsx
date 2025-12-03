// src/components/MovieGrid.jsx
import {
  AiFillStar,
  AiOutlineStar,
  AiFillEye,
  AiOutlineEye,
} from "react-icons/ai";

export function getRatingBadgeClass(rating) {
  if (!rating) return "card-rating-badge";
  if (rating >= 8) return "card-rating-badge card-rating-badge--high";
  if (rating >= 6) return "card-rating-badge card-rating-badge--mid";
  return "card-rating-badge card-rating-badge--low";
}

// Helper – supports tags on movie.tags OR movie.library.tags
const hasTag = (movie, tag) =>
  !!(
    (Array.isArray(movie?.tags) && movie.tags.includes(tag)) ||
    (Array.isArray(movie?.library?.tags) &&
      movie.library.tags.includes(tag))
  );

function MovieCard({
  movie,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onOpenModal,
}) {
  const year = movie.year || null;

  // Prefer manual rating, then TMDB
  const manualScore = movie.ratings?.score ?? null;
  const tmdbScore = movie.ratings?.tmdb?.voteAverage ?? null;
  const rating = manualScore ?? tmdbScore;
  const ratingClass = getRatingBadgeClass(rating);

  const posterUrl =
    movie.media?.poster ||
    movie.media?.placeholder ||
    "https://via.placeholder.com/300x450?text=No+Poster";

  const genresArr = Array.isArray(movie.metadata?.genres)
    ? movie.metadata.genres
    : [];
  const genresText =
    genresArr && genresArr.length > 0
      ? genresArr.slice(0, 2).join(", ")
      : "";

  const format = movie.library?.format || null;
  const formatClass =
    "card-format-pill " +
    (format && format.toUpperCase() === "DVD"
      ? "card-format-pill--dvd"
      : "card-format-pill--bluray");

  const handleCardClick = () => onOpenModal(movie.id);

  return (
    <article className="card" onClick={handleCardClick}>
      {/* Poster */}
      <div className="cover">
        <img src={posterUrl} alt={movie.title} loading="lazy" />

        <div className="cover-badges">
          {format && (
            <div className={formatClass}>
              {format === "Blu-ray" ? "Blu-ray" : format}
            </div>
          )}

          {rating != null && (
            <div className={ratingClass}>⭐ {rating.toFixed(1)}</div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="card-body">
        <h2>{movie.title}</h2>
        <p className="meta">
          {year ? year : "Year unknown"}
          {genresText ? ` · ${genresText}` : ""}
        </p>

        {/* Icon buttons + right-side pills (Superbit / 4K) */}
        <div
          className="card-actions-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "0.5rem",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: favourite / watchlist icons */}
          <div className="card-actions">
            <button
              type="button"
              className={
                "icon-button" + (isFavorite ? " icon-button--active" : "")
              }
              onClick={onToggleFavorite}
              title={
                isFavorite
                  ? "Remove from favourites"
                  : "Add to favourites"
              }
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
                inWatchlist
                  ? "Remove from watchlist"
                  : "Add to watchlist"
              }
            >
              <span className="icon-symbol">
                {inWatchlist ? <AiFillEye /> : <AiOutlineEye />}
              </span>
            </button>
          </div>

          {/* Right: Superbit / 4K pills */}
          <div className="card-extra-badges">
            {hasTag(movie, "superbit") && (
              <span className="card-superbit-badge">Superbit</span>
            )}

            {hasTag(movie, "4k") && (
              <span className="card-4k-badge">4K UHD</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function MovieGrid({
  movies,
  favoriteSet,
  watchlistSet,
  onToggleFavorite,
  onToggleWatchlist,
  onOpenModal,
}) {
  return (
    <section className="grid" aria-label="Movies">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isFavorite={favoriteSet.has(movie.id)}
          inWatchlist={watchlistSet.has(movie.id)}
          onToggleFavorite={() => onToggleFavorite(movie.id)}
          onToggleWatchlist={() => onToggleWatchlist(movie.id)}
          onOpenModal={onOpenModal}
        />
      ))}
    </section>
  );
}

export default MovieGrid;
