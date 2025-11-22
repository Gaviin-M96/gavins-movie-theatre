import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

export default function MovieReviews({ movieKey, title }) {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load reviews quietly (no visible error)
  useEffect(() => {
    async function load() {
      if (!movieKey) return;

      setLoading(true);

      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_id", movieKey)
        .order("created_at", { ascending: false });

      setReviews(data || []);
      setLoading(false);
    }

    load();
  }, [movieKey]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!movieKey) return;

    const trimmedComment = comment.trim();
    const trimmedName = name.trim();

    if (!trimmedComment) return; // silent fail, no message

    setSubmitting(true);

    const payload = {
      movie_id: movieKey,
      rating: Number(rating),
      comment: trimmedComment,
      name: trimmedName || "Guest",
    };

    const { data } = await supabase
      .from("reviews")
      .insert(payload)
      .select()
      .single();

    if (data) {
      setReviews((prev) => [data, ...prev]);
      setComment("");
      setRating(0);
    }

    setSubmitting(false);
  }

  return (
    <section className="review-section">
      <div className="review-section-header">
        <h3 className="review-section-title">Community Opinions</h3>
      </div>

      {/* Star Rating Row */}
      <div className="star-row" style={{ marginBottom: "0.4rem" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-button ${rating >= star ? "star-button--filled" : ""}`}
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
        <span className="star-label">
          {rating ? `${rating} / 5` : "Tap to rate"}
        </span>
      </div>

      {/* Comment box */}
      <form onSubmit={handleSubmit} className="community-form">
        <input
          className="community-input"
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          className="community-textarea"
          rows={2}
          placeholder="Share your thoughts…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          type="submit"
          className="btn-primary community-submit"
          disabled={submitting}
        >
          {submitting ? "Posting…" : "Post Opinion"}
        </button>
      </form>

      {/* Reviews */}
      {loading ? null : reviews.length === 0 ? null : (
        <ul className="community-list">
          {reviews.map((rev) => (
            <li key={rev.id} className="community-item">
              <div className="community-meta">
                <span className="community-author">{rev.name || "Guest"}</span>
                {rev.rating != null && (
                  <span className="community-date">
                    {"★".repeat(rev.rating)} <span className="star-label">({rev.rating}/5)</span>
                  </span>
                )}
                <span className="community-date">
                  {rev.created_at ? new Date(rev.created_at).toLocaleString() : ""}
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
