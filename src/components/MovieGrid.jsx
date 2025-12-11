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

// Tag helper
const hasTag = (movie, tag) =>
  !!(
    (Array.isArray(movie?.tags) && movie.tags.includes(tag)) ||
    (Array.isArray(movie?.library?.tags) && movie.library.tags.includes(tag))
  );


// ⭐ FIXED: cleanly resolve multiple formats in all cases
function getFormats(movie) {
  const lib = movie.library || {};

  // Case 1: new format -> array
  if (Array.isArray(lib.format)) {
    return lib.format.map((f) => f.trim());
  }

  // Case 2: comma-separated string (your exact issue)
  if (typeof lib.format === "string" && lib.format.includes(",")) {
    return lib.format.split(",").map((f) => f.trim());
  }

  // Case 3: old single format string
  if (typeof lib.format === "string") {
    return [lib.format.trim()];
  }

  return [];
}

// Map formats → CSS class
function getFormatClass(format) {
  const f = format.toLowerCase();

  switch (f) {
    case "dvd":
      return "card-format-pill card-format-pill--dvd";
    case "vhs":
      return "card-format-pill card-format-pill--vhs";
    case "blu-ray":
    case "bluray":
      return "card-format-pill card-format-pill--bluray";
    default:
      return "card-format-pill";
  }
}

function MovieCard({
  movie,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onOpenModal,
}) {
  const year = movie.year || null;

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
    genresArr && genresArr.length > 0 ? genresArr.slice(0, 2).join(", ") : "";

  // FIXED formats
  const formats = getFormats(movie);

  const handleCardClick = () => onOpenModal(movie.id);

  return (
    <article className="card" onClick={handleCardClick}>
      <div className="cover">
        <img src={posterUrl} alt={movie.title} loading="lazy" />

        <div className="cover-badges">
          {/* MULTIPLE FORMAT PILLS */}
          {formats.length > 0 && (
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {formats.map((fmt) => (
                <div key={fmt} className={getFormatClass(fmt)}>
                  {fmt}
                </div>
              ))}
            </div>
          )}

          {rating != null && (
            <div className={ratingClass}>⭐ {rating.toFixed(1)}</div>
          )}
        </div>
      </div>

      <div className="card-body">
        <h2>{movie.title}</h2>
        <p className="meta">
          {year ? year : "Year unknown"}
          {genresText ? ` · ${genresText}` : ""}
        </p>

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
          <div className="card-actions">
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
              title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              <span className="icon-symbol">
                {inWatchlist ? <AiFillEye /> : <AiOutlineEye />}
              </span>
            </button>
          </div>

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
