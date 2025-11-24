// src/components/BottomNav.jsx
function BottomNav({ view, onChangeView }) {
  const makeClass = (key) =>
    "bottom-nav-item" + (view === key ? " bottom-nav-item--active" : "");

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <button
          type="button"
          className={makeClass("all")}
          onClick={() => onChangeView("all")}
        >
          <span className="bottom-nav-icon">🎞️</span>
          <span className="bottom-nav-label">Collection</span>
        </button>

        <button
          type="button"
          className={makeClass("favorites")}
          onClick={() => onChangeView("favorites")}
        >
          <span className="bottom-nav-icon">⭐</span>
          <span className="bottom-nav-label">Favourites</span>
        </button>

        <button
          type="button"
          className={makeClass("watchlist")}
          onClick={() => onChangeView("watchlist")}
        >
          <span className="bottom-nav-icon">📽️</span>
          <span className="bottom-nav-label">Watchlist</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
