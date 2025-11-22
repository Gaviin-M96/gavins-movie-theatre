function Header({
  currentCount,
  totalCount,
  totalFavorites,
  totalWatchlist,
}) {
  return (
    <header className="app-header">
      <div>
        <h1>Gavin&apos;s Movie Theatre</h1>
        <p>
          {currentCount} of {totalCount} discs showing
        </p>
        <p className="app-header-subline">
          {totalFavorites} favourites • {totalWatchlist} in watchlist
        </p>
      </div>
    </header>
  );
}

export default Header;
