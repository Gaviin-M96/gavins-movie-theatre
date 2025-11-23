// src/components/BottomNav.jsx
const TABS = [
  { id: "all", label: "All", icon: "🎞️" },
  { id: "favorites", label: "Faves", icon: "⭐" },
  { id: "watchlist", label: "List", icon: "📽️" },
  { id: "top", label: "Top", icon: "🏆" },
];

function BottomNav({ view, onChangeView }) {
  return (
    <nav className="bottom-nav" aria-label="Views">
      <div className="bottom-nav-inner">
        {TABS.map((tab) => {
          const active = view === tab.id;
          const itemClass =
            "bottom-nav-item" + (active ? " bottom-nav-item--active" : "");
          return (
            <button
              key={tab.id}
              type="button"
              className={itemClass}
              onClick={() => onChangeView(tab.id)}
            >
              <span className="bottom-nav-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
