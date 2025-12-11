// src/components/MovieModal.jsx
import { useMemo, useState, useEffect } from "react";
import { getRatingBadgeClass } from "./MovieGrid";
import { supabase } from "../api/supabaseClient";
import {
  AiFillStar,
  AiOutlineStar,
  AiFillEye,
  AiOutlineEye,
} from "react-icons/ai";

const GAVIN_EMAIL = "gavinmoore.cs@gmail.com";

// Supports tags stored in either movie.tags or movie.library.tags
const hasTag = (movie, tag) =>
  !!(
    (Array.isArray(movie?.tags) && movie.tags.includes(tag)) ||
    (Array.isArray(movie?.library?.tags) &&
      movie.library.tags.includes(tag))
  );

// For safety: if profile nickname is bad/empty, fall back
function getSafeDisplayName(raw) {
  if (!raw) return "A movie watcher";
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2 || !/[a-zA-Z]/.test(cleaned)) {
    return "A movie watcher";
  }
  return cleaned;
}

function MovieModal({
  movie,
  isFavorite,
  inWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  gavinReview,        // kept for compatibility, not used
  onSetGavinRating,   // kept for compatibility, not used
  onSetGavinText,     // kept for compatibility, not used
  movieReviewKey,
  onSelectGenre,
  onSelectYear,
  onQuickSearch,
  user,
}) {
  const year = movie.year || null;
  const runtime = movie.metadata?.runtimeMinutes ?? null;

  const manualScore = movie.ratings?.score ?? null;
  const tmdbScore = movie.ratings?.tmdb?.voteAverage ?? null;
  const rating = manualScore ?? tmdbScore;

  const genres = movie.metadata?.genres || [];
  const director = movie.credits?.director;
  const cast = movie.credits?.castPreview || [];
  const limitedCast = cast.slice(0, 3);

  const overview = movie.text?.overview || "";

  const posterSrc =
    movie.media?.poster ||
    movie.media?.placeholder ||
    "https://via.placeholder.com/400x600?text=No+Poster";

  const youtubeKey = movie.youtubeTrailerKey ?? null;
  const trailerEmbedUrl = youtubeKey
    ? `https://www.youtube.com/embed/${youtubeKey}`
    : null;

  const [trailerOpen, setTrailerOpen] = useState(false);
  const openTrailer = () => setTrailerOpen(true);
  const closeTrailer = () => setTrailerOpen(false);

  // All reviews for this movie
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  // Community review form state
  const [communityRating, setCommunityRating] = useState("");
  const [communityText, setCommunityText] = useState("");

  // Nickname from profiles
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Gavin's rating UI state
  const [gavinRating, setGavinRating] = useState("");

  // Load all reviews for this movie
  useEffect(() => {
    if (!movieReviewKey) return;

    async function loadReviews() {
      setLoadingReviews(true);
      setReviewsError(null);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_id", movieReviewKey)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading reviews:", error);
        setReviewsError("Could not load reviews.");
        setReviews([]);
      } else {
        setReviews(data || []);
      }

      setLoadingReviews(false);
    }

    loadReviews();
  }, [movieReviewKey]);

  // Load profile nickname for the current user
  useEffect(() => {
    if (!user) {
      setProfileDisplayName("");
      return;
    }

    let cancelled = false;
    const loadProfileName = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
        .catch((err) => ({ data: null, error: err }));

      if (cancelled) return;

      if (error) {
        console.warn("Profile load error (ok if no row yet):", error);
        setProfileDisplayName("");
      } else {
        const raw = data?.display_name || "";
        setProfileDisplayName(raw.trim());
      }
      setProfileLoading(false);
    };

    loadProfileName();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Special: existing Gavin review (by name)
  const gavinReviewRow = reviews.find(
    (r) => r.name && r.name.trim().toLowerCase() === "gavin"
  );

  // Keep local gavinRating in sync with DB
  useEffect(() => {
    if (gavinReviewRow?.rating != null) {
      setGavinRating(String(gavinReviewRow.rating));
    } else {
      setGavinRating("");
    }
  }, [gavinReviewRow]);

  // Current user's review, if logged in
  const currentUserReview =
    user && reviews.length
      ? reviews.find((r) => r.user_id === user.id)
      : null;

  // Community reviews = everyone except the "Gavin" row
  const communityReviews = reviews.filter(
    (r) => !gavinReviewRow || r.id !== gavinReviewRow.id
  );

  // Pre-fill community form with user's existing review (if any)
  useEffect(() => {
    if (!user) {
      setCommunityRating("");
      setCommunityText("");
      return;
    }
    if (currentUserReview) {
      setCommunityRating(
        currentUserReview.rating != null
          ? String(currentUserReview.rating)
          : ""
      );
      setCommunityText(currentUserReview.comment || "");
    } else {
      setCommunityRating("");
      setCommunityText("");
    }
  }, [user, currentUserReview]);

  const runtimeLabel = useMemo(() => {
    if (!runtime) return null;
    const hours = Math.floor(runtime / 60);
    const mins = runtime % 60;
    if (!hours) return `${mins} min`;
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  }, [runtime]);

  const isTV = movie.metadata?.category === "TV Show";
  const seasons = movie.metadata?.seasons || [];
  const seasonSummary = isTV
    ? `${seasons.length} season${
        seasons.length > 1 ? "s" : ""
      } • ${seasons.reduce(
        (sum, s) => sum + (s.episodeCount || 0),
        0
      )} episodes`
    : null;

  const handleGenreClick = (g) => {
    if (onSelectGenre) onSelectGenre(g);
};

const handleYearClick = () => {
    if (onSelectYear) onSelectYear(year);
};

  const handleCommunitySubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewsError("Please sign in to leave a review.");
      return;
    }

    const num = parseFloat(communityRating);
    if (isNaN(num) || num < 0 || num > 10) {
      setReviewsError("Rating must be between 0 and 10.");
      return;
    }

    const safeName = getSafeDisplayName(profileDisplayName);

    const payload = {
      movie_id: movieReviewKey,
      rating: num,
      comment: communityText.trim() || null,
      user_id: user.id,
      display_name: safeName,
    };

    setReviewsError(null);

    if (currentUserReview) {
      // Update existing review
      const { data, error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", currentUserReview.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating review:", error);
        setReviewsError("Could not update your review.");
        return;
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === data.id ? data : r))
      );
    } else {
      // Insert new review
      const { data, error } = await supabase
        .from("reviews")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Error saving review:", error);
        setReviewsError("Could not save your review.");
        return;
      }

      setReviews((prev) => [data, ...prev]);
    }
  };

  // Gavin-only: save Gavin’s Score to Supabase so everyone sees it
  const saveGavinReview = async () => {
    if (!user || user.email !== GAVIN_EMAIL) return;
    if (!movieReviewKey) return;

    const num = parseFloat(gavinRating);
    if (isNaN(num) || num < 0 || num > 10) return;

    // Remove existing Gavin review to enforce one per movie
    await supabase
      .from("reviews")
      .delete()
      .eq("movie_id", movieReviewKey)
      .eq("name", "Gavin");

    const { error } = await supabase.from("reviews").insert([
      {
        movie_id: movieReviewKey,
        rating: num,
        comment: null,
        name: "Gavin",
      },
    ]);

    if (error) {
      console.error("Error saving Gavin rating:", error);
      return;
    }

    // Reload reviews so UI updates
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("movie_id", movieReviewKey)
      .order("created_at", { ascending: false });

    setReviews(data || []);
  };

  return (
    <div
      className={`modal-content${
        hasTag(movie, "superbit") ? " superbit" : ""
      }`}
    >
      {/* Poster */}
      <div className="modal-poster" style={{ textAlign: "center" }}>
        <img src={posterSrc} alt={movie.title} className="modal-poster-img" />
      </div>

      {/* Info */}
      <div className="modal-info" style={{ textAlign: "center" }}>
        {/* Title + runtime + season summary */}
        <div className="modal-title-block">
          <div
            className="modal-title-row"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: "0.6rem",
              flexWrap: "wrap",
            }}
          >
            <h2 className="modal-title" style={{ marginBottom: 0 }}>
              {movie.title}
            </h2>
            {runtimeLabel && (
              <span className="modal-meta-text">{runtimeLabel}</span>
            )}
            {isTV && seasonSummary && (
              <span className="modal-meta-text">{seasonSummary}</span>
            )}
          </div>

          {/* Year + rating + Superbit pill */}
          <div
            className="modal-meta-row modal-meta-row--chips"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.4rem",
              marginTop: "0.35rem",
              flexWrap: "wrap",
            }}
          >
            {year && (
              <button
                type="button"
                className="chip modal-meta-chip"
                onClick={handleYearClick}
              >
                {year}
              </button>
            )}
            {rating != null && (
              <span
                className={
                  "chip modal-rating-chip " + getRatingBadgeClass(rating)
                }
              >
                ⭐ {rating.toFixed(1)}
              </span>
            )}
            {hasTag(movie, "superbit") && (
              <span className="chip modal-meta-chip">Superbit</span>
            )}
          </div>
        </div>

        {/* Genres */}
        {genres && genres.length > 0 && (
          <div
            className="modal-genre-row"
            style={{ justifyContent: "center", marginTop: "0.4rem" }}
          >
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

        {/* Director / Cast – TIGHTER */}
        {(director || limitedCast.length > 0) && (
          <div
            className="modal-people-section"
            style={{
              marginTop: "0.45rem",
              textAlign: "center",
              fontSize: "0.8rem",
              lineHeight: "1.35",
            }}
          >
            {director && (
              <p style={{ margin: "0 0 0.15rem" }}>
                <strong>Directed By:</strong> {director}
              </p>
            )}
            {limitedCast.length > 0 && (
              <p style={{ margin: 0 }}>
                <strong>Starring:</strong> {limitedCast.join(", ")}
              </p>
            )}
          </div>
        )}

        {/* Overview – TIGHTER */}
        {overview && (
          <p
            className="modal-overview"
            style={{
              maxWidth: "620px",
              margin: "0.6rem auto 0.75rem",
              fontSize: "0.8rem",
              lineHeight: "1.45",
            }}
          >
            {overview}
          </p>
        )}

        {/* Action Row: Trailer + Favourites + Watchlist */}
        {(trailerEmbedUrl || true) && (
          <div
            className="modal-actions"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.6rem",
              marginTop: "0.4rem",
            }}
          >
            {trailerEmbedUrl && (
              <button className="btn-primary" onClick={openTrailer}>
                ▶ Play Trailer
              </button>
            )}

            {/* Favourite / Watchlist icons RIGHT beside trailer */}
            <div
              className="card-actions"
              style={{
                display: "flex",
                gap: "0.35rem",
              }}
            >
              <button
                type="button"
                className={
                  "icon-button" + (isFavorite ? " icon-button--active" : "")
                }
                onClick={onToggleFavorite}
                title={
                  isFavorite ? "Remove from favourites" : "Add to favourites"
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
                  inWatchlist ? "Remove from watchlist" : "Add to watchlist"
                }
              >
                <span className="icon-symbol">
                  {inWatchlist ? <AiFillEye /> : <AiOutlineEye />}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Reviews (Gavin + Community) */}
        <div
          className="review-sections"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
            alignItems: "flex-start",
            marginTop: "1rem",
          }}
        >
          {/* Gavin */}
          <section
  className="review-section review-section--gavin"
  style={{
    flex: "115px",
    maxWidth: "280px",
    padding: "0.4rem 0.5rem"  // <-- add this here
  }}
>
            <div className="review-section-header">
              <h3
                style={{
                  fontSize: "0.95rem",
                  marginBottom: "0.35rem",
                  marginTop: 0,
                }}
              >
                Gavin’s Score
              </h3>
            </div>

            {user?.email === GAVIN_EMAIL ? (
              <>
                <div className="review-section-body">
                  <div
                    className="gavin-score-box"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      className="gavin-score-icon"
                      style={{
                        color: "#FFD700",
                        fontSize: "1.3rem",
                        filter: "drop-shadow(0 0 4px #ffef9f)",
                      }}
                    >
                      ⭐
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={gavinRating}
                      onChange={(e) => setGavinRating(e.target.value)}
                      className="community-input"
                      style={{
                        width: "70px",
                        textAlign: "center",
                        fontSize: "0.95rem",
                        padding: "2px 4px",
                        borderRadius: "6px",
                      }}
                    />
                    <span style={{ fontSize: "0.85rem" }}>/ 10</span>
                  </div>
                  <button
  className="btn-primary"
  style={{ marginTop: "0", padding: "0.3rem 0.75rem" }}
  onClick={saveGavinReview}
>
  Save
</button>
                </div>
              </>
            ) : gavinReviewRow ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    color: "#FFD700",
                    fontSize: "1.3rem",
                    filter: "drop-shadow(0 0 4px #ffef9f)",
                  }}
                >
                  ⭐
                </span>
                <span className="gavin-score-text" style={{ fontSize: "0.95rem" }}>
                  {Number(gavinReviewRow.rating).toFixed(1)} / 10
                </span>
              </div>
            ) : (
              <p style={{ fontSize: ".8rem", color: "#888", margin: 0 }}>
                Not yet rated.
              </p>
            )}
          </section>

          {/* Community */}
          <section
            className="review-section review-section--community"
            style={{ flex: "265px", maxWidth: "480px" }}
          >
            <div className="review-section-header">
              <h3
                style={{
                  fontSize: "0.95rem",
                  marginBottom: "0.25rem",
                  marginTop: 0,
                }}
              >
                Community Reviews
              </h3>
              <p style={{ fontSize: "0.78rem", margin: 0 }}>
                Leave a rating once you&apos;re signed in.{" "}
                <strong>Emails are never shown.</strong>
              </p>
            </div>

            {loadingReviews ? (
              <p style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                Loading reviews...
              </p>
            ) : reviewsError ? (
              <p style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                {reviewsError}
              </p>
            ) : communityReviews.length === 0 ? (
              <p style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                No community reviews yet. Be the first to rate this movie.
              </p>
            ) : (
              <ul className="community-list">
                {communityReviews.map((r) => {
                  const displayName =
                    r.display_name || r.name || "A movie watcher";
                  const isYou = user && r.user_id === user.id;
                  return (
                    <li key={r.id} className="community-item">
                      <div className="community-meta">
                        <span style={{ fontSize: "0.82rem" }}>
                          {displayName}
                          {isYou && (
                            <span
                              style={{
                                marginLeft: "0.4rem",
                                fontSize: "0.7rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                opacity: 0.8,
                              }}
                            >
                              (You)
                            </span>
                          )}
                        </span>
                        <span style={{ fontSize: "0.78rem" }}>
                          ⭐ {Number(r.rating).toFixed(1)} / 10 •{" "}
                          {r.created_at
                            ? new Date(
                                r.created_at
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                          {r.comment}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Review form */}
            {!user ? (
              <p
                style={{
                  fontSize: "0.78rem",
                  marginTop: "0.6rem",
                  color: "#9ca3af",
                }}
              >
                Sign in from the left sidebar to leave a review.
              </p>
            ) : (
              <form
                className="community-form"
                onSubmit={handleCommunitySubmit}
              >
                <p
                  style={{
                    fontSize: "0.76rem",
                    margin: "0.35rem 0 0.3rem",
                    color: "#9ca3af",
                  }}
                >
                  Posting as{" "}
                  <strong>
                    {getSafeDisplayName(profileDisplayName)}
                  </strong>
                  .
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    style={{ maxWidth: "110px" }}
                    placeholder="Rating"
                    value={communityRating}
                    onChange={(e) =>
                      setCommunityRating(e.target.value)
                    }
                    className="community-input"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="What did you think?"
                  value={communityText}
                  onChange={(e) =>
                    setCommunityText(e.target.value)
                  }
                  className="community-textarea"
                />
                <button
                  type="submit"
                  className="btn-primary community-submit"
                >
                  {currentUserReview ? "Update review" : "Submit review"}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerOpen && (
        <div
          className="trailer-modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
          onClick={closeTrailer}
        >
          <div
            className="trailer-modal-content"
            style={{
              position: "relative",
              width: "80%",
              maxWidth: "720px",
              aspectRatio: "16/9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={trailerEmbedUrl}
              title={`${movie.title} trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "12px",
              }}
            />
            <button
              onClick={closeTrailer}
              style={{
                position: "absolute",
                top: "-30px",
                right: 0,
                background: "transparent",
                color: "#fff",
                fontSize: "1.5rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieModal;
