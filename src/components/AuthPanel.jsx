// src/components/AuthPanel.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../api/supabaseClient";

function sanitizeDisplayName(raw) {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2 || !/[a-zA-Z]/.test(cleaned)) {
    return "";
  }
  return cleaned;
}

function AuthPanel({ user, loading }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // "sent" | "error" | null
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [profileStatus, setProfileStatus] = useState(null); // "saved" | "error" | null
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Load profile.display_name when user changes
  useEffect(() => {
    if (!user) {
      setDisplayName("");
      setProfileStatus(null);
      setProfileError("");
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (!error && data?.display_name) {
          setDisplayName(data.display_name.trim());
        } else {
          setDisplayName("");
        }
      } catch {
        if (!cancelled) setDisplayName("");
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus(null);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: "https://movies.gavinmoore.ca",
      },
    });

    if (error) {
      console.error("Error sending magic link:", error);
      setStatus("error");
      setErrorMsg(error.message || "Could not send link.");
      return;
    }

    setStatus("sent");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setStatus(null);
    setErrorMsg("");
    setEmail("");
    setIsOpen(false);
    setDisplayName("");
    setProfileStatus(null);
    setProfileError("");
  };

  const handleSaveDisplayName = async (e) => {
    e.preventDefault();
    if (!user) return;

    const cleaned = sanitizeDisplayName(displayName);

    if (!cleaned) {
      setProfileStatus("error");
      setProfileError(
        "Nickname must be at least 2 characters and include a letter."
      );
      return;
    }

    setProfileStatus(null);
    setProfileError("");
    setProfileSaving(true);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: cleaned,
        },
        { onConflict: "id" }
      );

    setProfileSaving(false);

    if (error) {
      console.error("Error saving display name:", error);
      setProfileStatus("error");
      setProfileError("Could not save nickname. Please try again.");
      return;
    }

    setDisplayName(cleaned);
    setProfileStatus("saved");
  };

  const openModal = () => {
    setIsOpen(true);
    setStatus(null);
    setErrorMsg("");
    setProfileStatus(null);
    setProfileError("");
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // ---------- PORTAL MODAL CONTENT ----------
  const modal = isOpen
    ? createPortal(
        <div
          className="auth-modal-backdrop"
          onClick={closeModal}
          style={{
            // hard safety net in case CSS gets weird
            zIndex: 6000,
          }}
        >
          <div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              zIndex: 6100,
            }}
          >
            <button
              type="button"
              className="auth-modal-close"
              onClick={closeModal}
            >
              ✕
            </button>

            <h2 className="auth-modal-title">Account</h2>

            {loading ? (
              <p className="auth-text auth-text-muted">
                Checking your session…
              </p>
            ) : user ? (
              <>
                <p className="auth-text">
                  You&apos;re signed in and can leave community reviews.
                </p>
                <p className="auth-text auth-text-muted">
                  Your email is used only for sign-in. It is{" "}
                  <strong>never shown publicly</strong>.
                </p>

                <form onSubmit={handleSaveDisplayName} className="auth-form">
                  <label className="auth-label">
                    Nickname (shown next to your reviews)
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. The Projectionist"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setProfileStatus(null);
                      setProfileError("");
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-primary auth-button"
                    disabled={profileSaving}
                  >
                    {profileSaving ? "Saving…" : "Save nickname"}
                  </button>
                </form>

                {profileStatus === "saved" && (
                  <p className="auth-text auth-text-success">
                    Nickname saved. Future reviews will use this.
                  </p>
                )}
                {profileStatus === "error" && (
                  <p className="auth-text auth-text-error">
                    {profileError}
                  </p>
                )}

                <hr className="auth-divider" />

                <button
                  type="button"
                  className="btn-secondary auth-button"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <p className="auth-text auth-text-muted">
                  Enter your email and I&apos;ll send you a magic link to sign
                  in.
                </p>
                <form onSubmit={handleSendLink} className="auth-form">
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <button type="submit" className="btn-primary auth-button">
                    Send magic link
                  </button>
                </form>

                {status === "sent" && (
                  <p className="auth-text auth-text-success">
                    Link sent! Check your email.
                  </p>
                )}
                {status === "error" && (
                  <p className="auth-text auth-text-error">{errorMsg}</p>
                )}
              </>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Compact sidebar pill */}
      <div className="auth-panel-compact">
        {loading ? (
          <span className="auth-compact-text">Checking account…</span>
        ) : user ? (
          <>
            <span className="auth-compact-text">Signed in</span>
            <button
              type="button"
              className="btn-secondary auth-compact-button"
              onClick={openModal}
            >
              Account
            </button>
          </>
        ) : (
          <>
            <span className="auth-compact-text">Want to leave reviews?</span>
            <button
              type="button"
              className="btn-primary auth-compact-button"
              onClick={openModal}
            >
              Sign in
            </button>
          </>
        )}
      </div>

      {/* Portal-rendered modal */}
      {modal}
    </>
  );
}

export default AuthPanel;
