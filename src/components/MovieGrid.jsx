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

// Resolve multiple format types
function getFormats(movie) {
  const lib = movie.library || {};

  if (Array.isArray(lib.format)) {
    return lib.format.map((f) => f.trim());
  }
  if (typeof lib.format === "string" && lib.format.includes(",")) {
    return lib.format.split(",").map((f) => f.trim());
  }
  if (typeof lib.format === "string") {
    return [lib.format.trim()];
  }

  return [];
}

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

function MovieCard({ movie, onOpenModal }) {
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
  const genresText = genresArr.length > 0 ? genresArr.slice(0, 2).join(", ") : "";

  const formats = getFormats(movie);

  return (
    <article className="card" onClick={() => onOpenModal(movie.id)}>
      <div className="cover">
        <img src={posterUrl} alt={movie.title} loading="lazy" />

        <div className="cover-badges">
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
          {year || "Year unknown"}
          {genresText ? ` · ${genresText}` : ""}
        </p>

        {/* ONLY SUPERBIT / 4K BADGES */}
        <div
          className="card-actions-row"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: "0.5rem",
          }}
        >
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
  onOpenModal,
}) {
  return (
    <section className="grid" aria-label="Movies">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onOpenModal={onOpenModal}
        />
      ))}
    </section>
  );
}

export default MovieGrid;
