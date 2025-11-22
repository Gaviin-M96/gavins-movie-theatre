import { useState, useMemo, useEffect } from "react";
import { movies } from "./movies";
import { fetchDetailsForMovie } from "./api/tmdb";
import Header from "./components/Header";
import FiltersSidebar from "./components/FiltersSidebar";
import MovieGrid from "./components/MovieGrid";
import MovieModal from "./components/MovieModal";

const FILTERS_STORAGE_KEY = "gmtFilters";
const FAVORITES_STORAGE_KEY = "gmtFavorites";
const WATCHLIST_STORAGE_KEY = "gmtWatchlist";
const GAVIN_REVIEWS_KEY = "gmtGavinReviews";
const SEEN_STORAGE_KEY = "gmtSeen";

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
  const [modalMovieId, setModalMovieId] = useState(null);
  const [view, setView] = useState("all"); // "all" | "favorites" | "watchlist" | "seen" | "top"
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Gavin reviews
  const [gavinReviews, setGavinReviews] = useState({});

  // Set browser tab title
  useEffect(() => {
    document.title = "Gavin's Movie Theatre";
  }, []);

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
    } catch (e) {
      console.warn("Error reading localStorage:", e);
    }
  }, []);

  // Save filters, favourites, watchlist, reviews & seen whenever they change
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
  ]);

  // Close modal with Esc + prevent background scroll when modal is open
  useEffect(() => {
    if (modalMovieId == null) {
      document.body.classList.remove("modal-open");
      return;
    }

    document.body.classList.add("modal-open");

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setModalMovieId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalMovieId]);

  // Sets for quick lookup
  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);
  const seenSet = useMemo(
    () => new Set(Object.keys(seen).map((id) => Number(id))),
    [seen]
  );

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

  // Base list by view (all / favourites / watchlist / seen / top rated)
  const baseMovies = useMemo(() => {
    if (view === "favorites") {
      return movies.filter((m) => favoriteSet.has(m.id));
    }
    if (view === "watchlist") {
      return movies.filter((m) => watchlistSet.has(m.id));
    }
    if (view === "seen") {
      return movies.filter((m) => seenSet.has(m.id));
    }
    if (view === "top") {
      return movies.filter((m) => {
        const gRating = gavinReviews[m.id]?.rating ?? 0;
        const tRating = detailsMap[m.id]?.rating ?? 0;
        // Top rated if Gavin >= 4, or TMDB >= 8 when no Gavin rating
        return gRating >= 4 || (!gRating && tRating >= 8);
      });
    }
    return movies;
  }, [view, favoriteSet, watchlistSet, seenSet, gavinReviews, detailsMap]);

  // Filtering + sorting
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

      // Fuzzy: only bother if user typed at least 2 "real" characters
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
        genreFilter === "all" ? true : genresArr.includes(genreFilter);

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

  // TMDB details lazy-ish load: fetch only missing movies, in batches
  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      const missing = movies.filter((movie) => !detailsMap[movie.id]);
      if (!missing.length) return;

      try {
        const results = await Promise.all(
          missing.map(async (movie) => {
            const details = await fetchDetailsForMovie(
              movie.title,
              movie.year
            );
            return { id: movie.id, details };
          })
        );

        if (cancelled) return;

        setDetailsMap((prev) => {
          const next = { ...prev };
          for (const { id, details } of results) {
            if (details && !next[id]) {
              next[id] = details;
            }
          }
          return next;
        });
      } catch (e) {
        console.warn("Error loading TMDB details:", e);
      }
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [detailsMap]);

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

  const openModal = (id) => {
    setModalMovieId(id);
  };

  const closeModal = () => setModalMovieId(null);

  const handleRandom = () => {
    if (!filteredMovies.length) return;
    const random =
      filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    setModalMovieId(random.id);
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
  if (view === "seen") activeFilters.push("Seen only");
  if (view === "top") activeFilters.push("Top rated only");

  const handleQuickSearch = (query) => {
    setSearch(query);
    setView("all");
    setModalMovieId(null);
  };

  return (
    <div className="app">
      <Header
        currentCount={currentCount}
        totalCount={totalCount}
        totalSeen={totalSeen}
        totalFavorites={totalFavorites}
        totalWatchlist={totalWatchlist}
        view={view}
        onChangeView={setView}
      />

      <div className="layout">
        <FiltersSidebar
          search={search}
          sortBy={sortBy}
          formatFilter={formatFilter}
          genreFilter={genreFilter}
          formats={formats}
          genres={genres}
          visibleFormats={visibleFormats}
          visibleGenres={visibleGenres}
          showAllFormats={showAllFormats}
          showAllGenres={showAllGenres}
          onSearchChange={setSearch}
          onSortChange={setSortBy}
          onFormatFilterChange={setFormatFilter}
          onGenreFilterChange={setGenreFilter}
          onClearFilters={clearFilters}
          onRandom={handleRandom}
          onToggleShowAllFormats={() => setShowAllFormats((v) => !v)}
          onToggleShowAllGenres={() => setShowAllGenres((v) => !v)}
        />

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
            <MovieGrid
              movies={filteredMovies}
              detailsMap={detailsMap}
              favoriteSet={favoriteSet}
              watchlistSet={watchlistSet}
              seenSet={seenSet}
              onToggleFavorite={toggleFavorite}
              onToggleWatchlist={toggleWatchlist}
              onToggleSeen={toggleSeen}
              onOpenModal={openModal}
            />
          )}
        </main>
      </div>

      {modalMovie && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>

            <MovieModal
              movie={modalMovie}
              details={modalDetails}
              seenDate={seen[modalMovie.id]}
              isFavorite={favoriteSet.has(modalMovie.id)}
              inWatchlist={watchlistSet.has(modalMovie.id)}
              isSeen={!!seen[modalMovie.id]}
              onToggleFavorite={() => toggleFavorite(modalMovie.id)}
              onToggleWatchlist={() => toggleWatchlist(modalMovie.id)}
              onToggleSeen={() => toggleSeen(modalMovie.id)}
              gavinReview={gavinReview}
              onSetGavinRating={(rating) =>
                setGavinRating(modalMovie.id, rating)
              }
              onSetGavinText={(text) => setGavinText(modalMovie.id, text)}
              movieReviewKey={movieReviewKey}
              onQuickSearch={handleQuickSearch}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
