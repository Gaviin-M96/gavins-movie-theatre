function Header({
  currentCount,
  totalCount,
  totalSeen,
  totalFavorites,
  totalWatchlist,
  view,
  onChangeView,
}) {
  return (
    <header className="app-header">
      <div>
        <h1>Gavin&apos;s Movie Theatre</h1>
        <p>
          {currentCount} of {totalCount} discs showing
        </p>
        <p className="app-header-subline">
          {totalSeen} seen • {totalFavorites} favourites •{" "}
          {totalWatchlist} in watchlist
        </p>
      </div>

      <div className="view-tabs">
        <button
          className={`view-tab ${view === "all" ? "view-tab--active" : ""}`}
          onClick={() => onChangeView("all")}
        >
          All
        </button>
        <button
          className={`view-tab ${
            view === "favorites" ? "view-tab--active" : ""
          }`}
          onClick={() => onChangeView("favorites")}
        >
          ⭐ Favourites
        </button>
        <button
          className={`view-tab ${
            view === "watchlist" ? "view-tab--active" : ""
          }`}
          onClick={() => onChangeView("watchlist")}
        >
          📺 Watchlist
        </button>
        <button
          className={`view-tab ${view === "seen" ? "view-tab--active" : ""}`}
          onClick={() => onChangeView("seen")}
        >
          👁 Seen
        </button>
        <button
          className={`view-tab ${view === "top" ? "view-tab--active" : ""}`}
          onClick={() => onChangeView("top")}
        >
          🏆 Top Rated
        </button>
      </div>
    </header>
  );
}

export default Header;
