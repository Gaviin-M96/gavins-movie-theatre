const NAV_ITEMS = [
  { id: "all", label: "All", icon: "🏠" },
  { id: "favorites", label: "Favourites", icon: "⭐" },
  { id: "watchlist", label: "Watching", icon: "▶️" },
  { id: "top", label: "Top Rated", icon: "🏆" },
];

function BottomNav({ view, onChangeView }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav-item ${
              view === id ? "bottom-nav-item--active" : ""
            }`}
            onClick={() => onChangeView(id)}
          >
            <span className="bottom-nav-icon" aria-hidden="true">
              {icon}
            </span>
            <span className="bottom-nav-label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
