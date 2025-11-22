import { useState, useMemo, useEffect } from "react";
import { movies } from "./movies";
import { fetchDetailsForMovie } from "./api/tmdb";
import MovieReviews from "./components/MovieReviews";

const FILTERS_STORAGE_KEY = "gmtFilters";
const FAVORITES_STORAGE_KEY = "gmtFavorites";
const WATCHLIST_STORAGE_KEY = "gmtWatchlist";
const GAVIN_REVIEWS_KEY = "gmtGavinReviews";

function App() {
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title-asc");
  const [detailsMap, setDetailsMap] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [modalMovieId, setModalMovieId] = useState(null);
  const [view, setView] = useState("all"); // "all" | "favorites" | "watchlist"
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [highlightMovieId, setHighlightMovieId] = useState(null);

  // Gavin reviews
  const [gavinReviews, setGavinReviews] = useState({});

  // Load saved state from localStorage + deep-link movie from URL
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
    } catch (e) {
      console.warn("Error reading localStorage:", e);
    }

    // Deep link: open ?movie=ID on first load
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const movieParam = url.searchParams.get("movie");
      if (movieParam) {
        const parsedId = parseInt(movieParam, 10);
        if (movies.some((m) => m.id === parsedId)) {
          setModalMovieId(parsedId);
        }
      }
    }
  }, []);

  // Save filters, favourites, watchlist, reviews whenever they change
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
  ]);

  // Sets for quick lookup
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

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

  // Determine base list by view (all / favourites / watchlist)
  const baseMovies = useMemo(() => {
    if (view === "favorites") {
      return movies.filter((m) => favoriteSet.has(m.id));
    }
    if (view === "watchlist") {
      return movies.filter((m) => watchlistSet.has(m.id));
    }
    return movies;
  }, [view, favoriteSet, watchlistSet]);

  // Filtering + sorting
  const filteredMovies = useMemo(() => {
    const lowerSearch = search.toLowerCase().trim();

    let result = baseMovies.filter((movie) => {
      const details = detailsMap[movie.id];

      const year = details?.year || movie.year || null;
      const genresArr =
        details?.genres || (movie.genre ? [movie.genre] : []);

      const matchesSearch =
        !lowerSearch ||
        movie.title.toLowerCase().includes(lowerSearch) ||
        genresArr.some((g) => g.toLowerCase().includes(lowerSearch)) ||
        (year && String(year).includes(lowerSearch));

      const matchesFormat =
        formatFilter === "all"
          ? true
          : (movie.format || "Unknown") === formatFilter;

      const matchesGenre =
        genreFilter === "all" ? true : genresArr.includes(genreFilter);

      return matchesSearch && matchesFormat && matchesGenre;
    });

    result = [...result];
    result.sort((a, b) => {
      const da = detailsMap[a.id];
      const db = detailsMap[b.id];

      const ya = da?.year || a.year || 0;
      const yb = db?.year || b.year || 0;

      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "year-desc":
          return yb - ya;
        case "year-asc":
          return ya - yb;
        default:
          return 0;
      }
    });

    return result;
  }, [baseMovies, search, formatFilter, genreFilter, sortBy, detailsMap]);

  // TMDB details
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

  const updateUrlForMovie = (id) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id == null) {
      url.searchParams.delete("movie");
    } else {
      url.searchParams.set("movie", String(id));
    }
    window.history.pushState({}, "", url.toString());
  };

  const openModal = (id) => {
    setModalMovieId(id);
    setHighlightMovieId(null);
    updateUrlForMovie(id);
  };

  const closeModal = () => {
    setModalMovieId(null);
    updateUrlForMovie(null);
  };

  const handleRandom = () => {
    if (!filteredMovies.length) return;
    const random =
      filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    setHighlightMovieId(random.id);
    openModal(random.id);
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

  const movieReviewKey =
    modalDetails?.tmdbId != null
      ? String(modalDetails.tmdbId)
      : modalMovie
      ? String(modalMovie.id)
      : null;

  // Keyboard shortcuts when modal is open
  useEffect(() => {
    if (!modalMovie) return;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const index = filteredMovies.findIndex(
          (m) => m.id === modalMovie.id
        );
        if (index === -1) return;

        if (e.key === "ArrowRight" && index < filteredMovies.length - 1) {
          const nextMovie = filteredMovies[index + 1];
          openModal(nextMovie.id);
        } else if (e.key === "ArrowLeft" && index > 0) {
          const prevMovie = filteredMovies[index - 1];
          openModal(prevMovie.id);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalMovie, filteredMovies]);

  // Backup / restore (favorites, watchlist, gavinReviews)
  const handleBackup = () => {
    const payload = {
      favorites,
      watchlist,
      gavinReviews,
    };
    const json = JSON.stringify(payload);

    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(json)
          .then(() => {
            alert("Backup copied to your clipboard.");
          })
          .catch(() => {
            alert("Backup JSON:\n" + json);
          });
      } else {
        alert("Backup JSON:\n" + json);
      }
    } catch {
      alert("Backup JSON:\n" + json);
    }
  };

  const handleRestore = () => {
    const input = window.prompt(
      "Paste your backup JSON here to restore your data:"
    );
    if (!input) return;

    try {
      const data = JSON.parse(input);

      if (Array.isArray(data.favorites)) {
        setFavorites(data.favorites);
      }
      if (Array.isArray(data.watchlist)) {
        setWatchlist(data.watchlist);
      }
      if (data.gavinReviews && typeof data.gavinReviews === "object") {
        setGavinReviews(data.gavinReviews);
      }

      alert("Backup restored.");
    } catch (e) {
      console.error(e);
      alert("That backup JSON could not be parsed.");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Gavin&apos;s Movie Theatre</h1>
          <p>
            {currentCount} of {totalCount} discs showing
          </p>
        </div>

        {/* View tabs: All / Favourites / Watchlist */}
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
            <p className="empty">No matches.</p>
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
                const gReview = gavinReviews[movie.id];
                const gRating = gReview?.rating || 0;

                return (
                  <article
                    key={movie.id}
                    className={`card ${
                      highlightMovieId === movie.id ? "card--highlight" : ""
                    }`}
                  >
                    {isFavorite || inWatchlist ? (
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
                    ) : null}

                    <div
                      className="cover"
                      onClick={() => openModal(movie.id)}
                    >
                      <img src={posterUrl} alt={movie.title} loading="lazy" />
                    </div>
                    <div className="card-body">
                      <h2 onClick={() => openModal(movie.id)}>
                        {movie.title}
                      </h2>
                      {meta && <p className="meta">{meta}</p>}

                      <p className="format">
                        {movie.format === "Blu-ray"
                          ? "Blu-Ray"
                          : movie.format}
                      </p>

                      {gRating > 0 && (
                        <div className="card-rating-badge">
                          ⭐ {gRating}/5
                        </div>
                      )}

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

                {!modalDetails && (
                  <p className="modal-loading">Loading extra details…</p>
                )}

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
                    <strong>Rating:</strong>{" "}
                    {modalDetails.rating.toFixed(1)}/10
                  </p>
                )}

                {modalDetails?.director && (
                  <p>
                    <strong>Director:</strong> {modalDetails.director}
                  </p>
                )}

                {modalDetails?.overview && (
                  <p className="modal-overview">{modalDetails.overview}</p>
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
