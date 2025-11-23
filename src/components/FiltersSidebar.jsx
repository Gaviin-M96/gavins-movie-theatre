// src/components/FiltersSidebar.jsx
function FiltersSidebar({
  search,
  sortBy,
  formatFilter,
  genreFilter,
  formats,
  genres,
  visibleFormats,
  visibleGenres,
  showAllFormats,
  showAllGenres,
  onSearchChange,
  onSortChange,
  onFormatFilterChange,
  onGenreFilterChange,
  onClearFilters,
  onRandom,
  onToggleShowAllFormats,
  onToggleShowAllGenres,
  currentCount,
  totalCount,
}) {
  const handleSearchChange = (e) => onSearchChange(e.target.value);
  const handleSortChange = (e) => onSortChange(e.target.value);
  const handleFormatClick = (fmt) => onFormatFilterChange(fmt);
  const handleGenreClick = (g) => onGenreFilterChange(g);

  // Show "More / Less" button whenever there *can* be extra genres
  const hasMoreGenres =
    genres.length > visibleGenres.length || showAllGenres;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Filters &amp; Tools</h2>
        <button
          type="button"
          className="sidebar-reset-link"
          onClick={onClearFilters}
        >
          Reset
        </button>
      </div>

      <p className="sidebar-summary">
        {currentCount === totalCount
          ? `Browsing all ${totalCount} movies.`
          : `Showing ${currentCount} of ${totalCount} movies.`}
      </p>

      <div className="sidebar-row">
        <div className="sidebar-field">
          <label className="sidebar-label" htmlFor="search">
            Search
          </label>
          <input
            id="search"
            className="sidebar-input"
            type="search"
            placeholder="Title, genre, or year…"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="sidebar-field">
          <label className="sidebar-label" htmlFor="sortBy">
            Sort
          </label>
          <select
            id="sortBy"
            className="sidebar-select"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
            <option value="year-desc">Year (Newest)</option>
            <option value="year-asc">Year (Oldest)</option>
            <option value="gavin-desc">Gavin Score (High)</option>
            <option value="gavin-asc">Gavin Score (Low)</option>
            <option value="tmdb-desc">TMDB Rating (High)</option>
            <option value="tmdb-asc">TMDB Rating (Low)</option>
          </select>
        </div>
      </div>

      <button type="button" className="btn-primary" onClick={onRandom}>
        🎲 Pick a Random Movie
      </button>

      {/* Formats */}
      <div className="chip-row chip-row--stacked">
        <span className="chip-row-label">Formats</span>
        <div className="chip-row-inner">
          {visibleFormats.map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={
                "chip" + (formatFilter === fmt ? " chip--active" : "")
              }
              onClick={() => handleFormatClick(fmt)}
            >
              {fmt === "all"
                ? "All Formats"
                : fmt === "Blu-ray"
                ? "Blu-Ray"
                : fmt}
            </button>
          ))}
          {formats.length > visibleFormats.length && (
            <button
              type="button"
              className="chip chip--more"
              onClick={onToggleShowAllFormats}
            >
              {showAllFormats ? "Show fewer" : "Show all"}
            </button>
          )}
          {formatFilter !== "all" && (
            <button
              type="button"
              className="chip chip--clear"
              onClick={() => onFormatFilterChange("all")}
            >
              Clear format
            </button>
          )}
        </div>
      </div>

      {/* Genres */}
      <div className="chip-row chip-row--stacked">
        <span className="chip-row-label">Genres</span>
        <div className="chip-row-inner">
          {visibleGenres.map((g) => (
            <button
              key={g}
              type="button"
              className={"chip" + (genreFilter === g ? " chip--active" : "")}
              onClick={() => handleGenreClick(g)}
            >
              {g === "all" ? "All Genres" : g}
            </button>
          ))}
          {hasMoreGenres && (
            <button
              type="button"
              className="chip chip--more"
              onClick={onToggleShowAllGenres}
            >
              {showAllGenres ? "Less" : "More"}
            </button>
          )}
          {genreFilter !== "all" && (
            <button
              type="button"
              className="chip chip--clear"
              onClick={() => onGenreFilterChange("all")}
            >
              Clear genre
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default FiltersSidebar;
