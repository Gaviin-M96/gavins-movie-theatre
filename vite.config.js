import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // base: "/gavins-movie-theatre/",  // ❌ remove this line
  base: "/",                          // or set explicitly to "/"
  plugins: [react()],
});
