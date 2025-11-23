// src/components/Header.jsx
function Header({
  currentCount,
  totalCount,
  totalFavorites,
  totalWatchlist,
  isLoadingDetails = false,
}) {
  const hasFilters = currentCount !== totalCount;

  return (
    <header className="app-header">
      <div>
        <h1>Gavin&apos;s Movie Theatre</h1>
        <p>
          Your personal Blu-Ray vault, curated with love and way too many
          special features.
        </p>
        <p className="app-header-subline">
          {currentCount === totalCount
            ? `Showing all ${totalCount} titles`
            : `Showing ${currentCount} of ${totalCount} titles`}
          {hasFilters && " · Filters active"}
        </p>
      </div>

      <div className="header-stats">
        <div className="header-stat">
          <div className="header-stat-label">Collection</div>
          <div className="header-stat-value">{totalCount}</div>
        </div>
        <div className="header-stat">
          <div className="header-stat-label">Favourites</div>
          <div className="header-stat-value">{totalFavorites}</div>
        </div>
        <div className="header-stat">
          <div className="header-stat-label">Watchlist</div>
          <div className="header-stat-value">{totalWatchlist}</div>
        </div>
        {isLoadingDetails && (
          <div className="header-stat header-stat--subtle">
            <div className="header-stat-label">TMDB</div>
            <div className="header-stat-value header-stat-value--small">
              Updating…
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
