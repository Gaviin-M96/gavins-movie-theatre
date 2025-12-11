import { movies } from "../src/movies_updated.js";

const duplicates = {};
const seen = new Map();

movies.forEach((m) => {
  const key = m.title.trim().toLowerCase();
  if (seen.has(key)) {
    duplicates[key] = duplicates[key] || [seen.get(key)];
    duplicates[key].push(m.id);
  } else {
    seen.set(key, m.id);
  }
});

console.log("Duplicate titles found:");
console.log(duplicates);
