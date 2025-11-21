// src/components/MovieReviews.jsx
import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

function MovieReviews({ movieKey, title }) {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load review data
  useEffect(() => {
    async function loadReviews() {
      if (!movieKey) return;

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_id", movieKey)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading reviews:", error);
        setError("Could not load reviews.");
      } else {
        setReviews(data || []);
      }

      setLoading(false);
    }

    loadReviews();
  }, [movieKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!movieKey) return;

    const trimmedName = name.trim();
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      setError("Please write a comment.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      movie_id: movieKey,
      rating: Number(rating),
      name: trimmedName || "Guest",
      comment: trimmedComment,
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error saving review:", error);
      setError("Could not save your review. Please try again.");
    } else {
      setReviews((prev) => [data, ...prev]);
      setComment("");
      setRating(5);
    }

    setSubmitting(false);
  }

  return (
    <section className="review-section">
      <div className="review-section-header">
        <h3 className="review-section-title">Community Opinions</h3>
      </div>

      {/* Review form */}
      <form onSubmit={handleSubmit} className="community-form">
        <input
          className="community-input"
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="star-row" style={{ marginTop: "0.5rem" }}>
          <label className="review-section-sub" style={{ marginRight: "0.5rem" }}>
            Rating
          </label>
          <select
            className="sidebar-select"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Star{r > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="community-textarea"
          rows={2}
          placeholder="Share your thoughts…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {error && <p className="community-empty">{error}</p>}

        <button
          type="submit"
          className="btn-primary community-submit"
          disabled={submitting}
        >
          {submitting ? "Posting…" : "Post Opinion"}
        </button>
      </form>

      {/* Review list */}
      {loading ? (
        <p className="community-empty">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="community-empty">
          No opinions yet for {title || "this movie"}. Be the first.
        </p>
      ) : (
        <ul className="community-list">
          {reviews.map((rev) => (
            <li key={rev.id} className="community-item">
              <div className="community-meta">
                <span className="community-author">{rev.name || "Guest"}</span>
                {rev.rating != null && (
                  <span className="community-date">
                    {"★".repeat(rev.rating)}{" "}
                    <span className="star-label">({rev.rating}/5)</span>
                  </span>
                )}
                <span className="community-date">
                  {rev.created_at
                    ? new Date(rev.created_at).toLocaleString()
                    : ""}
                </span>
              </div>

              <p className="community-body">{rev.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default MovieReviews;
