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
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Filters</h3>
        <button
          type="button"
          className="sidebar-reset-link"
          onClick={onClearFilters}
        >
          Reset
        </button>
      </div>

      <label className="sidebar-label">Search</label>
      <input
        className="sidebar-input"
        type="text"
        placeholder="Title, genre, year…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <label className="sidebar-label">Sort By</label>
      <select
        className="sidebar-select"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
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

      <button className="btn-primary" onClick={onRandom}>
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
                onClick={() => onFormatFilterChange(format)}
              >
                {label}
              </button>
            );
          })}

          {formats.length > visibleFormats.length && (
            <button
              type="button"
              className="chip chip--more"
              onClick={onToggleShowAllFormats}
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
                onClick={() => onGenreFilterChange(genre)}
              >
                {label}
              </button>
            );
          })}

          {genres.length > visibleGenres.length && (
            <button
              type="button"
              className="chip chip--more"
              onClick={onToggleShowAllGenres}
            >
              {showAllGenres ? "Less" : "More…"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default FiltersSidebar;
