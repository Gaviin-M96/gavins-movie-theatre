🎬 Gavin’s Movie Theatre

A modern, personal Blu-Ray movie library built with React + Vite, featuring detailed metadata from TMDB, personal ratings, community reviews powered by Supabase, watchlist management, favouriting, fuzzy search, filters, and a premium modal movie viewer with trailer autoplay.

Live Site: https://movies.gavinmoore.ca

🚀 Features
🎞 Movie Library

Displays my entire Blu-Ray movie collection

Clean card-based layout with posters, metadata, and rating badges

🔍 Smart Search & Filters

Fuzzy search for titles, genres, actors, directors

Filter by:

Format (Blu-Ray, etc.)

Genre

Sort by title, year, TMDB rating, or Gavin’s rating

⭐ Personal Ratings

Give each movie a 1–5 star rating

Write personal notes

Ratings are saved locally with localStorage

📝 Community Reviews (Supabase)

Public comments & ratings from other users

Each movie has its own thread

Lightweight and fast

📺 Trailer Popup

Autoplay YouTube trailer inside a custom modal popup

Not a new tab — modern, smooth experience

Blurred background & high-end UI styling

📱 Mobile-Optimized

Fully responsive layout

Sticky bottom navigation bar like Instagram

Bigger touch targets

Extra padding on modals

🧰 Tech Stack

React 19

Vite 7

Supabase (community reviews)

TMDB API (metadata, trailers, posters)

gh-pages (GitHub Pages deployment)

CSS (custom dark UI, glassmorphism modal)

📂 Project Structure
src/
  api/
    tmdb.js              -> TMDB fetch helpers
  components/
    Header.jsx
    FiltersSidebar.jsx
    MovieGrid.jsx
    MovieCard.jsx
    MovieModal.jsx
    BottomNav.jsx
    MovieReviews.jsx
  data/
    movies.js
  App.jsx
  main.jsx
index.css
vite.config.js
README.md

🔧 Local Development
Install dependencies:
npm install

Run the development server:
npm run dev


The app will be available at:

http://localhost:5173/

🌐 Deployment (GitHub Pages)

The project uses gh-pages to deploy the dist/ folder to the gh-pages branch.

Build the project:
npm run build

Deploy to GitHub Pages:
npm run deploy


Your live site is automatically published at:

https://movies.gavinmoore.ca

🧪 Environment Variables (If Needed)

Create a .env file for sensitive keys:

VITE_TMDB_API_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key


Do not commit .env files to GitHub.

🔮 Future Enhancements (Optional)

Movie progress tracking

Stats dashboard (top genres, avg ratings, longest runtime)

Import/export all data (JSON)

Password-protected admin tools

Smart auto-tagging (detect genre clusters from TMDB data)

👤 Author

Gavin Moore
Toronto, Canada
https://gavinmoore.ca
