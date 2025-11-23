// src/components/MovieGrid.jsx
function getRatingBadgeClass(rating) {
  if (!rating) return "card-rating-badge";
  if (rating >= 8) return "card-rating-badge card-rating-badge--high";
  if (rating >= 6) return "card-rating-badge card-rating-badge--mid";
  return "card-rating-badge card-rating-badge--low";
}

function MovieCard({
  movie,
  details,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onOpenModal,
}) {
  const year = details?.year || movie.year;
  const rating = details?.rating ?? null;
  const ratingClass = getRatingBadgeClass(rating);

  const handleCardClick = () => onOpenModal(movie.id);

  return (
    <article className="card" onClick={handleCardClick}>
      <div className="cover">
        {details?.posterUrl ? (
          <img src={details.posterUrl} alt={movie.title} loading="lazy" />
        ) : (
          <img
            src="https://via.placeholder.com/300x450?text=No+Poster"
            alt={movie.title}
            loading="lazy"
          />
        )}

        {movie.format && (
          <div className="card-format-pill">
            {movie.format === "Blu-ray" ? "Blu-Ray" : movie.format}
          </div>
        )}

        {rating && (
          <div className="card-rating-badge card-rating-badge--overlay">
            ⭐ {rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="card-body">
        <h2>{movie.title}</h2>
        <p className="meta">
          {year ? year : "Year unknown"}
          {details?.genres && details.genres.length > 0
            ? ` · ${details.genres.slice(0, 2).join(", ")}`
            : movie.genre
            ? ` · ${movie.genre}`
            : ""}
        </p>

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={
              "icon-button" + (isFavorite ? " icon-button--active" : "")
            }
            onClick={onToggleFavorite}
            title={isFavorite ? "Remove from favourites" : "Add to favourites"}
          >
            <span className="icon-symbol">{isFavorite ? "★" : "☆"}</span>
          </button>
          <button
            type="button"
            className={
              "icon-button" + (inWatchlist ? " icon-button--active" : "")
            }
            onClick={onToggleWatchlist}
            title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            <span className="icon-symbol">🎬</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function MovieGrid({
  movies,
  detailsMap,
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
          details={detailsMap[movie.id]}
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
