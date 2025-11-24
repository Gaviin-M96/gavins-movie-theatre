import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // base: "/gavins-movie-theatre/",
  base: "/",
  plugins: [react()],
});
