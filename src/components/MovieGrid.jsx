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
    <div className="grid">
      {movies.map((movie) => {
        const details = detailsMap[movie.id];
        const posterUrl = details?.posterUrl || movie.image;

        const year = details?.year || movie.year;
        const genresArr =
          details?.genres || (movie.genre ? [movie.genre] : []);
        const meta =
          year && genresArr.length > 0
            ? `${year} • ${genresArr.join(", ")}`
            : year || genresArr.join(", ");

        const isFavorite = favoriteSet.has(movie.id);
        const inWatchlist = watchlistSet.has(movie.id);

        const tmdbRating = details?.rating ?? null;

        return (
          <article
            key={movie.id}
            className={`card ${
              isFavorite || inWatchlist ? "card--highlight" : ""
            }`}
          >
            <div className="cover" onClick={() => onOpenModal(movie.id)}>
              {(isFavorite || inWatchlist) && (
                <div className="card-ribbons">
                  {isFavorite && (
                    <span className="card-ribbon card-ribbon--fav">
                      FAV
                    </span>
                  )}
                  {inWatchlist && (
                    <span className="card-ribbon card-ribbon--watch">
                      QUEUE
                    </span>
                  )}
                </div>
              )}

              {tmdbRating != null && (
                <div
                  className={`card-rating-badge card-rating-badge--overlay ${
                    tmdbRating >= 8
                      ? "card-rating-badge--high"
                      : tmdbRating >= 6
                      ? "card-rating-badge--mid"
                      : "card-rating-badge--low"
                  }`}
                >
                  ★ {tmdbRating.toFixed(1)}
                </div>
              )}

              {movie.format && (
                <div className="card-format-pill">
                  {movie.format === "Blu-ray" ? "Blu-Ray" : movie.format}
                </div>
              )}

              <img src={posterUrl} alt={movie.title} loading="lazy" />
            </div>

            <div className="card-body">
              <h2 onClick={() => onOpenModal(movie.id)}>{movie.title}</h2>
              {meta && <p className="meta">{meta}</p>}

              <p className="format">
                {movie.format === "Blu-ray" ? "Blu-Ray" : movie.format}
              </p>

              <div className="card-actions">
                <button
                  className={`icon-button ${
                    isFavorite ? "icon-button--active" : ""
                  }`}
                  onClick={() => onToggleFavorite(movie.id)}
                  title="Toggle favourite"
                >
                  <span className="icon-symbol">
                    {isFavorite ? "❤️" : "🤍"}
                  </span>
                </button>
                <button
                  className={`icon-button ${
                    inWatchlist ? "icon-button--active" : ""
                  }`}
                  onClick={() => onToggleWatchlist(movie.id)}
                  title="Toggle watchlist"
                >
                  <span className="icon-symbol">📺</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default MovieGrid;
