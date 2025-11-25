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
  // Prefer static data from `movie`, fall back to TMDB `details`
  const year = movie.year || details?.year || null;
  const rating = details?.rating ?? null;
  const ratingClass = getRatingBadgeClass(rating);

  // Posters:
  // 1) movie.image (your static field, e.g. https://via.placeholder.com/...)
  // 2) details.posterUrl from TMDB (if cached)
  // 3) final fallback placeholder
  const posterUrl =
    movie.image ||
    details?.posterUrl ||
    "https://via.placeholder.com/300x450?text=No+Poster";

  // Genres: use static movie.genres first
  let genresArr = [];
  if (Array.isArray(movie.genres) && movie.genres.length) {
    genresArr = movie.genres;
  } else if (movie.genre) {
    genresArr = [movie.genre];
  } else if (Array.isArray(details?.genres) && details.genres.length) {
    genresArr = details.genres;
  }

  const genresText =
    genresArr && genresArr.length > 0
      ? genresArr.slice(0, 3).join(", ")
      : "";

  const handleCardClick = () => onOpenModal(movie.id);

  return (
    <article className="card" onClick={handleCardClick}>
      <div className="cover">
        <img
          src={posterUrl}
          alt={movie.title}
          loading="lazy"
        />
      </div>

      <div className="card-body">
        {/* top row with format + rating pills */}
        <div className="card-top-row">
          {movie.format && (
            <div className="card-format-pill">
              {movie.format === "Blu-ray" ? "Blu-Ray" : movie.format}
            </div>
          )}

          {rating && (
            <div className={ratingClass}>
              ⭐ {rating.toFixed(1)}
            </div>
          )}
        </div>

        <h2>{movie.title}</h2>
        <p className="meta">
          {year ? year : "Year unknown"}
          {genresText ? ` · ${genresText}` : ""}
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
            <span className="icon-symbol">
              {isFavorite ? "⭐" : "☆"}
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
            <span className="icon-symbol">️</span>
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
