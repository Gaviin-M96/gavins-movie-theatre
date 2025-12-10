import { useState, useEffect } from "react";
import { supabase } from "../api/supabaseClient";

const ADMIN_EMAIL = "gavin@gavinmoore.ca"; // ← CHANGE this if needed

function sanitizeDisplayName(raw) {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2 || !/[a-zA-Z]/.test(cleaned)) return "";
  return cleaned;
}

function AuthPanel({ user, loading }) {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");

  // NEW: Session expiration detection
  const [sessionExpired, setSessionExpired] = useState(false);

  // Load profile nickname
  useEffect(() => {
    if (!user) {
      setDisplayName("");
      return;
    }

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (!error && data?.display_name) {
        setDisplayName(data.display_name.trim());
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // NEW: Listen for token refresh / expiration
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "TOKEN_REFRESHED") {
          setSessionExpired(false);
        }

        if (event === "TOKEN_REFRESH_FAILED") {
          setSessionExpired(true);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // NEW: Cross-tab session sync
  useEffect(() => {
    const channel = new BroadcastChannel("auth");
    const sync = () => supabase.auth.getSession();

    channel.onmessage = sync;
    return () => channel.close();
  }, []);

  const broadcastAuth = () => {
    new BroadcastChannel("auth").postMessage("refresh");
  };

  const handleSendLink = async (e) => {
    e.preventDefault();

    setStatusMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setStatusMsg("Error: " + error.message);
      return;
    }

    setStatusMsg("Magic link sent! Check your email.");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    broadcastAuth();
  };

  const handleSaveDisplayName = async (e) => {
    e.preventDefault();
    if (!user) return;

    const cleaned = sanitizeDisplayName(displayName);
    if (!cleaned) {
      setSaveError("Name must be at least 2 letters.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: cleaned }, { onConflict: "id" });

    if (error) {
      setSaveError("Error saving name.");
      return;
    }

    setSaveError("");
    setSaveStatus("Saved!");
  };

  return (
    <>
      {/* Compact pill in sidebar */}
      <div className="auth-panel-compact">
        {loading ? (
          <span className="auth-compact-text">Checking…</span>
        ) : user ? (
          <>
            <span className="auth-compact-text">
              {displayName || user.email}
              {user.email === ADMIN_EMAIL && (
                <span style={{
                  marginLeft: "6px",
                  color: "#ffd75a",
                  fontWeight: "600",
                  fontSize: "0.75rem"
                }}>
                  (Admin)
                </span>
              )}
            </span>

            <button
              className="btn-secondary auth-compact-button"
              onClick={() => setIsOpen(true)}
            >
              Account
            </button>
          </>
        ) : (
          <>
            <span className="auth-compact-text">Want to leave reviews?</span>
            <button
              className="btn-primary auth-compact-button"
              onClick={() => setIsOpen(true)}
            >
              Sign In
            </button>
          </>
        )}
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="auth-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="auth-modal-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>

            <h2 className="auth-modal-title">Account</h2>

            {sessionExpired && (
              <p className="auth-text-error" style={{ marginBottom: "0.5rem" }}>
                ⚠️ Your session expired — please sign in again.
              </p>
            )}

            {!user ? (
              <>
                <p className="auth-text auth-text-muted">
                  Enter your email and I’ll send you a magic login link.
                </p>

                <form onSubmit={handleSendLink} className="auth-form">
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button className="btn-primary auth-button">
                    Send Link
                  </button>
                </form>

                {statusMsg && (
                  <p className="auth-text auth-text-success">{statusMsg}</p>
                )}
              </>
            ) : (
              <>
                <p className="auth-text">
                  Signed in as <strong>{user.email}</strong>
                  {user.email === ADMIN_EMAIL && (
                    <span style={{ color: "#ffd75a", marginLeft: "6px" }}>
                      (Admin)
                    </span>
                  )}
                </p>

                {/* Nickname editor */}
                <form onSubmit={handleSaveDisplayName} className="auth-form">
                  <label className="auth-label">Nickname</label>
                  <input
                    className="auth-input"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setSaveStatus("");
                    }}
                  />

                  <button className="btn-primary auth-button">
                    Save Name
                  </button>
                </form>

                {saveStatus && (
                  <p className="auth-text-success">{saveStatus}</p>
                )}
                {saveError && (
                  <p className="auth-text-error">{saveError}</p>
                )}

                <hr className="auth-divider" />

                <button
                  className="btn-secondary auth-button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AuthPanel;
