function Header({ currentCount, totalCount, totalFavorites, totalWatchlist }) {
  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">GAVIN&apos;S MOVIE THEATRE</h1>
        <p className="app-header-mainline">
          Collection: {totalCount} movies • Showing {currentCount}
        </p>
        <p className="app-header-subline">
          {totalFavorites} favourites • {totalWatchlist} in watchlist
        </p>
      </div>
    </header>
  );
}

export default Header;
