import { useState, useMemo, useEffect } from "react";
import { movies } from "./movies";
import { fetchDetailsForMovie } from "./api/tmdb";
import MovieReviews from "./components/MovieReviews";

const FILTERS_STORAGE_KEY = "gmtFilters";
const FAVORITES_STORAGE_KEY = "gmtFavorites";
const WATCHLIST_STORAGE_KEY = "gmtWatchlist";
const GAVIN_REVIEWS_KEY = "gmtGavinReviews";
const SEEN_STORAGE_KEY = "gmtSeen";
const RECENTLY_WATCHED_KEY = "gmtRecentlyWatched";

function normalizeForSearch(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function fuzzyMatch(query, text) {
  const q = normalizeForSearch(query);
  if (!q) return true;

  const t = normalizeForSearch(text);
  let qi = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
    }
  }

  return qi === q.length;
}

function App() {
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title-asc");
  const [detailsMap, setDetailsMap] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [seen, setSeen] = useState({});
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [modalMovieId, setModalMovieId] = useState(null);
  const [view, setView] = useState("all"); // "all" | "favorites" | "watchlist" | "recent"
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Gavin reviews
  const [gavinReviews, setGavinReviews] = useState({});

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const rawFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (rawFilters) {
        const parsed = JSON.parse(rawFilters);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.formatFilter) setFormatFilter(parsed.formatFilter);
        if (parsed.genreFilter) setGenreFilter(parsed.genreFilter);
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.view) setView(parsed.view);
      }

      const rawFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (rawFavs) {
        const parsedFavs = JSON.parse(rawFavs);
        if (Array.isArray(parsedFavs)) setFavorites(parsedFavs);
      }

      const rawWatch = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (rawWatch) {
        const parsedWatch = JSON.parse(rawWatch);
        if (Array.isArray(parsedWatch)) setWatchlist(parsedWatch);
      }

      const rawGavin = localStorage.getItem(GAVIN_REVIEWS_KEY);
      if (rawGavin) {
        const parsedGavin = JSON.parse(rawGavin);
        if (parsedGavin && typeof parsedGavin === "object") {
          setGavinReviews(parsedGavin);
        }
      }

      const rawSeen = localStorage.getItem(SEEN_STORAGE_KEY);
      if (rawSeen) {
        const parsedSeen = JSON.parse(rawSeen);
        if (parsedSeen && typeof parsedSeen === "object") {
          setSeen(parsedSeen);
        }
      }

      const rawRecent = localStorage.getItem(RECENTLY_WATCHED_KEY);
      if (rawRecent) {
        const parsedRecent = JSON.parse(rawRecent);
        if (Array.isArray(parsedRecent)) {
          setRecentlyWatched(parsedRecent);
        }
      }
    } catch (e) {
      console.warn("Error reading localStorage:", e);
    }
  }, []);

  // Save filters, favourites, watchlist, reviews, seen & recents whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          search,
          formatFilter,
          genreFilter,
          sortBy,
          view,
        })
      );
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
      localStorage.setItem(GAVIN_REVIEWS_KEY, JSON.stringify(gavinReviews));
      localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
      localStorage.setItem(
        RECENTLY_WATCHED_KEY,
        JSON.stringify(recentlyWatched)
      );
    } catch (e) {
      console.warn("Error writing localStorage:", e);
    }
  }, [
    search,
    formatFilter,
    genreFilter,
    sortBy,
    view,
    favorites,
    watchlist,
    gavinReviews,
    seen,
    recentlyWatched,
  ]);

  // Sets for quick lookup
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);
  const seenSet = useMemo(
    () => new Set(Object.keys(seen).map((id) => Number(id))),
    [seen]
  );
  const recentSet = useMemo(() => new Set(recentlyWatched), [recentlyWatched]);

  // Unique formats
  const formats = useMemo(
    () => ["all", ...new Set(movies.map((m) => m.format || "Unknown"))],
    []
  );

  // Unique genres
  const genres = useMemo(() => {
    const set = new Set();

    Object.values(detailsMap).forEach((details) => {
      (details.genres || []).forEach((g) => set.add(g));
    });

    movies.forEach((m) => {
      if (m.genre) set.add(m.genre);
    });

    return ["all", ...Array.from(set).sort()];
  }, [detailsMap]);

  const MAX_VISIBLE_CHIPS = 8;

  const visibleFormats = showAllFormats
    ? formats
    : formats.slice(0, MAX_VISIBLE_CHIPS);

  const visibleGenres = showAllGenres
    ? genres
    : genres.slice(0, MAX_VISIBLE_CHIPS);

  // Base list by view (all / favourites / watchlist / recent)
  const baseMovies = useMemo(() => {
    if (view === "favorites") {
      return movies.filter((m) => favoriteSet.has(m.id));
    }
    if (view === "watchlist") {
      return movies.filter((m) => watchlistSet.has(m.id));
    }
    if (view === "recent") {
      return movies.filter((m) => recentSet.has(m.id));
    }
    return movies;
  }, [view, favoriteSet, watchlistSet, recentSet]);

  // Filtering + sorting (with fuzzy search + rating sorts)
  const filteredMovies = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();
    const normalizedSearch = normalizeForSearch(lowerSearch);

    let result = baseMovies.filter((movie) => {
      const details = detailsMap[movie.id];

      const year = details?.year || movie.year || null;
      const genresArr =
        details?.genres || (movie.genre ? [movie.genre] : []);

      // Normal includes-based search
      const basicMatch =
        !lowerSearch ||
        movie.title.toLowerCase().includes(lowerSearch) ||
        genresArr.some((g) => g.toLowerCase().includes(lowerSearch)) ||
        (year && String(year).includes(lowerSearch));

      // Fuzzy: only bother if user typed at least 2 "real" chars
      let fuzzyHit = false;
      if (!basicMatch && normalizedSearch.length >= 2) {
        const searchTargets = [
          movie.title,
          genresArr.join(" "),
          year ? String(year) : "",
        ];

        fuzzyHit = searchTargets.some((t) => fuzzyMatch(normalizedSearch, t));
      }

      const matchesSearch = basicMatch || fuzzyHit;

      const matchesFormat =
        formatFilter === "all"
          ? true
          : (movie.format || "Unknown") === formatFilter;

      const matchesGenre =
        genreFilter === "all"
          ? true
          : genresArr.includes(genreFilter);

      return matchesSearch && matchesFormat && matchesGenre;
    });

    result = [...result];

    result.sort((a, b) => {
      const da = detailsMap[a.id];
      const db = detailsMap[b.id];

      const ya = da?.year || a.year || 0;
      const yb = db?.year || b.year || 0;

      const ga = gavinReviews[a.id]?.rating ?? 0;
      const gb = gavinReviews[b.id]?.rating ?? 0;

      const ta = da?.rating ?? 0; // TMDB rating
      const tb = db?.rating ?? 0;

      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "year-desc":
          return yb - ya;
        case "year-asc":
          return ya - yb;
        case "gavin-desc":
          return gb - ga || a.title.localeCompare(b.title);
        case "gavin-asc":
          return ga - gb || a.title.localeCompare(b.title);
        case "tmdb-desc":
          return tb - ta || a.title.localeCompare(b.title);
        case "tmdb-asc":
          return ta - tb || a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [
    baseMovies,
    search,
    formatFilter,
    genreFilter,
    sortBy,
    detailsMap,
    gavinReviews,
  ]);

  // TMDB details lazy load
  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      for (const movie of movies) {
        if (cancelled) return;
        if (detailsMap[movie.id]) continue;

        const details = await fetchDetailsForMovie(movie.title, movie.year);
        if (!cancelled && details) {
          setDetailsMap((prev) => ({ ...prev, [movie.id]: details }));
        }
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI actions
  const clearFilters = () => {
    setSearch("");
    setFormatFilter("all");
    setGenreFilter("all");
    setSortBy("title-asc");
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleWatchlist = (id) => {
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSeen = (id) => {
    setSeen((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = new Date().toISOString();
      }
      return next;
    });
  };

  const registerRecentlyWatched = (id) => {
    setRecentlyWatched((prev) => {
      const filtered = prev.filter((x) => x !== id);
      return [id, ...filtered].slice(0, 30); // keep latest 30
    });
  };

  const openModal = (id) => {
    setModalMovieId(id);
    registerRecentlyWatched(id);
  };

  const closeModal = () => setModalMovieId(null);

  const handleRandom = () => {
    if (!filteredMovies.length) return;
    const random =
      filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    setModalMovieId(random.id);
    registerRecentlyWatched(random.id);
  };

  // Gavin review helpers
  const setGavinRating = (movieId, rating) => {
    setGavinReviews((prev) => ({
      ...prev,
      [movieId]: {
        rating,
        text: prev[movieId]?.text || "",
      },
    }));
  };

  const setGavinText = (movieId, text) => {
    setGavinReviews((prev) => ({
      ...prev,
      [movieId]: {
        rating: prev[movieId]?.rating || 0,
        text,
      },
    }));
  };

  const modalMovie =
    modalMovieId != null ? movies.find((m) => m.id === modalMovieId) : null;

  const modalDetails =
    modalMovie && detailsMap[modalMovie.id]
      ? detailsMap[modalMovie.id]
      : null;

  const gavinReview =
    modalMovie && gavinReviews[modalMovie.id]
      ? gavinReviews[modalMovie.id]
      : { rating: 0, text: "" };

  const totalCount = movies.length;
  const currentCount = filteredMovies.length;

  const totalSeen = Object.keys(seen).length;
  const totalFavorites = favorites.length;
  const totalWatchlist = watchlist.length;
  const totalRecent = recentlyWatched.length;

  const movieReviewKey =
    modalDetails?.tmdbId != null
      ? String(modalDetails.tmdbId)
      : modalMovie
      ? String(modalMovie.id)
      : null;

  // Build description of active filters for empty state
  const activeFilters = [];
  if (search.trim()) activeFilters.push(`“${search.trim()}”`);
  if (formatFilter !== "all") {
    activeFilters.push(
      formatFilter === "Blu-ray" ? "Blu-Ray format" : `${formatFilter} format`
    );
  }
  if (genreFilter !== "all") activeFilters.push(`${genreFilter} genre`);
  if (view === "favorites") activeFilters.push("Favourites only");
  if (view === "watchlist") activeFilters.push("Watchlist only");
  if (view === "recent") activeFilters.push("Recently watched only");

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Gavin&apos;s Movie Theatre</h1>
          <p>
            {currentCount} of {totalCount} discs showing
          </p>
          <p className="app-header-subline">
            {totalSeen} seen • {totalFavorites} favourites •{" "}
            {totalWatchlist} in watchlist • {totalRecent} recently watched
          </p>
        </div>

        {/* View tabs: All / Favourites / Watchlist / Recent */}
        <div className="view-tabs">
          <button
            className={`view-tab ${view === "all" ? "view-tab--active" : ""}`}
            onClick={() => setView("all")}
          >
            All
          </button>
          <button
            className={`view-tab ${
              view === "favorites" ? "view-tab--active" : ""
            }`}
            onClick={() => setView("favorites")}
          >
            ⭐ Favourites
          </button>
          <button
            className={`view-tab ${
              view === "watchlist" ? "view-tab--active" : ""
            }`}
            onClick={() => setView("watchlist")}
          >
            📺 Watchlist
          </button>
          <button
            className={`view-tab ${
              view === "recent" ? "view-tab--active" : ""
            }`}
            onClick={() => setView("recent")}
          >
            ⏱ Recently Watched
          </button>
        </div>
      </header>

      <div className="layout">
        {/* Sidebar filter panel */}
        <aside className="sidebar">
          <h3 className="sidebar-title">Filters</h3>

          <label className="sidebar-label">Search</label>
          <input
            className="sidebar-input"
            type="text"
            placeholder="Title, genre, year…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label className="sidebar-label">Sort By</label>
          <select
            className="sidebar-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
            <option value="year-desc">Year (new → old)</option>
            <option value="year-asc">Year (old → new)</option>
            <option value="gavin-desc">Gavin&apos;s Score (high → low)</option>
            <option value="gavin-asc">Gavin&apos;s Score (low → high)</option>
            <option value="tmdb-desc">TMDB Rating (high → low)</option>
            <option value="tmdb-asc">TMDB Rating (low → high)</option>
          </select>

          <button className="btn-secondary" onClick={clearFilters}>
            Reset Filters
          </button>

          <button className="btn-primary" onClick={handleRandom}>
            🎲 Random Movie
          </button>

          <div className="chip-row chip-row--stacked">
            <span className="chip-row-label">Format</span>
            <div className="chip-row-inner">
              {visibleFormats.map((format) => {
                const label =
                  format === "all"
                    ? "All Formats"
                    : format === "Blu-ray"
                    ? "Blu-Ray"
                    : format;
                const isActive = formatFilter === format;

                return (
                  <button
                    key={format}
                    className={`chip ${isActive ? "chip--active" : ""}`}
                    onClick={() => setFormatFilter(format)}
                  >
                    {label}
                  </button>
                );
              })}

              {formats.length > MAX_VISIBLE_CHIPS && (
                <button
                  type="button"
                  className="chip chip--more"
                  onClick={() => setShowAllFormats((v) => !v)}
                >
                  {showAllFormats ? "Less" : "More…"}
                </button>
              )}
            </div>
          </div>

          <div className="chip-row chip-row--stacked">
            <span className="chip-row-label">Genre</span>
            <div className="chip-row-inner">
              {visibleGenres.map((genre) => {
                const label = genre === "all" ? "All Genres" : genre;
                const isActive = genreFilter === genre;

                return (
                  <button
                    key={genre}
                    className={`chip ${isActive ? "chip--active" : ""}`}
                    onClick={() => setGenreFilter(genre)}
                  >
                    {label}
                  </button>
                );
              })}

              {genres.length > MAX_VISIBLE_CHIPS && (
                <button
                  type="button"
                  className="chip chip--more"
                  onClick={() => setShowAllGenres((v) => !v)}
                >
                  {showAllGenres ? "Less" : "More…"}
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="content">
          {filteredMovies.length === 0 ? (
            <div className="empty">
              <p>No movies match your current filters.</p>
              {activeFilters.length > 0 && (
                <p className="empty-filters">
                  Active filters: {activeFilters.join(" • ")}
                </p>
              )}
              <div className="empty-actions">
                <button className="btn-secondary" onClick={clearFilters}>
                  Clear filters & search
                </button>
                {baseMovies.length > 0 && (
                  <button className="btn-primary" onClick={handleRandom}>
                    🎲 Random Movie
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid">
              {filteredMovies.map((movie) => {
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
                const isSeen = seenSet.has(movie.id);
                const isRecent = recentSet.has(movie.id);

                const tmdbRating = details?.rating ?? null;

                return (
                  <article
                    key={movie.id}
                    className={`card ${
                      isFavorite || inWatchlist || isSeen || isRecent
                        ? "card--highlight"
                        : ""
                    }`}
                  >
                    <div
                      className="cover"
                      onClick={() => openModal(movie.id)}
                    >
                      {(isFavorite || inWatchlist || isSeen || isRecent) && (
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
                          {isSeen && (
                            <span className="card-ribbon card-ribbon--seen">
                              SEEN
                            </span>
                          )}
                          {isRecent && !isSeen && (
                            <span className="card-ribbon card-ribbon--recent">
                              RECENT
                            </span>
                          )}
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
                      {tmdbRating != null && (
                        <div
                          className={`card-rating-badge ${
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

                      <h2 onClick={() => openModal(movie.id)}>
                        {movie.title}
                      </h2>
                      {meta && <p className="meta">{meta}</p>}

                      <p className="format">
                        {movie.format === "Blu-ray"
                          ? "Blu-Ray"
                          : movie.format}
                      </p>

                      <div className="card-actions">
                        <button
                          className={`icon-button ${
                            isFavorite ? "icon-button--active" : ""
                          }`}
                          onClick={() => toggleFavorite(movie.id)}
                          title="Toggle favourite"
                        >
                          <span className="icon-symbol">★</span>
                        </button>
                        <button
                          className={`icon-button ${
                            inWatchlist ? "icon-button--active" : ""
                          }`}
                          onClick={() => toggleWatchlist(movie.id)}
                          title="Toggle watchlist"
                        >
                          <span className="icon-symbol">▶</span>
                        </button>
                        <button
                          className={`icon-button ${
                            isSeen ? "icon-button--active" : ""
                          }`}
                          onClick={() => toggleSeen(movie.id)}
                          title="Mark as seen"
                        >
                          <span className="icon-symbol">👁</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalMovie && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>

            <div className="modal-content">
              <div className="modal-poster">
                <img
                  src={modalDetails?.posterUrl || modalMovie.image}
                  alt={modalMovie.title}
                />
              </div>

              <div className="modal-info">
                <h2>{modalMovie.title}</h2>

                {modalDetails?.year && (
                  <p>
                    <strong>Year:</strong> {modalDetails.year}
                  </p>
                )}

                {modalDetails?.genres && modalDetails.genres.length > 0 && (
                  <p>
                    <strong>Genres:</strong>{" "}
                    {modalDetails.genres.join(", ")}
                  </p>
                )}

                {modalDetails?.runtime && (
                  <p>
                    <strong>Runtime:</strong> {modalDetails.runtime} min
                  </p>
                )}

                {modalDetails?.rating && (
                  <p>
                    <strong>TMDB Rating:</strong>{" "}
                    {modalDetails.rating.toFixed(1)}/10
                  </p>
                )}

                {modalDetails?.director && (
                  <p>
                    <strong>Director:</strong>{" "}
                    <button
                      type="button"
                      className="chip"
                      onClick={() => {
                        setSearch(modalDetails.director);
                        setView("all");
                        closeModal();
                      }}
                    >
                      {modalDetails.director}
                    </button>
                  </p>
                )}

                {modalDetails?.cast && modalDetails.cast.length > 0 && (
                  <p className="modal-cast">
                    <strong>Cast:</strong>{" "}
                    {modalDetails.cast.slice(0, 6).map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="chip"
                        onClick={() => {
                          setSearch(name);
                          setView("all");
                          closeModal();
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </p>
                )}

                {seen[modalMovie.id] && (
                  <p>
                    <strong>Last watched:</strong>{" "}
                    {new Date(seen[modalMovie.id]).toLocaleDateString()}
                  </p>
                )}

                {modalDetails?.overview && (
                  <p className="modal-overview">{modalDetails.overview}</p>
                )}

                {modalDetails?.trailerKey && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      className="chip chip--primary"
                      onClick={() =>
                        window.open(
                          `https://www.youtube.com/watch?v=${modalDetails.trailerKey}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      ▶ Watch Trailer
                    </button>
                  </div>
                )}

                {/* Reviews */}
                <div className="review-sections">
                  {/* Gavin's Review */}
                  <section className="review-section">
                    <div className="review-section-header">
                      <h3 className="review-section-title">
                        Gavin&apos;s Score
                      </h3>
                    </div>

                    <div className="star-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-button ${
                            gavinReview.rating >= star
                              ? "star-button--filled"
                              : ""
                          }`}
                          onClick={() =>
                            setGavinRating(modalMovie.id, star)
                          }
                        >
                          ★
                        </button>
                      ))}
                      <span className="star-label">
                        {gavinReview.rating
                          ? `${gavinReview.rating} / 5`
                          : "Tap to rate"}
                      </span>
                    </div>

                    <textarea
                      className="review-textarea"
                      rows={3}
                      placeholder="Your personal thoughts on this movie…"
                      value={gavinReview.text}
                      onChange={(e) =>
                        setGavinText(modalMovie.id, e.target.value)
                      }
                    />
                  </section>

                  {/* Shared community reviews via Supabase */}
                  <MovieReviews
                    movieKey={movieReviewKey}
                    title={modalMovie.title}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    className={`chip ${
                      favoriteSet.has(modalMovie.id) ? "chip--active" : ""
                    }`}
                    onClick={() => toggleFavorite(modalMovie.id)}
                  >
                    {favoriteSet.has(modalMovie.id)
                      ? "⭐ In Favourites"
                      : "☆ Add to Favourites"}
                  </button>

                  <button
                    className={`chip ${
                      watchlistSet.has(modalMovie.id) ? "chip--active" : ""
                    }`}
                    onClick={() => toggleWatchlist(modalMovie.id)}
                  >
                    {watchlistSet.has(modalMovie.id)
                      ? "📺 In Watchlist"
                      : "+ Add to Watchlist"}
                  </button>

                  <button
                    className={`chip ${
                      seen[modalMovie.id] ? "chip--active" : ""
                    }`}
                    onClick={() => toggleSeen(modalMovie.id)}
                  >
                    {seen[modalMovie.id]
                      ? "👁 Marked as Seen"
                      : "👁 Mark as Seen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
