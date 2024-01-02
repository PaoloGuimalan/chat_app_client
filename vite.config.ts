import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// console.log(path.resolve(__dirname))
 
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})