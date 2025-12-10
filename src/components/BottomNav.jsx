// src/components/BottomNav.jsx
import {
  AiOutlineAppstore,
  AiOutlineStar,
  AiFillStar,
  AiOutlineEye,
  AiFillEye,
} from "react-icons/ai";

function BottomNav({ view, onChangeView }) {
  return (
    <nav className="bottom-nav">
      {/* ALL MOVIES */}
      <button
        type="button"
        className={
          "bottom-nav-item" +
          (view === "all" ? " bottom-nav-item--active" : "")
        }
        onClick={() => onChangeView("all")}
      >
        <span className="bottom-nav-item-icon">
          <AiOutlineAppstore />
        </span>
        <span className="bottom-nav-item-label">All</span>
      </button>

      {/* FAVOURITES */}
      <button
        type="button"
        className={
          "bottom-nav-item" +
          (view === "favorites" ? " bottom-nav-item--active" : "")
        }
        onClick={() => onChangeView("favorites")}
      >
        <span className="bottom-nav-item-icon">
          {view === "favorites" ? <AiFillStar /> : <AiOutlineStar />}
        </span>
        <span className="bottom-nav-item-label">Favourites</span>
      </button>

      {/* WATCHLIST */}
      <button
        type="button"
        className={
          "bottom-nav-item" +
          (view === "watchlist" ? " bottom-nav-item--active" : "")
        }
        onClick={() => onChangeView("watchlist")}
      >
        <span className="bottom-nav-item-icon">
          {view === "watchlist" ? <AiFillEye /> : <AiOutlineEye />}
        </span>
        <span className="bottom-nav-item-label">Watchlist</span>
      </button>
    </nav>
  );
}

export default BottomNav;
