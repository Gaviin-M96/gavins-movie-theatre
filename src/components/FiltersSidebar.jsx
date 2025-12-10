// src/components/FiltersSidebar.jsx
import SidebarDropdown from "./SidebarDropdown";

function FiltersSidebar({
  search,
  sortBy,
  formatFilter,
  genreFilter,
  categoryFilter,
  formats,
  genres,
  categories,
  visibleFormats,
  visibleGenres,
  showAllFormats,
  showAllGenres,
  onSearchChange,
  onSortChange,
  onFormatFilterChange,
  onGenreFilterChange,
  onCategoryFilterChange,
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
          <h2 className="sidebar-title">Movie Finder</h2>
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
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anything..."
            className="sidebar-input"
            autoComplete="off"
          />
        </div>

        {/* SORT */}
        <SidebarDropdown
          label="Sort by"
          value={sortBy}
          onChange={onSortChange}
          options={[
            { value: "title-asc", label: "Title (A–Z)" },
            { value: "title-desc", label: "Title (Z–A)" },
            { value: "year-desc", label: "Year (newest first)" },
            { value: "year-asc", label: "Year (oldest first)" },
            { value: "tmdb-desc", label: "Rating (high–low)" },
            { value: "tmdb-asc", label: "Rating (low–high)" },
          ]}
        />

        {/* CATEGORY / TYPE */}
        <div className="sidebar-block">
          <span className="sidebar-label">Type</span>

          <div className="chip-row">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`chip${
                  categoryFilter === cat ? " chip--active" : ""
                }`}
                onClick={() => onCategoryFilterChange(cat)}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
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
                {fmt === "all" ? "All" : fmt}
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
                className={`chip${
                  genreFilter === genre ? " chip--active" : ""
                }`}
                onClick={() => onGenreFilterChange(genre)}
              >
                {genre === "all" ? "All" : genre}
              </button>
            ))}

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
            Clear Filters
          </button>
          <button type="button" className="btn-primary" onClick={onRandom}>
            🎲 Random Movie
          </button>
        </div>
      </div>
    </aside>
  );
}

export default FiltersSidebar;
