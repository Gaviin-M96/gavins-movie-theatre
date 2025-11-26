// src/components/BottomNav.jsx

function BottomNav({ view, onChangeView }) {
  return (
    <nav className="bottom-nav" aria-label="View switcher">
      <button
        type="button"
        className={
          "bottom-nav-item" +
          (view === "all" ? " bottom-nav-item--active" : "")
        }
        onClick={() => onChangeView("all")}
      >
        <span className="bottom-nav-item-icon" aria-hidden="true">🎞️</span>
        <span className="bottom-nav-item-label">Collection</span>
      </button>

      <button
        type="button"
        className={
          "bottom-nav-item" +
          (view === "favorites" ? " bottom-nav-item--active" : "")
        }
        onClick={() => onChangeView("favorites")}
      >
        <span className="bottom-nav-item-icon" aria-hidden="true">⭐</span>
        <span className="bottom-nav-item-label">Favourites</span>
      </button>

      <button
        type="button"
        className={
          "bottom-nav-item" +
          (view === "watchlist" ? " bottom-nav-item--active" : "")
        }
        onClick={() => onChangeView("watchlist")}
      >
        <span className="bottom-nav-item-icon" aria-hidden="true">👁️</span>
        <span className="bottom-nav-item-label">Watchlist</span>
      </button>
    </nav>
  );
}

export default BottomNav;
