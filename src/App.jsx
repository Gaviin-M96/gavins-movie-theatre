// src/App.jsx
import { useState, useMemo, useEffect } from "react";
import { movies } from "./movies_updated.js";
import { fetchDetailsForMovie } from "./api/tmdb";
import FiltersSidebar from "./components/FiltersSidebar";
import MovieGrid from "./components/MovieGrid";
import MovieModal from "./components/MovieModal";
import BottomNav from "./components/BottomNav";
import AuthPanel from "./components/AuthPanel";
import { supabase } from "./api/supabaseClient";

import {
  AiOutlineAppstore,
  AiOutlineStar,
  AiFillStar,
  AiOutlineEye,
  AiFillEye,
} from "react-icons/ai";

// NEW: import the logo so Vite bundles it correctly
import reelRoomLogo from "./assets/reel-room.jpeg";

const FILTERS_STORAGE_KEY = "gmtFilters";
const FAVORITES_STORAGE_KEY = "gmtFavorites";
const WATCHLIST_STORAGE_KEY = "gmtWatchlist";
const GAVIN_REVIEWS_KEY = "gmtGavinReviews";

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

function getSortTitle(str) {
  if (!str) return "";
  return str.replace(/^\s*(the|a|an)\s+/i, "").trim();
}

// Static superset of known genres (canonical + extended)
const GENRE_FILTERS_ALL = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Independent",
  "Music",
  "Musical",
  "Mystery",
  "Noir",
  "Romance",
  "Science Fiction",
  "Sport",
  "Superhero",
  "Thriller",
  "War",
  "Western",
];

// Content "type" / category (separate from genre)
const CATEGORY_TYPES = [
  "Movie",
  "TV Show",
  "Stand-Up",
  "Concert",
  "Short Film",
  "Mini-Series",
  "Documentary",
  "Sports",
];

function App() {
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title-asc");
  const [favorites, setFavorites] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [modalMovieId, setModalMovieId] = useState(null);
  const [view, setView] = useState("all"); // all | favorites | watchlist
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [gavinReviews, setGavinReviews] = useState({});

  // NEW: auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    document.title = "Gavin's Movie Theatre";
  }, []);

  // Load auth session
  useEffect(() => {
    const initAuth = async () => {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error);
      }
      setUser(data?.user ?? null);
      setAuthLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load saved state
  useEffect(() => {
    try {
      const rawFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (rawFilters) {
        const parsed = JSON.parse(rawFilters);
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.formatFilter) setFormatFilter(parsed.formatFilter);
        if (parsed.genreFilter) setGenreFilter(parsed.genreFilter);
        if (parsed.categoryFilter) setCategoryFilter(parsed.categoryFilter);
        if (parsed.sortBy) setSortBy(parsed.sortBy);

        if (parsed.view) {
          const allowedViews = new Set(["all", "favorites", "watchlist"]);
          setView(allowedViews.has(parsed.view) ? parsed.view : "all");
        }
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
  }, []);

  // Save state
  useEffect(() => {
    try {
      localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({
          search,
          formatFilter,
          genreFilter,
          categoryFilter,
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
    categoryFilter,
    sortBy,
    view,
    favorites,
    watchlist,
    gavinReviews,
  ]);

  // Modal ESC / body scroll lock
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

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

  // Formats now come from movie.library.format
  const formats = useMemo(
    () => [
      "all",
      ...new Set(movies.map((m) => m.library?.format || "Unknown")),
    ],
    []
  );

  // Collect which genres actually appear in the dataset,
  // skipping "TV Movie" entirely.
  const genreUsageSet = useMemo(() => {
    const s = new Set();

    for (const m of movies) {
      const arr = Array.isArray(m.metadata?.genres)
        ? m.metadata.genres
        : [];

      for (const g of arr) {
        if (!g || typeof g !== "string") continue;
        if (g.toLowerCase() === "tv movie") continue; // ignore this one
        s.add(g);
      }
    }

    return s;
  }, []);

  // Final genre list for the sidebar
  const genres = useMemo(() => {
    const used = Array.from(genreUsageSet);
    const canonical = GENRE_FILTERS_ALL.filter((g) => genreUsageSet.has(g));
    const extras = used
      .filter((g) => !GENRE_FILTERS_ALL.includes(g))
      .sort((a, b) => a.localeCompare(b));

    return ["all", ...canonical, ...extras];
  }, [genreUsageSet]);

  // Categories based on metadata.category (default "Movie")
  const categories = useMemo(() => {
    const usedSet = new Set();

    for (const m of movies) {
      let cat = m.metadata?.category ?? "Movie";
      if (typeof cat === "string") {
        cat = cat.trim();
        if (cat.length) usedSet.add(cat);
      }
    }

    const canonical = CATEGORY_TYPES.filter((c) => usedSet.has(c));
    const extras = Array.from(usedSet)
      .filter((c) => !CATEGORY_TYPES.includes(c))
      .sort((a, b) => a.localeCompare(b));

    return ["all", ...canonical, ...extras];
  }, [movies]);

  const MAX_VISIBLE_CHIPS = 8;
  const visibleFormats = showAllFormats
    ? formats
    : formats.slice(0, MAX_VISIBLE_CHIPS);
  const visibleGenres = showAllGenres
    ? genres
    : genres.slice(0, MAX_VISIBLE_CHIPS);

  // Base list by view
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
    const normalizedSearch = search.trim().toLowerCase();

    let result = baseMovies.filter((movie) => {
      const genresArr = Array.isArray(movie.metadata?.genres)
        ? movie.metadata.genres
        : [];

      // ----- SEARCH MATCHING -----
      let matchesSearch = true;

      if (normalizedSearch) {
        const year = movie.year || null;
        const yearStr = year ? String(year) : "";

        const haystackParts = [
          movie.title,
          movie.library?.format,
          yearStr,
          ...genresArr,
        ].filter(Boolean);

        const haystack = haystackParts.join(" ").toLowerCase();

        matchesSearch = haystack.includes(normalizedSearch);
      }

      // ----- FORMAT & GENRE FILTERS -----
      const matchesFormat =
        formatFilter === "all"
          ? true
          : (movie.library?.format || "Unknown") === formatFilter;

      const matchesGenre =
        genreFilter === "all" ? true : genresArr.includes(genreFilter);

      // ----- CATEGORY FILTER -----
      const category = movie.metadata?.category || "Movie";
      const matchesCategory =
        categoryFilter === "all" ? true : category === categoryFilter;

      return matchesSearch && matchesFormat && matchesGenre && matchesCategory;
    });

    result.sort((a, b) => {
      const ya = a.year || 0;
      const yb = b.year || 0;

      const ga = gavinReviews[a.id]?.rating ?? 0;
      const gb = gavinReviews[b.id]?.rating ?? 0;

      const ra =
        (a.ratings?.score ?? null) ??
        (a.ratings?.tmdb?.voteAverage ?? 0);

      const rb =
        (b.ratings?.score ?? null) ??
        (b.ratings?.tmdb?.voteAverage ?? 0);

      const titleA = getSortTitle(a.title);
      const titleB = getSortTitle(b.title);

      switch (sortBy) {
        case "title-asc":
          return titleA.localeCompare(titleB);
        case "title-desc":
          return titleB.localeCompare(titleA);
        case "year-desc":
          return yb - ya || titleA.localeCompare(titleB);
        case "year-asc":
          return ya - yb || titleA.localeCompare(titleB);
        case "gavin-desc":
          return gb - ga || titleA.localeCompare(titleB);
        case "gavin-asc":
          return ga - gb || titleA.localeCompare(titleB);
        case "tmdb-desc":
          return rb - ra || titleA.localeCompare(titleB);
        case "tmdb-asc":
          return ra - rb || titleA.localeCompare(titleB);
        default:
          return titleA.localeCompare(titleB);
      }
    });

    return result;
  }, [
    baseMovies,
    search,
    formatFilter,
    genreFilter,
    categoryFilter,
    sortBy,
    gavinReviews,
  ]);

  const clearFilters = () => {
    setSearch("");
    setFormatFilter("all");
    setGenreFilter("all");
    setCategoryFilter("all");
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

  const openModal = (id) => {
    setModalMovieId(id);
  };

  const closeModal = () => setModalMovieId(null);

  const handleRandom = () => {
    if (!filteredMovies.length) return;
    const random =
      filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    openModal(random.id);
  };

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

  const gavinReview =
    modalMovie && gavinReviews[modalMovie.id]
      ? gavinReviews[modalMovie.id]
      : { rating: 0, text: "" };

  const totalCount = movies.length;
  const currentCount = filteredMovies.length;

  const movieReviewKey =
    modalMovie?.metadata?.tmdbId != null
      ? String(modalMovie.metadata.tmdbId)
      : modalMovie
      ? String(modalMovie.id)
      : null;

  const activeFilters = [];
  if (search.trim()) activeFilters.push(`“${search.trim()}”`);
  if (formatFilter !== "all") {
    activeFilters.push(
      formatFilter === "Blu-ray" ? "Blu-ray format" : `${formatFilter} format`
    );
  }
  if (genreFilter !== "all") activeFilters.push(`${genreFilter} genre`);
  if (categoryFilter !== "all")
    activeFilters.push(`${categoryFilter} only`);
  if (view === "favorites") activeFilters.push("Favourites only");
  if (view === "watchlist") activeFilters.push("Watchlist only");

  const handleQuickSearch = (query) => {
    setSearch(query);
    setView("all");
    setModalMovieId(null);
  };

  return (
    <div className="app">
      <div className="layout">
        {/* LEFT RAIL */}
        <div className="left-rail">
          <div className="logo-bar">
            <img
              src={reelRoomLogo}
              alt="Reel Room by Gavin"
              className="header-logo"
            />
          </div>

          <div className="sidebar-column">
            {/* Compact auth pill + modal */}
            <AuthPanel user={user} loading={authLoading} />

            <FiltersSidebar
              search={search}
              sortBy={sortBy}
              formatFilter={formatFilter}
              genreFilter={genreFilter}
              categoryFilter={categoryFilter}
              formats={formats}
              genres={genres}
              categories={categories}
              visibleFormats={visibleFormats}
              visibleGenres={visibleGenres}
              showAllFormats={showAllFormats}
              showAllGenres={showAllGenres}
              onSearchChange={setSearch}
              onSortChange={setSortBy}
              onFormatFilterChange={setFormatFilter}
              onGenreFilterChange={setGenreFilter}
              onCategoryFilterChange={setCategoryFilter}
              onClearFilters={clearFilters}
              onRandom={handleRandom}
              onToggleShowAllFormats={() => setShowAllFormats((v) => !v)}
              onToggleShowAllGenres={() => setShowAllGenres((v) => !v)}
              currentCount={currentCount}
              totalCount={totalCount}
            />
          </div>
        </div>

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
                  Clear filters &amp; search
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
              favoriteSet={favoriteSet}
              watchlistSet={watchlistSet}
              onToggleFavorite={toggleFavorite}
              onToggleWatchlist={toggleWatchlist}
              onOpenModal={openModal}
            />
          )}
        </main>
      </div>

      <BottomNav view={view} onChangeView={setView} />

      {modalMovie && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ✕
            </button>
           <MovieModal
  movie={modalMovie}
  user={user}
  isFavorite={favoriteSet.has(modalMovie.id)}
  inWatchlist={watchlistSet.has(modalMovie.id)}
  onToggleFavorite={() => toggleFavorite(modalMovie.id)}
  onToggleWatchlist={() => toggleWatchlist(modalMovie.id)}
  gavinReview={gavinReview}
  onSetGavinRating={(rating) => setGavinRating(modalMovie.id, rating)}
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