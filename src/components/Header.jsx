// src/components/Header.jsx
function Header({
  currentCount,      // still passed in but unused for now
  totalCount,        // still passed in but unused
  totalFavorites,    // still passed in but unused
  totalWatchlist,    // still passed in but unused
  isLoadingDetails,  // still passed in but unused here
}) {
  return (
    <header className="app-header">
      <div>
        <h1>Gavin&apos;s Movie Theatre</h1>
        <p>
          My personal movie vault, curated with love and way too many
          special features.
        </p>
        {/* Subline with counts intentionally removed as requested */}
      </div>
      {/* Header stat blocks (Collection / Favourites / Watchlist / TMDB) removed */}
    </header>
  );
}

export default Header;
