// src/App.jsx
import { useState, useMemo, useEffect } from "react";
import { movies } from "./movies_updated.js";
import FiltersSidebar from "./components/FiltersSidebar";
import MovieGrid from "./components/MovieGrid";
import MovieModal from "./components/MovieModal";
import BottomNav from "./components/BottomNav";
import AuthPanel from "./components/AuthPanel";
import { supabase } from "./api/supabaseClient";

import reelRoomLogo from "./assets/reel-room.jpeg";

const isDev = import.meta.env.DEV;
const devEmail = import.meta.env.VITE_DEV_ADMIN_EMAIL;
const devPassword = import.meta.env.VITE_DEV_ADMIN_PASSWORD;

const FILTERS_STORAGE_KEY = "gmtFilters";
const FAVORITES_STORAGE_KEY = "gmtFavorites";
const WATCHLIST_STORAGE_KEY = "gmtWatchlist";
const GAVIN_REVIEWS_KEY = "gmtGavinReviews";

const MAX_VISIBLE_CHIPS = 8;

function getSortTitle(str) {
  if (!str) return "";
  return str.replace(/^\s*(the|a|an)\s+/i, "").trim();
}

const GENRE_FILTERS_ALL = [
  "Action","Adventure","Animation","Anime","Biography","Comedy","Crime",
  "Documentary","Drama","Family","Fantasy","History","Horror","Independent",
  "Music","Musical","Mystery","Noir","Romance","Science Fiction","Sport",
  "Superhero","Thriller","War","Western",
];

const CATEGORY_TYPES = [
  "Movie","TV Show","Stand-Up","Concert",
  "Short Film","Mini-Series","Documentary","Sports",
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
  const [view, setView] = useState("all");
  const [showAllFormats, setShowAllFormats] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [gavinReviews, setGavinReviews] = useState({});

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* -------------------- AUTH INIT -------------------- */

  useEffect(() => {
    let ignore = false;

    const initAuth = async () => {
      setAuthLoading(true);

      const { data } = await supabase.auth.getSession();
      if (!ignore && data?.session?.user) {
        setUser(data.session.user);
        setAuthLoading(false);
        return;
      }

      if (isDev && devEmail && devPassword) {
        const { data } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        });
        if (!ignore && data?.user) setUser(data.user);
        setAuthLoading(false);
        return;
      }

      if (!ignore) {
        setUser(null);
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!ignore) setUser(session?.user ?? null);
      }
    );

    return () => {
      ignore = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* -------------------- LOAD STATE -------------------- */

  useEffect(() => {
    try {
      const rawFilters = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (rawFilters) {
        const parsed = JSON.parse(rawFilters);
        setSearch(parsed.search || "");
        setFormatFilter(parsed.formatFilter || "all");
        setGenreFilter(parsed.genreFilter || "all");
        setCategoryFilter(parsed.categoryFilter || "all");
        setSortBy(parsed.sortBy || "title-asc");
        setView(parsed.view || "all");
      }

      const rawFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (rawFavs) setFavorites(JSON.parse(rawFavs));

      const rawWatch = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (rawWatch) setWatchlist(JSON.parse(rawWatch));

      const rawGavin = localStorage.getItem(GAVIN_REVIEWS_KEY);
      if (rawGavin) setGavinReviews(JSON.parse(rawGavin));
    } catch {}
  }, []);

  /* -------------------- SAVE STATE -------------------- */

  useEffect(() => {
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

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const watchlistSet = useMemo(() => new Set(watchlist), [watchlist]);

  const formats = useMemo(
    () => ["all", ...new Set(
      movies.flatMap((m) =>
        Array.isArray(m.library?.format)
          ? m.library.format
          : m.library?.format
            ? [m.library.format]
            : []
      )
    )],
    []
  );

  const genreUsageSet = useMemo(() => {
    const s = new Set();
    for (const m of movies) {
      const arr = Array.isArray(m.metadata?.genres)
        ? m.metadata.genres
        : [];
      for (const g of arr) {
        if (!g || typeof g !== "string") continue;
        if (g.toLowerCase() === "tv movie") continue;
        s.add(g);
      }
    }
    return s;
  }, []);

  const genres = useMemo(() => {
    const used = Array.from(genreUsageSet);
    const canonical = GENRE_FILTERS_ALL.filter((g) => genreUsageSet.has(g));
    const extras = used
      .filter((g) => !GENRE_FILTERS_ALL.includes(g))
      .sort((a, b) => a.localeCompare(b));
    return ["all", ...canonical, ...extras];
  }, [genreUsageSet]);

  const categories = useMemo(() => {
    const usedSet = new Set();
    for (const m of movies) {
      let cat = m.metadata?.category ?? "Movie";
      if (typeof cat === "string" && cat.trim()) usedSet.add(cat.trim());
    }

    const canonical = CATEGORY_TYPES.filter((c) => usedSet.has(c));
    const extras = Array.from(usedSet)
      .filter((c) => !CATEGORY_TYPES.includes(c))
      .sort((a, b) => a.localeCompare(b));

    return ["all", ...canonical, ...extras];
  }, []);

  const visibleFormats = showAllFormats
    ? formats
    : formats.slice(0, MAX_VISIBLE_CHIPS);

  const visibleGenres = showAllGenres
    ? genres
    : genres.slice(0, MAX_VISIBLE_CHIPS);

  const baseMovies = useMemo(() => {
    if (view === "favorites") return movies.filter((m) => favoriteSet.has(m.id));
    if (view === "watchlist") return movies.filter((m) => watchlistSet.has(m.id));
    return movies;
  }, [view, favoriteSet, watchlistSet]);

  const filteredMovies = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let result = baseMovies.filter((movie) => {
      const genresArr = Array.isArray(movie.metadata?.genres)
        ? movie.metadata.genres
        : [];

      let matchesSearch = true;
      if (normalizedSearch) {
        const yearStr = movie.year ? String(movie.year) : "";
        const haystack = [
          movie.title,
          ...(Array.isArray(movie.library?.format)
            ? movie.library.format
            : movie.library?.format
              ? [movie.library.format]
              : []
          ),
          yearStr,
          ...genresArr,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        matchesSearch = haystack.includes(normalizedSearch);
      }

      /* -------------------------
      ✅ FIXED FORMAT FILTER LOGIC
      ------------------------- */
      const movieFormats = Array.isArray(movie.library?.format)
        ? movie.library.format
        : movie.library?.format
          ? [movie.library.format]
          : [];

      const matchesFormat =
        formatFilter === "all"
          ? true
          : movieFormats.includes(formatFilter);

      const matchesGenre =
        genreFilter === "all" ? true : genresArr.includes(genreFilter);

      const category = movie.metadata?.category || "Movie";
      const matchesCategory =
        categoryFilter === "all" ? true : category === categoryFilter;

      return matchesSearch && matchesFormat && matchesGenre && matchesCategory;
    });

    result.sort((a, b) => {
      const ya = a.year || 0;
      const yb = b.year || 0;

      const ra =
        (a.ratings?.score ?? null) ??
        (a.ratings?.tmdb?.voteAverage ?? 0);

      const rb =
        (b.ratings?.score ?? null) ??
        (b.ratings?.tmdb?.voteAverage ?? 0);

      const titleA = getSortTitle(a.title);
      const titleB = getSortTitle(b.title);

      switch (sortBy) {
        case "title-asc": return titleA.localeCompare(titleB);
        case "title-desc": return titleB.localeCompare(titleA);
        case "year-desc": return yb - ya || titleA.localeCompare(titleB);
        case "year-asc": return ya - yb || titleA.localeCompare(titleB);
        case "tmdb-desc": return rb - ra || titleA.localeCompare(titleB);
        case "tmdb-asc": return ra - rb || titleA.localeCompare(titleB);
        default: return titleA.localeCompare(titleB);
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
  ]);

  const totalCount = movies.length;
  const currentCount = filteredMovies.length;

  const handleRandom = () => {
    if (!filteredMovies.length) return;
    const random =
      filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    setModalMovieId(random.id);
  };

  const modalMovie =
    modalMovieId != null ? movies.find((m) => m.id === modalMovieId) : null;

  const movieReviewKey =
    modalMovie?.metadata?.tmdbId != null
      ? String(modalMovie.metadata.tmdbId)
      : modalMovie
      ? String(modalMovie.id)
      : null;

  return (
    <div className="app">
      <div className="layout">
        <div className="left-rail">
          <div className="logo-bar">
            <img src={reelRoomLogo} alt="Reel Room by Gavin" className="header-logo" />
          </div>

          <div className="sidebar-column">
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
              onClearFilters={() => {
                setSearch("");
                setFormatFilter("all");
                setGenreFilter("all");
                setCategoryFilter("all");
                setSortBy("title-asc");
              }}
              onRandom={handleRandom}
              onToggleShowAllFormats={() => setShowAllFormats((v) => !v)}
              onToggleShowAllGenres={() => setShowAllGenres((v) => !v)}
              currentCount={currentCount}
              totalCount={totalCount}
            />
          </div>
        </div>

        <main className="content">
          <MovieGrid
            movies={filteredMovies}
            favoriteSet={favoriteSet}
            watchlistSet={watchlistSet}
            onToggleFavorite={(id) =>
              setFavorites((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onToggleWatchlist={(id) =>
              setWatchlist((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onOpenModal={setModalMovieId}
          />
        </main>
      </div>

      <BottomNav view={view} onChangeView={setView} />

      {modalMovie && (
        <div className="modal-backdrop" onClick={() => setModalMovieId(null)}>
          <div
            className="modal modal--single-column"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setModalMovieId(null)}>
              ✕
            </button>
            <MovieModal
  movie={modalMovie}
  user={user}
  movieReviewKey={movieReviewKey}

  onSelectGenre={(g) => {
    setGenreFilter(g);
    setModalMovieId(null);   // close modal automatically
  }}

  onSelectYear={(y) => {
    setSearch(String(y));    // or create a dedicated year filter if you want later
    setModalMovieId(null);
  }}
/>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
