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
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        {/* Compact header row */}
        <div className="sidebar-header">
          <h2 className="sidebar-title">Filters &amp; Tools</h2>
          <span className="sidebar-count">
            {currentCount} / {totalCount}
          </span>
        </div>

        {/* SEARCH */}
        <div className="sidebar-block">
          <label className="sidebar-label" htmlFor="search">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything..."
            className="sidebar-input"
          />
        </div>

        {/* SORT */}
        <div className="sidebar-block">
          <label className="sidebar-label" htmlFor="sortBy">
            Sort by
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="sidebar-select"
          >
            <option value="title-asc">Title (A–Z)</option>
            <option value="title-desc">Title (Z–A)</option>
            <option value="year-desc">Year (newest first)</option>
            <option value="year-asc">Year (oldest first)</option>
            <option value="tmdb-desc">Rating (high–low)</option>
            <option value="tmdb-asc">Rating (low–high)</option>
          </select>
        </div>

        {/* FORMAT */}
        <div className="sidebar-block">
          <div className="sidebar-label-row">
            <span className="sidebar-label">Format</span>
            {formats.length > 9 && (
              <button
                type="button"
                className="link-button"
                onClick={onToggleShowAllFormats}
              >
                {showAllFormats ? "Show less" : "Show all"}
              </button>
            )}
          </div>
          <div className="chip-row">
            {visibleFormats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={
                  "chip" + (formatFilter === fmt ? " chip--active" : "")
                }
                onClick={() => onFormatFilterChange(fmt)}
              >
                {fmt === "all" ? "All Formats" : fmt}
              </button>
            ))}
          </div>
        </div>

        {/* GENRE */}
<div className="sidebar-block">
  <span className="sidebar-label">Genre</span>

  <div className="chip-row">
    {visibleGenres.map((genre) => (
      <button
        key={genre}
        type="button"
        className={`chip${genreFilter === genre ? " chip--active" : ""}`}
        onClick={() => onGenreFilterChange(genre)}
      >
        {genre === "all" ? "All Genres" : genre}
      </button>
    ))}

    {/* More / Less toggle pill – always shown */}
    {genres.length > 1 && (
      <button
        type="button"
        className={`chip chip--toggle${
          showAllGenres ? " chip--toggle-active" : ""
        }`}
        onClick={onToggleShowAllGenres}
      >
        {showAllGenres ? "Less" : "More"}
      </button>
    )}
  </div>
</div>

        {/* ACTIONS */}
        <div className="sidebar-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onRandom}
          >
            🎲 Random Movie
          </button>
        </div>
      </div>
    </aside>
  );
}

export default FiltersSidebar;
