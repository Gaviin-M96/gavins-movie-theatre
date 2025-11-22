function BottomNav({ view, onChangeView }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button
          className={`bottom-nav-item ${
            view === "all" ? "bottom-nav-item--active" : ""
          }`}
          onClick={() => onChangeView("all")}
        >
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">All</span>
        </button>

        <button
          className={`bottom-nav-item ${
            view === "favorites" ? "bottom-nav-item--active" : ""
          }`}
          onClick={() => onChangeView("favorites")}
        >
          <span className="bottom-nav-icon">⭐</span>
          <span className="bottom-nav-label">Favourites</span>
        </button>

        <button
          className={`bottom-nav-item ${
            view === "watchlist" ? "bottom-nav-item--active" : ""
          }`}
          onClick={() => onChangeView("watchlist")}
        >
          <span className="bottom-nav-icon">📺</span>
          <span className="bottom-nav-label">Watchlist</span>
        </button>

        <button
          className={`bottom-nav-item ${
            view === "top" ? "bottom-nav-item--active" : ""
          }`}
          onClick={() => onChangeView("top")}
        >
          <span className="bottom-nav-icon">🏆</span>
          <span className="bottom-nav-label">Top Rated</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
