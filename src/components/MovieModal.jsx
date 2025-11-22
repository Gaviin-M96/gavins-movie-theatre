{trailerKey && showTrailer && (
  <div className="trailer-overlay" onClick={handleCloseTrailer}>
    <div
      className="trailer-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="trailer-close" onClick={handleCloseTrailer}>
        ✕
      </button>
      <div className="trailer-embed">
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
          title={`${movie.title} trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  </div>
)}
